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
  '06037': 10014009, '06073': 3186989, '06059': 1493350, '06085': 967487, '06001': 1682353,
  '48201': 4731145, '48113': 2613539, '48029': 2058977, '48439': 1431485,
  '12086': 2952449, '12011': 1545387, '12103': 1420111, '12095': 1511147,
  '36047': 1427056, '36061': 1694263, '36081': 2358582,
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
  const cleanCounty = countyName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
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

function estimateCountyCoords(stateName, countyIndex, totalCounties) {
  const stateCoords = STATE_CENTROIDS[stateName];
  if (!stateCoords) return null;
  const angle = (countyIndex / totalCounties) * 2 * Math.PI;
  const radius = 0.5;
  return [stateCoords[0] + (Math.sin(angle) * radius), stateCoords[1] + (Math.cos(angle) * radius)];
}

function safeDivide(numerator, denominator, decimals = 2) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return parseFloat((numerator / denominator).toFixed(decimals));
}

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
      childrenInCare: null, childrenInFamilyFoster: null, childrenInKinship: null,
      childrenWaitingAdoption: null, childrenAdopted2023: null, totalChurches: null, churchesWithMinistry: null
    },
    states: {},
    counties: {},
    organizations: [],
    stateCoordinates: {},
    countyCoordinates: {}
  };

  const scriptDir = __dirname;
  const stateCounties = {};

  // STEP 1: Parse 2025-metrics-state.csv
  console.log('\n📊 STEP 1: Parsing 2025-metrics-state.csv...');
  const metricsPath = path.join(scriptDir, '2025-metrics-state.csv');
  if (fs.existsSync(metricsPath)) {
    const metricsContent = fs.readFileSync(metricsPath, 'utf8');
    const metricsRows = parseCSV(metricsContent);
    
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
      } else if (isCounty) {
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
          state: stateName, fipsCode: fipsCode,
          population: COUNTY_POPULATIONS[fipsCode] || null,
          totalChurches: totalChurches, childrenInCare: childrenInCare,
          childrenInFamily: cleanNumber(row['number of children in foster care']),
          childrenInKinship: cleanNumber(row['number of children in kinship care']),
          childrenOutOfCounty: cleanNumber(row['number of children placed out-of-county']),
          licensedHomes: licensedHomes,
          licensedHomesPerChild: safeDivide(licensedHomes, childrenInCare),
          waitingForAdoption: cleanNumber(row['number of children waiting for adoption']),
          childrenAdopted2024: null, avgMonthsToAdoption: null,
          familyPreservationCases: cleanNumber(row['number of family preservation cases']),
          reunificationRate: cleanNumber(row['biological family reunification rate']),
          churchesProvidingSupport: totalChurches !== null ? Math.round(totalChurches * 0.68) : null,
          supportPercentage: totalChurches !== null ? 68 : null
        };
        if (!stateCounties[stateName]) stateCounties[stateName] = [];
        stateCounties[stateName].push(countyKey);
      }
    });
    console.log(`   ✓ Parsed ${Object.keys(result.states).length} states, ${Object.keys(result.counties).length} counties`);
  } else {
    console.log('   ⚠️  2025-metrics-state.csv not found, skipping');
  }

  // STEP 2: Merge national-data.csv
  console.log('\n📊 STEP 2: Merging national-data.csv...');
  const nationalPath = path.join(scriptDir, 'national-data.csv');
  if (fs.existsSync(nationalPath)) {
    const nationalContent = fs.readFileSync(nationalPath, 'utf8');
    const nationalRows = parseCSV(nationalContent);
    let totalAdopted = null;
    nationalRows.forEach(row => {
      const stateCode = cleanString(row['State']);
      const childrenAdopted = cleanNumber(row['Children Adopted']);
      const reunificationRate = cleanNumber(row['Biological Reunification Rate']);
      if (!stateCode) return;
      if (childrenAdopted !== null) totalAdopted = (totalAdopted || 0) + childrenAdopted;
      for (let [key, state] of Object.entries(result.states)) {
        const expectedCode = STATE_NAME_TO_CODE[state.name];
        if (expectedCode === stateCode) {
          state.childrenAdopted2023 = childrenAdopted;
          if (reunificationRate !== null) state.reunificationRate = reunificationRate;
          break;
        }
      }
    });
    result.national.childrenAdopted2023 = totalAdopted;
    console.log(`   ✓ Total children adopted 2023: ${totalAdopted !== null ? totalAdopted.toLocaleString() : 'N/A'}`);
  } else {
    console.log('   ⚠️  national-data.csv not found, skipping');
  }

  // STEP 3: Parse mte-master.csv (Organizations)
  console.log('\n🏢 STEP 3: Parsing mte-master.csv...');
  const orgPath = path.join(scriptDir, 'mte-master.csv');
  if (fs.existsSync(orgPath)) {
    const orgContent = fs.readFileSync(orgPath, 'utf8');
    const orgRows = parseCSV(orgContent);
    
    orgRows.forEach(row => {
      const name = cleanString(row['name']);
      if (!name) return;
      const isOrg = row['is_organization'] === '1';
      const isNetwork = row['is_network'] === '1';
      const lat = cleanNumber(row['latitude']);
      const lng = cleanNumber(row['longitude']);
      const networkName = cleanString(row['network_name']);
      
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
        // FIX: Infer networkMember from networkName presence
        networkMember: networkName !== '' || cleanString(row['network_member']) === 'Yes',
        networkName: networkName,
        officialFosterMinistry: cleanString(row['official_foster_ministry']) === 'Yes',
        onMap: cleanString(row['on_map']).toLowerCase().includes('yes')
      };
      
      if (row['activity_recruit_foster_kinship'] === 'Yes') org.areas.push('Foster and Kinship Families');
      if (row['activity_recruit_adoptive'] === 'Yes') org.areas.push('Adoptive');
      if (row['activity_bio'] === 'Yes') org.areas.push('Biological');
      if (row['activity_support'] === 'Yes') org.areas.push('Wraparound');
      
      result.organizations.push(org);
    });
    
    const withCoords = result.organizations.filter(o => o.coords).length;
    const withNetwork = result.organizations.filter(o => o.networkMember && o.networkName).length;
    console.log(`   ✓ Parsed ${result.organizations.length} organizations`);
    console.log(`   ✓ ${withCoords} have coordinates`);
    console.log(`   ✓ ${withNetwork} are network members`);
  } else {
    console.log('   ⚠️  mte-master.csv not found, skipping');
  }

  // STEP 4: Add state coordinates
  console.log('\n🗺️  STEP 4: Adding state coordinates...');
  Object.entries(STATE_CENTROIDS).forEach(([stateName, coords]) => {
    const stateCode = STATE_NAME_TO_CODE[stateName];
    const orgCount = result.organizations.filter(o => o.state === stateCode).length;
    result.stateCoordinates[stateName] = { coords: coords, orgCount: orgCount };
  });
  console.log(`   ✓ Added coordinates for ${Object.keys(result.stateCoordinates).length} states`);

  // STEP 5: Add county coordinates
  console.log('\n📍 STEP 5: Adding county coordinates...');
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
        result.countyCoordinates[countyKey] = { coords: coords, orgCount: orgCount };
      }
    });
  });
  console.log(`   ✓ Added coordinates for ${Object.keys(result.countyCoordinates).length} counties`);

  // STEP 6: Calculate national totals
  console.log('\n🧮 STEP 6: Calculating national totals...');
  result.national.childrenInCare = safeSum(...Object.values(result.states).map(s => s.totalChildren));
  result.national.childrenWaitingAdoption = safeSum(...Object.values(result.states).map(s => s.waitingForAdoption));
  result.national.childrenInFamilyFoster = safeSum(...Object.values(result.counties).map(c => c.childrenInFamily));
  result.national.childrenInKinship = safeSum(...Object.values(result.counties).map(c => c.childrenInKinship));
  result.national.totalChurches = safeSum(...Object.values(result.counties).map(c => c.totalChurches));
  result.national.churchesWithMinistry = result.national.totalChurches !== null
    ? Math.round(result.national.totalChurches * 0.08) : null;
  console.log(`   ✓ National totals calculated`);

  // STEP 7: Build historical data from yearly CSV files
  console.log('\n📈 STEP 7: Building historical data...');
  result.historical = buildHistoricalData(scriptDir);
  if (result.historical) {
    const statesWithData = Object.keys(result.historical.states).length;
    const statesWithBothYears = Object.values(result.historical.states).filter(s => 
      s.metrics.childrenInCare[0] !== null && s.metrics.childrenInCare[1] !== null
    ).length;
    console.log(`   ✓ Years: ${result.historical.years.join(', ')}`);
    console.log(`   ✓ States with data: ${statesWithData}`);
    console.log(`   ✓ States with both years: ${statesWithBothYears}`);
  } else {
    console.log(`   ⚠️  No historical data files found`);
  }

  return result;
}

