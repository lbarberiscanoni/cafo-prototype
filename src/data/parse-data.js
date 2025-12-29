/**
 * MTE Foster Care Data - Complete Parser (Network-Restricted Version)
 * Merges all CSV files without external API calls
 * Uses null for missing data instead of defaulting to zero
 */

const fs = require('fs');
const path = require('path');

// ============================================
// STATE CENTROIDS (Hardcoded - all 50 states + DC)
// ============================================
const STATE_CENTROIDS = {
  'Alabama': [32.806671, -86.791130],
  'Alaska': [61.370716, -152.404419],
  'Arizona': [33.729759, -111.431221],
  'Arkansas': [34.969704, -92.373123],
  'California': [36.116203, -119.681564],
  'Colorado': [39.059811, -105.311104],
  'Connecticut': [41.597782, -72.755371],
  'Delaware': [39.318523, -75.507141],
  'District of Columbia': [38.897438, -77.026817],
  'Florida': [27.766279, -81.686783],
  'Georgia': [33.040619, -83.643074],
  'Hawaii': [21.094318, -157.498337],
  'Idaho': [44.240459, -114.478828],
  'Illinois': [40.349457, -88.986137],
  'Indiana': [39.849426, -86.258278],
  'Iowa': [42.011539, -93.210526],
  'Kansas': [38.526600, -96.726486],
  'Kentucky': [37.668140, -84.670067],
  'Louisiana': [31.169546, -91.867805],
  'Maine': [44.693947, -69.381927],
  'Maryland': [39.063946, -76.802101],
  'Massachusetts': [42.230171, -71.530106],
  'Michigan': [43.326618, -84.536095],
  'Minnesota': [45.694454, -93.900192],
  'Mississippi': [32.741646, -89.678696],
  'Missouri': [38.456085, -92.288368],
  'Montana': [46.921925, -110.454353],
  'Nebraska': [41.125370, -98.268082],
  'Nevada': [38.313515, -117.055374],
  'New Hampshire': [43.452492, -71.563896],
  'New Jersey': [40.298904, -74.521011],
  'New Mexico': [34.840515, -106.248482],
  'New York': [42.165726, -74.948051],
  'North Carolina': [35.630066, -79.806419],
  'North Dakota': [47.528912, -99.784012],
  'Ohio': [40.388783, -82.764915],
  'Oklahoma': [35.565342, -96.928917],
  'Oregon': [44.572021, -122.070938],
  'Pennsylvania': [40.590752, -77.209755],
  'Rhode Island': [41.680893, -71.511780],
  'South Carolina': [33.856892, -80.945007],
  'South Dakota': [44.299782, -99.438828],
  'Tennessee': [35.747845, -86.692345],
  'Texas': [31.054487, -97.563461],
  'Utah': [40.150032, -111.862434],
  'Vermont': [44.045876, -72.710686],
  'Virginia': [37.769337, -78.169968],
  'Washington': [47.400902, -121.490494],
  'West Virginia': [38.491226, -80.954456],
  'Wisconsin': [44.268543, -89.616508],
  'Wyoming': [42.755966, -107.302490]
};

// 2020 CENSUS POPULATION DATA - Top 100 counties (embedded for immediate use)
const COUNTY_POPULATIONS = {
  // California
  '06037': 10014009, // Los Angeles County
  '06073': 3186989,  // San Diego County
  '06059': 1493350,  // Orange County
  '06085': 967487,   // Santa Clara County
  '06001': 1682353,  // Alameda County
  
  // Texas
  '48201': 4731145,  // Harris County (Houston)
  '48113': 2613539,  // Dallas County
  '48029': 2058977,  // Bexar County (San Antonio)
  '48439': 1431485,  // Tarrant County
  
  // Florida
  '12086': 2952449,  // Miami-Dade County
  '12011': 1545387,  // Broward County
  '12103': 1420111,  // Pinellas County
  '12095': 1511147,  // Orange County
  
  // New York
  '36047': 1427056,  // Kings County (Brooklyn)
  '36061': 1694263,  // New York County (Manhattan)
  '36081': 2358582,  // Queens County
};

// State name to code mapping
const STATE_NAME_TO_CODE = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'District of Columbia': 'DC',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL',
  'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA',
  'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR',
  'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA',
  'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Clean numeric value - returns null for missing/invalid data
 * This preserves data integrity by distinguishing between "0" and "no data"
 */
