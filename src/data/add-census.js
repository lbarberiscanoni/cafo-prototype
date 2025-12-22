/**
 * Add Census Data to real-data.json
 * This script fetches precise county coordinates and population data
 * Run this when you have access to Census API or external data sources
 */

const fs = require('fs');
const https = require('https');

// Helper to make HTTPS requests
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function addCensusData() {
  console.log('🏛️  Adding Census Data to real-data.json');
  console.log('═'.repeat(60));
  
  // Load existing data
  console.log('\n📂 Loading real-data.json...');
  const dataPath = '/mnt/user-data/outputs/real-data.json';
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`   ✓ Loaded ${Object.keys(data.counties).length} counties`);
  
  // Fetch population data
  console.log('\n📊 Fetching population data from Census API...');
  try {
    const popUrl = 'https://api.census.gov/data/2020/dec/pl?get=NAME,P1_001N&for=county:*';
    const popData = JSON.parse(await fetchData(popUrl));
    const headers = popData[0];
    const rows = popData.slice(1);
    
    let updated = 0;
    rows.forEach(row => {
      const stateFips = row[2];
      const countyFips = row[3];
      const fipsCode = `${stateFips}${countyFips}`;
      const population = parseInt(row[1]) || 0;
      
      // Find matching county
      for (let [key, county] of Object.entries(data.counties)) {
        if (county.fipsCode === fipsCode) {
          county.population = population;
          updated++;
          break;
        }
      }
    });
    
    console.log(`   ✓ Updated population for ${updated} counties`);
  } catch (error) {
    console.error(`   ⚠️  Population fetch failed: ${error.message}`);
  }
  
  // Fetch coordinates
  console.log('\n📍 Fetching coordinates from Census Gazetteer...');
  try {
    const coordUrl = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_gaz_counties_national.txt';
    const coordData = await fetchData(coordUrl);
    const lines = coordData.split('\n');
    
    let updated = 0;
    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header
      
      const parts = line.split('\t');
      if (parts.length < 10) return;
      
      const geoid = parts[1]; // FIPS code
      const lat = parseFloat(parts[8]);
      const lng = parseFloat(parts[9]);
      
      if (!geoid || isNaN(lat) || isNaN(lng)) return;
      
      // Find matching county
      for (let [key, coords] of Object.entries(data.countyCoordinates)) {
        const county = data.counties[key];
        if (county && county.fipsCode === geoid) {
          data.countyCoordinates[key].coords = [lat, lng];
          updated++;
          break;
        }
      }
    });
    
    console.log(`   ✓ Updated coordinates for ${updated} counties`);
  } catch (error) {
    console.error(`   ⚠️  Coordinates fetch failed: ${error.message}`);
  }
  
  // Save updated data
  console.log('\n💾 Saving updated data...');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('   ✓ Updated real-data.json');
  
  // Summary
  const countiesWithPop = Object.values(data.counties).filter(c => c.population > 0).length;
  const popCoverage = ((countiesWithPop / Object.keys(data.counties).length) * 100).toFixed(1);
  
  console.log('\n📊 UPDATED DATA SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`Counties with population: ${countiesWithPop} (${popCoverage}%)`);
  console.log(`Counties with coordinates: ${Object.keys(data.countyCoordinates).length}`);
  console.log('\n✅ Census data update complete!');
}

// Run if network allows, otherwise provide instructions
addCensusData().catch(error => {
  console.error('\n❌ ERROR:', error.message);
  console.log('\n📝 ALTERNATIVE OPTIONS:');
  console.log('  1. Run this script on a machine with Census API access');
  console.log('  2. Download Census data files manually:');
  console.log('     - Population: https://api.census.gov/data/2020/dec/pl');
  console.log('     - Coordinates: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/');
  console.log('  3. Use the estimated data in real-data.json (works for visualization)');
});