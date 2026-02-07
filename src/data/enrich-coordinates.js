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

// Non-county state coordinates
// Includes regions, districts, and cities used in MTE metrics data
const NON_COUNTY_COORDINATES = {
  // Alaska OCS Regions
  'AK': {
    'Anchorage': { lat: 61.22, lng: -149.90 },
    'Northern': { lat: 64.84, lng: -147.72 },
    'Southcentral': { lat: 61.58, lng: -149.44 },
    'Southeast': { lat: 58.30, lng: -134.42 },
    'Western': { lat: 60.79, lng: -161.76 }
  },
  
  // Connecticut - DCF Regions (R1-R6) AND county names used in metrics
  'CT': {
    // Original region codes
    'R1': { lat: 41.19, lng: -73.20 },
    'R2': { lat: 41.31, lng: -72.93 },
    'R3': { lat: 41.56, lng: -72.65 },
    'R4': { lat: 41.77, lng: -72.67 },
    'R5': { lat: 41.56, lng: -73.05 },
    'R6': { lat: 41.54, lng: -72.81 },
    // County names (CT abolished counties but metrics data uses them)
    'Fairfield': { lat: 41.22, lng: -73.32 },
    'Hartford': { lat: 41.76, lng: -72.69 },
    'Litchfield': { lat: 41.75, lng: -73.19 },
    'Middlesex': { lat: 41.44, lng: -72.52 },
    'New Haven': { lat: 41.35, lng: -72.90 },
    'New London': { lat: 41.52, lng: -72.10 },
    'Tolland': { lat: 41.87, lng: -72.33 },
    'Windham': { lat: 41.83, lng: -72.00 }
  },
  
  // DC
  'DC': {
    'District of Columbia': { lat: 38.91, lng: -77.04 }
  },
  
  // New Hampshire - Mix of counties and district office cities
  'NH': {
    // Counties
    'Belknap': { lat: 43.52, lng: -71.42 },
    'Carroll': { lat: 43.87, lng: -71.20 },
    'Cheshire': { lat: 42.92, lng: -72.25 },
    'Coos': { lat: 44.69, lng: -71.31 },
    'Grafton': { lat: 43.94, lng: -71.82 },
    'Hillsborough': { lat: 42.91, lng: -71.72 },
    'Merrimack': { lat: 43.30, lng: -71.68 },
    'Rockingham': { lat: 42.99, lng: -71.09 },
    'Strafford': { lat: 43.29, lng: -71.03 },
    'Sullivan': { lat: 43.36, lng: -72.22 },
    // District office cities
    'Berlin': { lat: 44.47, lng: -71.19 },
    'Claremont': { lat: 43.38, lng: -72.35 },
    'Concord': { lat: 43.21, lng: -71.54 },
    'Conway': { lat: 43.98, lng: -71.13 },
    'Keene': { lat: 42.93, lng: -72.28 },
    'Laconia': { lat: 43.53, lng: -71.47 },
    'Littleton': { lat: 44.31, lng: -71.77 },
    'Manchester': { lat: 42.99, lng: -71.45 },
    'Seacoast': { lat: 43.07, lng: -70.76 },  // Portsmouth area
    'Southern': { lat: 42.87, lng: -71.38 },  // Nashua area
    'Southern Telework': { lat: 42.87, lng: -71.38 }
  },
  
  // South Dakota - District office cities
  'SD': {
    'Aberdeen': { lat: 45.46, lng: -98.49 },
    'Brookings': { lat: 44.31, lng: -96.80 },
    'Chamberlain': { lat: 43.81, lng: -99.33 },
    'Deadwood*': { lat: 44.38, lng: -103.73 },
    'Eagle Butte': { lat: 45.00, lng: -101.23 },
    'Hot Springs': { lat: 43.43, lng: -103.48 },
    'Huron': { lat: 44.36, lng: -98.21 },
    'Lake Andes': { lat: 43.16, lng: -98.54 },
    'Mission': { lat: 43.31, lng: -100.66 },
    'Mitchell': { lat: 43.71, lng: -98.03 },
    'Mobridge': { lat: 45.54, lng: -100.43 },
    'Pierre': { lat: 44.37, lng: -100.35 },
    'Rapid City': { lat: 44.08, lng: -103.23 },
    'Sioux Falls': { lat: 43.55, lng: -96.73 },
    'Sturgis': { lat: 44.41, lng: -103.51 },
    'Vermillion': { lat: 42.78, lng: -96.93 },
    'Watertown': { lat: 44.90, lng: -97.12 },
    'Winner': { lat: 43.38, lng: -99.86 },
    'Yankton': { lat: 42.87, lng: -97.40 }
  },
  
  // Vermont - District office cities
  'VT': {
    'Barre': { lat: 44.20, lng: -72.50 },
    'Bennington': { lat: 42.88, lng: -73.20 },
    'Brattleboro': { lat: 42.85, lng: -72.56 },
    'Burlington': { lat: 44.48, lng: -73.21 },
    'Hartford': { lat: 43.66, lng: -72.34 },
    'Middlebury': { lat: 44.02, lng: -73.17 },
    'Morrisville': { lat: 44.56, lng: -72.60 },
    'Newport': { lat: 44.94, lng: -72.21 },
    'Rutland': { lat: 43.61, lng: -72.97 },
    'Springfield': { lat: 43.30, lng: -72.48 },
    'St. Albans': { lat: 44.81, lng: -73.08 },
    'St. Johnsbury': { lat: 44.42, lng: -72.02 }
  },
  
  // Washington - DCYF Regions AND county names used in metrics
  'WA': {
    // Original region codes
    'Region 1': { lat: 47.66, lng: -117.43 },
    'Region 2': { lat: 46.60, lng: -120.51 },
    'Region 3': { lat: 47.98, lng: -122.20 },
    'Region 4': { lat: 47.61, lng: -122.33 },
    'Region 5': { lat: 47.25, lng: -122.44 },
    'Region 6': { lat: 45.64, lng: -122.66 },
    // County names (metrics data uses county names with region geography type)
    'Adams': { lat: 46.98, lng: -118.56 },
    'Asotin': { lat: 46.19, lng: -117.21 },
    'Benton': { lat: 46.24, lng: -119.52 },
    'Chelan': { lat: 47.86, lng: -120.62 },
    'Clallam': { lat: 48.11, lng: -123.94 },
    'Clark': { lat: 45.78, lng: -122.48 },
    'Columbia': { lat: 46.30, lng: -117.91 },
    'Cowlitz': { lat: 46.19, lng: -122.68 },
    'Douglas': { lat: 47.74, lng: -119.69 },
    'Ferry': { lat: 48.47, lng: -118.52 },
    'Franklin': { lat: 46.54, lng: -118.89 },
    'Garfield': { lat: 46.43, lng: -117.54 },
    'Grant': { lat: 47.21, lng: -119.45 },
    'Grays Harbor': { lat: 47.15, lng: -123.76 },
    'Island': { lat: 48.16, lng: -122.68 },
    'Jefferson': { lat: 47.76, lng: -123.51 },
    'King': { lat: 47.49, lng: -121.84 },
    'Kitsap': { lat: 47.64, lng: -122.65 },
    'Kittitas': { lat: 47.12, lng: -120.68 },
    'Klickitat': { lat: 45.87, lng: -120.78 },
    'Lewis': { lat: 46.58, lng: -122.38 },
    'Lincoln': { lat: 47.58, lng: -118.41 },
    'Mason': { lat: 47.35, lng: -123.18 },
    'Okanogan': { lat: 48.55, lng: -119.74 },
    'Pacific': { lat: 46.56, lng: -123.78 },
    'Pend Oreille': { lat: 48.53, lng: -117.27 },
    'Pierce': { lat: 47.04, lng: -122.13 },
    'San Juan': { lat: 48.53, lng: -123.02 },
    'Skagit': { lat: 48.48, lng: -121.80 },
    'Skamania': { lat: 46.02, lng: -121.92 },
    'Snohomish': { lat: 48.04, lng: -121.76 },
    'Spokane': { lat: 47.62, lng: -117.40 },
    'Stevens': { lat: 48.40, lng: -117.86 },
    'Thurston': { lat: 46.93, lng: -122.78 },
    'Wahkiakum': { lat: 46.29, lng: -123.42 },
    'Walla Walla': { lat: 46.23, lng: -118.48 },
    'Whatcom': { lat: 48.85, lng: -122.08 },
    'Whitman': { lat: 46.90, lng: -117.52 },
    'Yakima': { lat: 46.46, lng: -120.51 }
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