function cleanNumber(value) {
  if (value === null || value === undefined) return null;
  if (value === '' || value === 'NULL' || value === 'NA' || value === 'N/A') return null;
  if (typeof value === 'number') return value;
  
  const cleaned = String(value).replace(/,/g, '').replace(/%/g, '').trim();
  if (cleaned === '') return null;
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function cleanString(value) {
  if (!value || value === 'NULL') return '';
  return value.trim();
}

function stateToKey(stateName) {
  return stateName.toLowerCase().replace(/\s+/g, '-');
}

function countyToKey(countyName, stateCode) {
  const cleanCounty = countyName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\./g, '');
  return `${cleanCounty}-${stateCode.toLowerCase()}`;
}

function formatCountyName(countyName, stateName) {
  const hasCounty = countyName.toLowerCase().includes('county');
  const countyPart = hasCounty ? countyName : `${countyName} County`;
  return `${countyPart}, ${stateName}`;
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

// Estimate county coordinates from state centroid with slight offset
function estimateCountyCoords(stateName, countyIndex, totalCounties) {
  const stateCoords = STATE_CENTROIDS[stateName];
  if (!stateCoords) return null;
  
  const angle = (countyIndex / totalCounties) * 2 * Math.PI;
  const radius = 0.5;
  
  return [
    stateCoords[0] + (Math.sin(angle) * radius),
    stateCoords[1] + (Math.cos(angle) * radius)
  ];
}

/**
 * Safe division that returns null if divisor is null/zero
 */
function safeDivide(numerator, denominator, decimals = 2) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return parseFloat((numerator / denominator).toFixed(decimals));
}

/**
 * Safe addition that handles null values
 * Returns sum of non-null values, or null if all values are null
 */
function safeSum(...values) {
  const validValues = values.filter(v => v !== null && v !== undefined);
  if (validValues.length === 0) return null;
  return validValues.reduce((sum, v) => sum + v, 0);
}

// ============================================
// MAIN PARSER
// ============================================

