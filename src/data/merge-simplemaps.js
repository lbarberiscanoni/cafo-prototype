#!/usr/bin/env node

/**
 * MERGE SIMPLEMAPS COORDINATES & POPULATION
 * 
 * Adds county coordinates and population from SimpleMaps CSV to real-data.json
 * 
 * SETUP:
 * 1. Download free SimpleMaps CSV from: https://simplemaps.com/data/us-counties
 * 2. Extract the ZIP and place "uscounties.csv" in the same folder
 * 3. Run: node merge-simplemaps.js [real-data.json] [uscounties.csv]
 * 
 * The SimpleMaps Basic (free) database includes:
 * - All 3,234 US counties
 * - Latitude and longitude
 * - Population data
 * - FIPS codes
 */

const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_DATA_FILE = './real-data.json';
const DEFAULT_CSV_FILE = './uscounties.csv';

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

function mergeSimpleMaps(dataPath, csvPath) {
  console.log('📍 SIMPLEMAPS COORDINATES MERGER');
  console.log('═'.repeat(60));
  console.log(`Data file: ${dataPath}`);
  console.log(`CSV file: ${csvPath}`);
  console.log('');
  
  // Check files exist
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Error: ${dataPath} not found`);
    process.exit(1);
  }
  
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
  
  // Load real-data.json
  console.log('📖 Loading real-data.json...');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Count total counties
  let totalCounties = 0;
  for (const state of Object.values(data.states)) {
    totalCounties += state.counties?.length || 0;
  }
  console.log(`   Found ${totalCounties} county records across ${Object.keys(data.states).length} states`);
  
  // Load SimpleMaps CSV
  console.log('\n📖 Loading SimpleMaps CSV...');
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const simpleMapCounties = parseCSV(csvText);
  console.log(`   Found ${simpleMapCounties.length} counties in SimpleMaps`);
  
  // Build lookup: state_abbrev + normalized_county_name -> { lat, lng, population }
  console.log('\n🔄 Building coordinate lookup...');
  const coordsLookup = {};
  
  for (const county of simpleMapCounties) {
    const stateName = county.state_name || county.state;
    const stateAbbrev = STATE_ABBREVS[stateName] || county.state_id;
    const countyName = county.county || county.name;
    
    if (!stateAbbrev || !countyName) continue;
    
    const lat = parseFloat(county.lat);
    const lng = parseFloat(county.lng);
    const population = parseInt(county.population, 10);
    
    if (isNaN(lat) || isNaN(lng)) continue;
    
    const key = `${stateAbbrev}_${normalizeCountyName(countyName)}`;
    coordsLookup[key] = {
      lat,
      lng,
      population: isNaN(population) ? null : population
    };
  }
  
  console.log(`   Created lookup with ${Object.keys(coordsLookup).length} entries`);
  
  // Update coordinates in real-data.json
  console.log('\n📌 Updating county coordinates...');
  let updated = 0;
  let notFound = 0;
  let nonCountyUpdated = 0;
  const notFoundList = [];
  
  for (const [stateAbbrev, state] of Object.entries(data.states)) {
    if (!state.counties) continue;
    
    for (const county of state.counties) {
      const geoType = county.geographyType || 'county';
      
      // Handle non-county geographies (regions, districts, etc.)
      if (geoType !== 'county') {
        const nonCountyCoords = NON_COUNTY_COORDINATES[stateAbbrev];
        if (nonCountyCoords && nonCountyCoords[county.name]) {
          county.coordinates = nonCountyCoords[county.name];
          nonCountyUpdated++;
        }
        continue;
      }
      
      // Look up coordinates
      const key = `${stateAbbrev}_${normalizeCountyName(county.name)}`;
      const coords = coordsLookup[key];
      
      if (coords) {
        county.coordinates = { lat: coords.lat, lng: coords.lng };
        // Only update population if we don't already have it
        if (!county.population && coords.population) {
          county.population = coords.population;
        }
        updated++;
      } else {
        notFound++;
        notFoundList.push(`${county.name}, ${stateAbbrev}`);
      }
    }
  }
  
  console.log(`   ✓ Counties updated: ${updated}`);
  console.log(`   ✓ Non-county regions updated: ${nonCountyUpdated}`);
  
  if (notFound > 0) {
    console.log(`   ⚠️  Not found: ${notFound}`);
    if (notFoundList.length <= 10) {
      notFoundList.forEach(name => console.log(`      - ${name}`));
    } else {
      notFoundList.slice(0, 5).forEach(name => console.log(`      - ${name}`));
      console.log(`      ... and ${notFoundList.length - 5} more`);
    }
  }
  
  // Update metadata
  data.metadata.enrichment = data.metadata.enrichment || {};
  data.metadata.enrichment.simplemaps = {
    merged: new Date().toISOString(),
    countiesUpdated: updated,
    nonCountyRegionsUpdated: nonCountyUpdated,
    notFound: notFound
  };
  
  // Save updated data
  console.log('\n💾 Saving updated data...');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  
  const stats = fs.statSync(dataPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✓ Saved: ${dataPath} (${sizeMB} MB)`);
  
  const coverage = (((updated + nonCountyUpdated) / totalCounties) * 100).toFixed(1);
  console.log('\n📊 SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`Total county records: ${totalCounties}`);
  console.log(`Coordinates added: ${updated + nonCountyUpdated} (${coverage}%)`);
  console.log(`Not found: ${notFound}`);
  console.log('\n✅ SUCCESS! Counties now have GPS coordinates.');
}

// Main
const dataPath = process.argv[2] || DEFAULT_DATA_FILE;
const csvPath = process.argv[3] || DEFAULT_CSV_FILE;

mergeSimpleMaps(dataPath, csvPath);