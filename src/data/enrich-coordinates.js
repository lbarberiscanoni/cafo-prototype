#!/usr/bin/env node

/**
 * County Coordinates Enrichment
 * 
 * Extracts county coordinates from SimpleMaps CSV into county-coordinates.json
 * This is merged into real-data.json by merge.js
 * 
 * SETUP:
 * 1. Download free SimpleMaps CSV from: https://simplemaps.com/data/us-counties
 * 2. Extract the ZIP and place "uscounties.csv" in the same folder
 * 3. Run: node enrich-coordinates.js [uscounties.csv] [output.json]
 */

const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_CSV = './uscounties.csv';
const DEFAULT_OUTPUT = './county-coordinates.json';

// State name to abbreviation
const STATE_ABBREVS = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
  'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
  'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
  'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
  'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
  'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY', 'Puerto Rico': 'PR'
};

// Non-county state coordinates (from ADR-010)
const NON_COUNTY_COORDINATES = {
  // Alaska OCS Regions
  'AK': {
    'Anchorage': { lat: 61.22, lng: -149.90 },
    'Northern': { lat: 64.84, lng: -147.72 },
    'Southcentral': { lat: 61.58, lng: -149.44 },
    'Southeast': { lat: 58.30, lng: -134.42 },
    'Western': { lat: 60.79, lng: -161.76 }
  },
  // Connecticut DCF Regions
  'CT': {
    'R1': { lat: 41.19, lng: -73.20 },
    'R2': { lat: 41.31, lng: -72.93 },
    'R3': { lat: 41.56, lng: -72.65 },
    'R4': { lat: 41.77, lng: -72.67 },
    'R5': { lat: 41.56, lng: -73.05 },
    'R6': { lat: 41.54, lng: -72.81 }
  },
  // Washington DCYF Regions
  'WA': {
    'Region 1': { lat: 47.66, lng: -117.43 },
    'Region 2': { lat: 46.60, lng: -120.51 },
    'Region 3': { lat: 47.98, lng: -122.20 },
    'Region 4': { lat: 47.61, lng: -122.33 },
    'Region 5': { lat: 47.25, lng: -122.44 },
    'Region 6': { lat: 45.64, lng: -122.66 }
  },
  // DC
  'DC': {
    'District of Columbia': { lat: 38.91, lng: -77.04 }
  }
};

// Parse CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Handle quoted fields with commas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

// Normalize county name for matching
function normalizeCountyName(name) {
  return name
    .toLowerCase()
    .replace(/\s+county$/i, '')
    .replace(/\s+parish$/i, '')  // Louisiana
    .replace(/\s+borough$/i, '') // Alaska
    .replace(/\s+census area$/i, '') // Alaska
    .replace(/\s+municipality$/i, '') // Alaska
    .replace(/['']/g, "'")
    .replace(/[-.]/g, ' ')
    .trim();
}

function enrichCoordinates(csvPath, outputPath) {
  console.log('📍 COUNTY COORDINATES ENRICHMENT');
  console.log('═'.repeat(60));
  console.log(`CSV file: ${csvPath}`);
  console.log(`Output:   ${outputPath}`);
  console.log('');
  
  // Check CSV exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: ${csvPath} not found`);
    console.log('\n📥 DOWNLOAD INSTRUCTIONS:');
    console.log('   1. Visit: https://simplemaps.com/data/us-counties');
    console.log('   2. Click "Download Free Basic Database"');
    console.log('   3. Extract the ZIP file');
    console.log('   4. Place "uscounties.csv" in this folder');
    console.log('   5. Run this script again');
    process.exit(1);
  }
  
  // Load SimpleMaps CSV
  console.log('📖 Loading SimpleMaps CSV...');
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const simpleMapCounties = parseCSV(csvText);
  console.log(`   Found ${simpleMapCounties.length} counties`);
  
  // Build coordinate lookup: state_normalized-county-name -> { lat, lng, population }
  console.log('\n🔄 Building coordinate lookup...');
  const coordinates = {
    counties: {},
    nonCounty: NON_COUNTY_COORDINATES
  };
  
  for (const county of simpleMapCounties) {
    const stateName = county.state_name || county.state;
    const stateAbbrev = STATE_ABBREVS[stateName] || county.state_id;
    const countyName = county.county || county.name;
    
    if (!stateAbbrev || !countyName) continue;
    
    const lat = parseFloat(county.lat);
    const lng = parseFloat(county.lng);
    const population = parseInt(county.population, 10);
    
    if (isNaN(lat) || isNaN(lng)) continue;
    
    // Key format: STATE_normalizedcountyname
    const key = `${stateAbbrev}_${normalizeCountyName(countyName)}`;
    coordinates.counties[key] = {
      lat,
      lng,
      population: isNaN(population) ? null : population
    };
  }
  
  console.log(`   Created ${Object.keys(coordinates.counties).length} county entries`);
  
  // Count non-county regions
  let nonCountyCount = 0;
  for (const state of Object.values(NON_COUNTY_COORDINATES)) {
    nonCountyCount += Object.keys(state).length;
  }
  console.log(`   Added ${nonCountyCount} non-county region entries`);
  
  // Build output
  const output = {
    metadata: {
      source: path.basename(csvPath),
      generated: new Date().toISOString(),
      countyCount: Object.keys(coordinates.counties).length,
      nonCountyRegionCount: nonCountyCount
    },
    coordinates: coordinates
  };
  
  // Save output
  console.log('\n💾 Saving coordinates...');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`   ✓ Saved: ${outputPath} (${sizeKB} KB)`);
  
  console.log('\n📊 SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`County coordinates: ${Object.keys(coordinates.counties).length}`);
  console.log(`Non-county regions: ${nonCountyCount}`);
  console.log('\n✅ Coordinates ready for merge!');
}

// Main
const csvPath = process.argv[2] || DEFAULT_CSV;
const outputPath = process.argv[3] || DEFAULT_OUTPUT;

enrichCoordinates(csvPath, outputPath);