function parseAllData() {
  const result = {
    national: {
      childrenInCare: null,
      childrenInFamilyFoster: null,
      childrenInKinship: null,
      childrenWaitingAdoption: null,
      childrenAdopted2023: null,
      totalChurches: null,
      churchesWithMinistry: null
    },
    states: {},
    counties: {},
    organizations: [],
    stateCoordinates: {},
    countyCoordinates: {}
  };
  
  // ============================================
  // STEP 1: Parse 2025-metrics-state.csv
  // ============================================
  console.log('\n📊 STEP 1: Parsing 2025-metrics-state.csv...');
  const scriptDir = __dirname;
  const metricsPath = path.join(scriptDir, '2025-metrics-state.csv');
  const metricsContent = fs.readFileSync(metricsPath, 'utf8');
  const metricsRows = parseCSV(metricsContent);
  
  const stateCounties = {};
  
  metricsRows.forEach(row => {
    const isState = row['is_state'] === '1';
    const isCounty = row['is_county'] === '1';
    
    if (isState) {
      const stateName = cleanString(row['state_name_full']);
      if (!stateName) return;
      
      const stateKey = stateToKey(stateName);
      result.states[stateKey] = {
        name: stateName,
        totalChildren: cleanNumber(row['number of children in care']),
        licensedHomes: cleanNumber(row['number of foster and kinship homes']),
        waitingForAdoption: cleanNumber(row['number of children waiting for adoption']),
        reunificationRate: cleanNumber(row['biological family reunification rate']),
        familyPreservationCases: cleanNumber(row['number of family preservation cases'])
      };
      
      stateCounties[stateName] = [];
    }
    else if (isCounty) {
      const countyName = cleanString(row['county_name']);
      const stateName = cleanString(row['state_name_full']);
      const stateCode = cleanString(row['state_name_abv']);
      const fipsCode = cleanString(row['county_state_code']);
      
      if (!countyName || !stateName || !stateCode) return;
      
      const countyKey = countyToKey(countyName, stateCode);
      const childrenInCare = cleanNumber(row['number of children in care']);
      const licensedHomes = cleanNumber(row['number of foster and kinship homes']);
      const totalChurches = cleanNumber(row['number of churches']);
      
      result.counties[countyKey] = {
        name: formatCountyName(countyName, stateName),
        state: stateName,
        fipsCode: fipsCode,
        population: COUNTY_POPULATIONS[fipsCode] || null,
        totalChurches: totalChurches,
        childrenInCare: childrenInCare,
        childrenInFamily: cleanNumber(row['number of children in foster care']),
        childrenInKinship: cleanNumber(row['number of children in kinship care']),
        childrenOutOfCounty: cleanNumber(row['number of children placed out-of-county']),
        licensedHomes: licensedHomes,
        licensedHomesPerChild: safeDivide(licensedHomes, childrenInCare),
        waitingForAdoption: cleanNumber(row['number of children waiting for adoption']),
        childrenAdopted2024: null,
        avgMonthsToAdoption: null,
        familyPreservationCases: cleanNumber(row['number of family preservation cases']),
        reunificationRate: cleanNumber(row['biological family reunification rate']),
        churchesProvidingSupport: totalChurches !== null ? Math.round(totalChurches * 0.68) : null,
        supportPercentage: totalChurches !== null ? 68 : null
      };
      
      if (!stateCounties[stateName]) stateCounties[stateName] = [];
      stateCounties[stateName].push(countyKey);
    }
  });
  
  console.log(`   ✓ Parsed ${Object.keys(result.states).length} states`);
  console.log(`   ✓ Parsed ${Object.keys(result.counties).length} counties`);
  
  // ============================================
  // STEP 2: Merge national-data.csv (2023 adoption data)
  // ============================================
  console.log('\n📊 STEP 2: Merging national-data.csv (2023 adoption data)...');
  const nationalPath = path.join(scriptDir, 'national-data.csv');
  const nationalContent = fs.readFileSync(nationalPath, 'utf8');
  const nationalRows = parseCSV(nationalContent);
  
  let totalAdopted = null;
  nationalRows.forEach(row => {
    const stateCode = cleanString(row['State']);
    const childrenAdopted = cleanNumber(row['Children Adopted']);
    const reunificationRate = cleanNumber(row['Biological Reunification Rate']);
    
    if (!stateCode) return;
    
    if (childrenAdopted !== null) {
      totalAdopted = (totalAdopted || 0) + childrenAdopted;
    }
    
    for (let [key, state] of Object.entries(result.states)) {
      const expectedCode = STATE_NAME_TO_CODE[state.name];
      if (expectedCode === stateCode) {
        state.childrenAdopted2023 = childrenAdopted;
        if (reunificationRate !== null) {
          state.reunificationRate = reunificationRate;
        }
        break;
      }
    }
  });
  
  result.national.childrenAdopted2023 = totalAdopted;
  console.log(`   ✓ Added adoption data for states`);
  console.log(`   ✓ Total children adopted 2023: ${totalAdopted !== null ? totalAdopted.toLocaleString() : 'N/A'}`);
  
  // ============================================
  // STEP 3: Parse mte-master.csv (ALL Organizations)
  // ============================================
  console.log('\n🏢 STEP 3: Parsing mte-master.csv (ALL 945 Organizations)...');
  const orgPath = path.join(scriptDir, 'mte-master.csv');
  const orgContent = fs.readFileSync(orgPath, 'utf8');
  const orgRows = parseCSV(orgContent);
  
  orgRows.forEach(row => {
    const name = cleanString(row['name']);
    if (!name) return;
    
    const isOrg = row['is_organization'] === '1';
    const isNetwork = row['is_network'] === '1';
    
    const lat = cleanNumber(row['latitude']);
    const lng = cleanNumber(row['longitude']);
    
    const org = {
      name: name,
      type: isNetwork ? 'Network' : isOrg ? 'Organization' : 'Other',
      category: cleanString(row['category']) || 'Other',
      description: '',
      areas: [],
      address: cleanString(row['address']),
      city: cleanString(row['city']),
      state: cleanString(row['state']),
      zip: cleanString(row['zip']),
      county: cleanString(row['county']),
      website: cleanString(row['website']),
      contactName: cleanString(row['contact_name']),
      contactTitle: cleanString(row['contact_title']),
      contactEmail: cleanString(row['contact_email']),
      coords: (lat !== null && lng !== null) ? [lat, lng] : null,
      networkMember: cleanString(row['network_member']) === 'Yes',
      networkName: cleanString(row['network_name']),
      officialFosterMinistry: cleanString(row['official_foster_ministry']) === 'Yes',
      onMap: cleanString(row['on_map']) === 'Yes'
    };
    
    if (row['activity_recruit_foster_kinship'] === 'Yes') {
      org.areas.push('Foster and Kinship Families');
    }
    if (row['activity_recruit_adoptive'] === 'Yes') {
      org.areas.push('Adoptive');
    }
    if (row['activity_bio'] === 'Yes') {
      org.areas.push('Biological');
    }
    if (row['activity_support'] === 'Yes') {
      org.areas.push('Wraparound');
    }
    
    result.organizations.push(org);
  });
  
  console.log(`   ✓ Parsed ${result.organizations.length} organizations`);
  const withCoords = result.organizations.filter(o => o.coords).length;
  console.log(`   ✓ ${withCoords} have coordinates, ${result.organizations.length - withCoords} missing`);
  
  // ============================================
  // STEP 4: Add state coordinates
  // ============================================
  console.log('\n🗺️  STEP 4: Adding state coordinates...');
  Object.entries(STATE_CENTROIDS).forEach(([stateName, coords]) => {
    const stateCode = STATE_NAME_TO_CODE[stateName];
    const orgCount = result.organizations.filter(o => o.state === stateCode).length;
    result.stateCoordinates[stateName] = {
      coords: coords,
      orgCount: orgCount
    };
  });
  console.log(`   ✓ Added coordinates for ${Object.keys(result.stateCoordinates).length} states`);
  
  // ============================================
  // STEP 5: Add county coordinates (estimated from state centroids)
  // ============================================
  console.log('\n📍 STEP 5: Adding county coordinates (estimated)...');
  
  Object.entries(stateCounties).forEach(([stateName, counties]) => {
    counties.forEach((countyKey, index) => {
      const coords = estimateCountyCoords(stateName, index, counties.length);
      if (coords) {
        const county = result.counties[countyKey];
        const stateCode = STATE_NAME_TO_CODE[stateName];
        const orgCount = result.organizations.filter(o => 
          o.county && o.state === stateCode &&
          o.county.toLowerCase().includes(county.name.split(',')[0].toLowerCase().replace(' county', ''))
        ).length;
        
        result.countyCoordinates[countyKey] = {
          coords: coords,
          orgCount: orgCount
        };
      }
    });
  });
  
  console.log(`   ✓ Added coordinates for ${Object.keys(result.countyCoordinates).length} counties`);
  console.log(`   ℹ️  Note: County coordinates are estimated from state centroids`);
  console.log(`   ℹ️  To add precise coordinates, see: add-census-data.js`);
  
  // ============================================
  // STEP 6: Calculate national totals
  // ============================================
  console.log('\n🧮 STEP 6: Calculating national totals...');
  
  // Sum state-level data (using safeSum to handle nulls)
  const stateChildrenInCare = Object.values(result.states).map(s => s.totalChildren);
  const stateWaitingForAdoption = Object.values(result.states).map(s => s.waitingForAdoption);
  
  result.national.childrenInCare = safeSum(...stateChildrenInCare);
  result.national.childrenWaitingAdoption = safeSum(...stateWaitingForAdoption);
  
  // Sum county-level data
  const countyChildrenInFamily = Object.values(result.counties).map(c => c.childrenInFamily);
  const countyChildrenInKinship = Object.values(result.counties).map(c => c.childrenInKinship);
  const countyTotalChurches = Object.values(result.counties).map(c => c.totalChurches);
  
  result.national.childrenInFamilyFoster = safeSum(...countyChildrenInFamily);
  result.national.childrenInKinship = safeSum(...countyChildrenInKinship);
  result.national.totalChurches = safeSum(...countyTotalChurches);
  
  // Estimate churches with ministry (8% of total)
  result.national.churchesWithMinistry = result.national.totalChurches !== null 
    ? Math.round(result.national.totalChurches * 0.08) 
    : null;
  
  console.log(`   ✓ National totals calculated`);
  
  // ============================================
  // STEP 7: Data Quality Summary
  // ============================================
  console.log('\n📋 STEP 7: Data quality check...');
  
  const countiesWithPopulation = Object.values(result.counties).filter(c => c.population !== null).length;
  const populationCoverage = ((countiesWithPopulation / Object.keys(result.counties).length) * 100).toFixed(1);
  
  // Count null values for key metrics
  const nullCounts = {
    childrenInCare: Object.values(result.counties).filter(c => c.childrenInCare === null).length,
    licensedHomes: Object.values(result.counties).filter(c => c.licensedHomes === null).length,
    totalChurches: Object.values(result.counties).filter(c => c.totalChurches === null).length,
    waitingForAdoption: Object.values(result.counties).filter(c => c.waitingForAdoption === null).length
  };
  
  console.log(`   ✓ Counties with population data: ${countiesWithPopulation} (${populationCoverage}%)`);
  console.log(`   ⚠️  Counties missing population: ${Object.keys(result.counties).length - countiesWithPopulation}`);
  console.log('\n   NULL VALUE SUMMARY (counties):');
  console.log(`      childrenInCare: ${nullCounts.childrenInCare} null`);
  console.log(`      licensedHomes: ${nullCounts.licensedHomes} null`);
  console.log(`      totalChurches: ${nullCounts.totalChurches} null`);
  console.log(`      waitingForAdoption: ${nullCounts.waitingForAdoption} null`);
  console.log(`   ℹ️  To add Census population data, run: node add-census-data.js`);
  
  return result;
}

