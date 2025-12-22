#!/usr/bin/env node

/**
 * MERGE SIMPLEMAPS COORDINATES
 * 
 * This script merges county coordinates from SimpleMaps CSV into real-data.json
 * 
 * SETUP:
 * 1. Download free SimpleMaps CSV from: https://simplemaps.com/data/us-counties
 * 2. Extract the ZIP and place "uscounties.csv" in the same folder as this script
 * 3. Run: node merge-simplemaps.js
 * 
 * The SimpleMaps Basic (free) database includes:
 * - All 3,234 US counties
 * - Latitude and longitude
 * - FIPS codes for matching
 */

const fs = require('fs');
const path = require('path');

// Find real-data.json
function findDataFile() {
  const possiblePaths = [
    'real-data.json',
    'data/real-data.json',
    path.join(__dirname, 'real-data.json'),
    path.join(__dirname, 'data/real-data.json'),
    path.join(process.cwd(), 'real-data.json'),
    path.join(process.cwd(), 'data/real-data.json')
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  
  throw new Error('real-data.json not found');
}

// Find SimpleMaps CSV
function findSimpleMapsCSV() {
  const possiblePaths = [
    'uscounties.csv',
    'simplemaps_uscounties_basicv1.csv',
    path.join(__dirname, 'uscounties.csv'),
    path.join(process.cwd(), 'uscounties.csv')
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  
  throw new Error(`SimpleMaps CSV not found. Please download from:
https://simplemaps.com/data/us-counties

Place the extracted CSV in the same folder as this script.`);
}

// Parse CSV (simple parser for well-formed CSVs)
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx];
    });
    rows.push(row);
  }
  
  return rows;
}

async function mergeCoordinates() {
  console.log('📍 SIMPLEMAPS COORDINATES MERGER\n');
  console.log('═'.repeat(60));
  
  try {
    // Load real-data.json
    const dataPath = findDataFile();
    console.log(`📂 Found real-data.json: ${dataPath}`);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`   Counties: ${Object.keys(data.counties).length}`);
    
    // Load SimpleMaps CSV
    const csvPath = findSimpleMapsCSV();
    console.log(`\n📂 Found SimpleMaps CSV: ${csvPath}`);
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const counties = parseCSV(csvText);
    console.log(`   SimpleMaps counties: ${counties.length}`);
    
    // Create FIPS → coordinates mapping
    console.log('\n🔄 Matching counties by FIPS code...');
    const coordsMap = {};
    counties.forEach(county => {
      const fips = county.county_fips || county.fips;
      const lat = parseFloat(county.lat);
      const lng = parseFloat(county.lng);
      
      if (fips && !isNaN(lat) && !isNaN(lng)) {
        // Pad FIPS to 5 digits (e.g., "1001" → "01001")
        const paddedFips = fips.padStart(5, '0');
        coordsMap[paddedFips] = [lat, lng];
      }
    });
    
    console.log(`   Created mapping for ${Object.keys(coordsMap).length} counties`);
    
    // Update coordinates in real-data.json
    console.log('\n📌 Updating coordinates...');
    let updated = 0;
    let notFound = 0;
    const notFoundList = [];
    
    for (const [key, coords] of Object.entries(data.countyCoordinates)) {
      const county = data.counties[key];
      if (!county) continue;
      
      const fips = county.fipsCode;
      if (coordsMap[fips]) {
        data.countyCoordinates[key].coords = coordsMap[fips];
        updated++;
      } else {
        notFound++;
        notFoundList.push(`${county.name} (${fips})`);
      }
    }
    
    console.log(`   ✓ Updated: ${updated} counties`);
    if (notFound > 0) {
      console.log(`   ⚠️  Not found: ${notFound} counties`);
      if (notFoundList.length <= 10) {
        notFoundList.forEach(name => console.log(`      - ${name}`));
      } else {
        notFoundList.slice(0, 5).forEach(name => console.log(`      - ${name}`));
        console.log(`      ... and ${notFoundList.length - 5} more`);
      }
    }
    
    // Save updated data
    console.log('\n💾 Saving updated data...');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`   ✓ Saved: ${dataPath}`);
    
    const stats = fs.statSync(dataPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   ✓ File size: ${sizeMB} MB`);
    
    const coverage = ((updated / Object.keys(data.counties).length) * 100).toFixed(1);
    console.log('\n📊 FINAL SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`Coordinates updated: ${updated} of ${Object.keys(data.counties).length} (${coverage}%)`);
    console.log(`\n✅ SUCCESS! Counties now have accurate GPS coordinates.`);
    console.log(`\nRefresh your app - the circles should be gone! 🎯`);
    
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    
    if (error.message.includes('SimpleMaps CSV')) {
      console.log('\n📥 DOWNLOAD INSTRUCTIONS:');
      console.log('   1. Visit: https://simplemaps.com/data/us-counties');
      console.log('   2. Click "Download Free Basic Database"');
      console.log('   3. Extract the ZIP file');
      console.log('   4. Place "uscounties.csv" in the same folder as this script');
      console.log('   5. Run this script again');
    }
    
    process.exit(1);
  }
}

mergeCoordinates();