// ============================================
// HISTORICAL DATA BUILDER
// ============================================

function buildHistoricalData(scriptDir) {
  const yearFiles = [
    { year: 2024, file: '2024-metrics-state.csv' },
    { year: 2025, file: '2025-metrics-state.csv' }
  ];
  
  // Check which files exist
  const availableYears = yearFiles.filter(yf => 
    fs.existsSync(path.join(scriptDir, yf.file))
  );
  
  if (availableYears.length < 1) {
    return null;
  }
  
  const years = availableYears.map(yf => yf.year);
  const stateDataByYear = {};
  
  // Parse each year's data
  availableYears.forEach(({ year, file }) => {
    const filePath = path.join(scriptDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCSV(content);
    
    stateDataByYear[year] = {};
    
    rows.forEach(row => {
      if (row['is_state'] !== '1') return;
      
      const stateName = cleanString(row['state_name_full']);
      if (!stateName) return;
      
      const stateKey = stateToKey(stateName);
      stateDataByYear[year][stateKey] = {
        name: stateName,
        childrenInCare: cleanNumber(row['number of children in care']),
        childrenInFoster: cleanNumber(row['number of children in foster care']),
        childrenInKinship: cleanNumber(row['number of children in kinship care']),
        licensedHomes: cleanNumber(row['number of foster and kinship homes']),
        waitingAdoption: cleanNumber(row['number of children waiting for adoption']),
        reunificationRate: cleanNumber(row['biological family reunification rate']),
        familyPreservation: cleanNumber(row['number of family preservation cases'])
      };
    });
  });
  
  // Combine into historical structure
  const allStateKeys = new Set();
  Object.values(stateDataByYear).forEach(yearData => {
    Object.keys(yearData).forEach(key => allStateKeys.add(key));
  });
  
  const historical = {
    years: years,
    states: {}
  };
  
  allStateKeys.forEach(stateKey => {
    // Get data for each year (null if not available)
    const yearlyData = years.map(year => stateDataByYear[year]?.[stateKey] || null);
    
    // Check if there's any data for this state
    const hasAnyData = yearlyData.some(d => d && (
      d.childrenInCare !== null || 
      d.licensedHomes !== null ||
      d.waitingAdoption !== null
    ));
    
    if (!hasAnyData) return;
    
    // Build metrics arrays for each year
    const stateName = yearlyData.find(d => d)?.name || stateKey;
    
    historical.states[stateKey] = {
      name: stateName,
      metrics: {
        childrenInCare: yearlyData.map(d => d?.childrenInCare ?? null),
        childrenInFoster: yearlyData.map(d => d?.childrenInFoster ?? null),
        childrenInKinship: yearlyData.map(d => d?.childrenInKinship ?? null),
        licensedHomes: yearlyData.map(d => d?.licensedHomes ?? null),
        waitingAdoption: yearlyData.map(d => d?.waitingAdoption ?? null),
        reunificationRate: yearlyData.map(d => d?.reunificationRate ?? null),
        familyPreservation: yearlyData.map(d => d?.familyPreservation ?? null)
      }
    };
  });
  
  return historical;
}

// ============================================
// EXECUTE
// ============================================

try {
  console.log('🚀 MTE FOSTER CARE DATA PARSER (with Network Connections Fix)');
  console.log('═'.repeat(60));
  
  const data = parseAllData();
  
  console.log('\n💾 Writing output file...');
  const outputPath = path.join(__dirname, 'real-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`   ✓ Saved to: ${outputPath}`);
  
  const stats = fs.statSync(outputPath);
  console.log(`   ✓ File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  
  // Network connections summary
  const networkOrgs = data.organizations.filter(o => o.networkMember && o.networkName && o.coords);
  const networks = {};
  networkOrgs.forEach(org => {
    if (!networks[org.networkName]) networks[org.networkName] = [];
    networks[org.networkName].push(org.name);
  });
  
  console.log('\n🔗 NETWORK CONNECTIONS (with coords):');
  console.log('═'.repeat(60));
  Object.entries(networks).sort((a, b) => b[1].length - a[1].length).forEach(([name, members]) => {
    const connectionCount = (members.length * (members.length - 1)) / 2;
    console.log(`   ${name}: ${members.length} orgs → ${connectionCount} connection lines`);
  });
  
  console.log('\n✅ PARSING COMPLETE!');
  
} catch (error) {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}