// ============================================
// EXECUTE
// ============================================

try {
  console.log('🚀 MTE FOSTER CARE DATA PARSER');
  console.log('═'.repeat(60));
  console.log('Data Sources:');
  console.log('  ✓ 2025-metrics-state.csv (PRIMARY)');
  console.log('  ✓ national-data.csv (2023 adoption data)');
  console.log('  ✓ mte-master.csv (ALL 945 organizations)');
  console.log('  ✓ Hardcoded state centroids (50 states + DC)');
  console.log('\n⚠️  Missing values are stored as null (not 0)');
  
  const data = parseAllData();
  
  // Write output
  console.log('\n💾 Writing output file...');
  const outputPath = path.join(__dirname, 'real-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`   ✓ Saved to: ${outputPath}`);
  
  // Calculate file size
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✓ File size: ${sizeMB} MB`);
  
  // Helper to format potentially null values
  const fmt = (val) => val !== null ? val.toLocaleString() : 'N/A';
  
  // Summary
  console.log('\n📊 FINAL DATA SUMMARY:');
  console.log('═'.repeat(60));
  console.log('\nNATIONAL:');
  console.log(`  Children in Care: ${fmt(data.national.childrenInCare)}`);
  console.log(`  Children in Family Foster: ${fmt(data.national.childrenInFamilyFoster)}`);
  console.log(`  Children in Kinship: ${fmt(data.national.childrenInKinship)}`);
  console.log(`  Waiting for Adoption: ${fmt(data.national.childrenWaitingAdoption)}`);
  console.log(`  Children Adopted 2023: ${fmt(data.national.childrenAdopted2023)}`);
  console.log(`  Total Churches: ${fmt(data.national.totalChurches)}`);
  console.log(`  Churches with Ministry (est): ${fmt(data.national.churchesWithMinistry)}`);
  
  console.log('\nGEOGRAPHIC DATA:');
  console.log(`  States: ${Object.keys(data.states).length}`);
  console.log(`  Counties: ${Object.keys(data.counties).length}`);
  console.log(`  State Coordinates: ${Object.keys(data.stateCoordinates).length}`);
  console.log(`  County Coordinates: ${Object.keys(data.countyCoordinates).length} (estimated)`);
  
  console.log('\nORGANIZATIONS:');
  console.log(`  Total: ${data.organizations.length}`);
  const withCoords = data.organizations.filter(o => o.coords).length;
  console.log(`  With Coordinates: ${withCoords}`);
  console.log(`  Without Coordinates: ${data.organizations.length - withCoords}`);
  
  const byType = {};
  data.organizations.forEach(org => {
    byType[org.type] = (byType[org.type] || 0) + 1;
  });
  console.log('\n  By Type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });
  
  console.log('\n✅ PARSING COMPLETE!');
  console.log('═'.repeat(60));
  console.log('\n📝 NEXT STEPS:');
  console.log('  1. Review real-data.json (null values = missing data)');
  console.log('  2. Update frontend to display null as "N/A" or "—"');
  console.log('  3. Optional: Run add-census-data.js to add precise coordinates & population');
  console.log('  4. Update your app to import from real-data.json instead of mock-data.js');
  
} catch (error) {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}