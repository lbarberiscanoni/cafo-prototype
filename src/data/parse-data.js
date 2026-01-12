/**
 * MTE Foster Care Data Parser
 * 
 * Data Sources:
 * - afcars-good.csv: GROUND TRUTH for national and state-level metrics (2021-2023)
 * - 2025-metrics-state.csv: County-level data, licensed homes, churches
 * - mte-master.csv: Organization data
 * - mte-network-members.csv: Network membership data
 * 
 * AFCARS provides authoritative foster care data from the federal government
 */

const fs = require('fs');
const path = require('path');

// State code to full name mapping
const STATE_CODE_TO_NAME = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
  'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
  'PA': 'Pennsylvania', 'PR': 'Puerto Rico', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

const STATE_NAME_TO_CODE = Object.fromEntries(
  Object.entries(STATE_CODE_TO_NAME).map(([code, name]) => [name, code])
);

// State centroids for mapping
const STATE_CENTROIDS = {
  'Alabama': [32.806671, -86.791130], 'Alaska': [61.370716, -152.404419],
  'Arizona': [33.729759, -111.431221], 'Arkansas': [34.969704, -92.373123],
  'California': [36.116203, -119.681564], 'Colorado': [39.059811, -105.311104],
  'Connecticut': [41.597782, -72.755371], 'Delaware': [39.318523, -75.507141],
  'District of Columbia': [38.897438, -77.026817], 'Florida': [27.766279, -81.686783],
  'Georgia': [33.040619, -83.643074], 'Hawaii': [21.094318, -157.498337],
  'Idaho': [44.240459, -114.478828], 'Illinois': [40.349457, -88.986137],
  'Indiana': [39.849426, -86.258278], 'Iowa': [42.011539, -93.210526],
  'Kansas': [38.526600, -96.726486], 'Kentucky': [37.668140, -84.670067],
  'Louisiana': [31.169546, -91.867805], 'Maine': [44.693947, -69.381927],
  'Maryland': [39.063946, -76.802101], 'Massachusetts': [42.230171, -71.530106],
  'Michigan': [43.326618, -84.536095], 'Minnesota': [45.694454, -93.900192],
  'Mississippi': [32.741646, -89.678696], 'Missouri': [38.456085, -92.288368],
  'Montana': [46.921925, -110.454353], 'Nebraska': [41.125370, -98.268082],
  'Nevada': [38.313515, -117.055374], 'New Hampshire': [43.452492, -71.563896],
  'New Jersey': [40.298904, -74.521011], 'New Mexico': [34.840515, -106.248482],
  'New York': [42.165726, -74.948051], 'North Carolina': [35.630066, -79.806419],
  'North Dakota': [47.528912, -99.784012], 'Ohio': [40.388783, -82.764915],
  'Oklahoma': [35.565342, -96.928917], 'Oregon': [44.572021, -122.070938],
  'Pennsylvania': [40.590752, -77.209755], 'Rhode Island': [41.680893, -71.511780],
  'South Carolina': [33.856892, -80.945007], 'South Dakota': [44.299782, -99.438828],
  'Tennessee': [35.747845, -86.692345], 'Texas': [31.054487, -97.563461],
  'Utah': [40.150032, -111.862434], 'Vermont': [44.045876, -72.710686],
  'Virginia': [37.769337, -78.169968], 'Washington': [47.400902, -121.490494],
  'West Virginia': [38.491226, -80.954453], 'Wisconsin': [44.268543, -89.616508],
  'Wyoming': [42.755966, -107.302490]
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function cleanString(str) {
  if (!str) return null;
  return str.trim().replace(/\r/g, '').replace(/^"|"$/g, '');
}

function cleanNumber(str) {
  if (!str || str === '' || str === 'N/A' || str === '-') return null;
  const cleaned = str.replace(/[,$%]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Check if a value represents "yes" / "true" / "1"
function isYes(val) {
  if (!val) return false;
  const v = val.toLowerCase().trim();
  return v === 'yes' || v === 'true' || v === '1';
}

function stateToKey(stateName) {
  return stateName.toLowerCase().replace(/\s+/g, '-');
}

function countyToKey(countyName, stateCode) {
  const cleanCounty = countyName.toLowerCase()
    .replace(/\s+county$/i, '')
    .replace(/\s+/g, '-');
  return `${cleanCounty}-${stateCode.toLowerCase()}`;
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

function safeSum(values) {
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
    countyCoordinates: {},
    // NEW: Historical data for trends
    historicalData: {
      2021: { national: {}, states: {} },
      2022: { national: {}, states: {} },
      2023: { national: {}, states: {} }
    }
  };

  const scriptDir = __dirname;

  // ============================================
  // STEP 1: Parse AFCARS data (GROUND TRUTH for state/national)
  // ============================================
  console.log('\n📊 STEP 1: Parsing afcars-good.csv (GROUND TRUTH)...');
  const afcarsPath = path.join(scriptDir, 'afcars-good.csv');
  
  if (fs.existsSync(afcarsPath)) {
    const afcarsContent = fs.readFileSync(afcarsPath, 'utf8');
    const afcarsRows = parseCSV(afcarsContent);
    
    // Group by year
    const byYear = { 2021: [], 2022: [], 2023: [] };
    
    afcarsRows.forEach(row => {
      const year = parseInt(row['Year']);
      const stateCode = cleanString(row['State']);
      
      if (!stateCode || !byYear[year]) return;
      
      const stateName = STATE_CODE_TO_NAME[stateCode];
      if (!stateName) {
        console.log(`   ⚠️  Unknown state code: ${stateCode}`);
        return;
      }
      
      const stateKey = stateToKey(stateName);
      
      // Parse reunification rate (remove % sign)
      let reunificationRate = cleanNumber(row['Biological Reunification Rate']);
      
      const stateData = {
        name: stateName,
        code: stateCode,
        totalChildren: cleanNumber(row['Children in Care']),
        childrenInFosterCare: cleanNumber(row['Children in Foster Care']),
        childrenInKinship: cleanNumber(row['Children in Kinship Care']),
        waitingForAdoption: cleanNumber(row['Children Waiting For Adoption']),
        childrenAdopted: cleanNumber(row['Children Adopted']),
        reunificationRate: reunificationRate,
        // These will be filled from 2025-metrics-state.csv
        licensedHomes: null,
        familyPreservationCases: null
      };
      
      byYear[year].push({ stateKey, stateData });
      
      // Store in historical data
      result.historicalData[year].states[stateKey] = stateData;
    });
    
    // Use 2023 as current data
    console.log(`   ✓ Found ${byYear[2023].length} states with 2023 AFCARS data`);
    
    byYear[2023].forEach(({ stateKey, stateData }) => {
      result.states[stateKey] = { ...stateData };
    });
    
    // Calculate national totals from 2023 state data
    const states2023 = byYear[2023].map(s => s.stateData);
    
    result.national.childrenInCare = safeSum(states2023.map(s => s.totalChildren));
    result.national.childrenInFamilyFoster = safeSum(states2023.map(s => s.childrenInFosterCare));
    result.national.childrenInKinship = safeSum(states2023.map(s => s.childrenInKinship));
    result.national.childrenWaitingAdoption = safeSum(states2023.map(s => s.waitingForAdoption));
    result.national.childrenAdopted2023 = safeSum(states2023.map(s => s.childrenAdopted));
    
    // Calculate historical national totals
    [2021, 2022, 2023].forEach(year => {
      const yearStates = Object.values(result.historicalData[year].states);
      result.historicalData[year].national = {
        childrenInCare: safeSum(yearStates.map(s => s.totalChildren)),
        childrenInFamilyFoster: safeSum(yearStates.map(s => s.childrenInFosterCare)),
        childrenInKinship: safeSum(yearStates.map(s => s.childrenInKinship)),
        childrenWaitingAdoption: safeSum(yearStates.map(s => s.waitingForAdoption)),
        childrenAdopted: safeSum(yearStates.map(s => s.childrenAdopted))
      };
    });
    
    console.log(`   ✓ National totals calculated from AFCARS:`);
    console.log(`      Children in Care: ${result.national.childrenInCare?.toLocaleString() || 'N/A'}`);
    console.log(`      Children in Foster Care: ${result.national.childrenInFamilyFoster?.toLocaleString() || 'N/A'}`);
    console.log(`      Children in Kinship: ${result.national.childrenInKinship?.toLocaleString() || 'N/A'}`);
    console.log(`      Waiting for Adoption: ${result.national.childrenWaitingAdoption?.toLocaleString() || 'N/A'}`);
    console.log(`      Children Adopted (2023): ${result.national.childrenAdopted2023?.toLocaleString() || 'N/A'}`);
  } else {
    console.log(`   ❌ afcars-good.csv not found at ${afcarsPath}`);
  }

  // ============================================
  // STEP 2: Parse metrics CSV files (2024 and 2025) for supplemental state data and counties
  // ============================================
  console.log('\n📊 STEP 2: Parsing metrics CSV files (counties + supplemental state data)...');
  
  // Helper to parse a metrics file and return county data
  const parseMetricsFile = (filename, year) => {
    const filePath = path.join(scriptDir, filename);
    const countyData = {};
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  ${filename} not found`);
      return { countyData, stateSupplementCount: 0, countyCount: 0 };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCSV(content);
    let stateSupplementCount = 0;
    let countyCount = 0;
    
    rows.forEach(row => {
      const isState = row['is_state'] === '1';
      const isCounty = row['is_county'] === '1';
      
      if (isState) {
        const stateName = cleanString(row['state_name_full']);
        if (!stateName) return;
        
        const stateKey = stateToKey(stateName);
        
        // Add supplemental fields to existing state data (if exists from AFCARS)
        if (result.states[stateKey]) {
          // Only update if we don't have this data yet (prefer 2025 over 2024)
          if (!result.states[stateKey].licensedHomes) {
            result.states[stateKey].licensedHomes = cleanNumber(row['number of foster and kinship homes']);
          }
          if (!result.states[stateKey].familyPreservationCases) {
            result.states[stateKey].familyPreservationCases = cleanNumber(row['number of family preservation cases']);
          }
          stateSupplementCount++;
        }
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
        
        countyData[countyKey] = {
          name: `${countyName} County, ${stateName}`,
          state: stateName,
          stateCode: stateCode,
          fipsCode: fipsCode,
          totalChurches: cleanNumber(row['number of churches']),
          childrenInCare: childrenInCare,
          childrenInFamily: cleanNumber(row['number of children in foster care']),
          childrenInKinship: cleanNumber(row['number of children in kinship care']),
          childrenOutOfCounty: cleanNumber(row['number of children placed out-of-county']),
          licensedHomes: licensedHomes,
          licensedHomesPerChild: (childrenInCare && childrenInCare > 0 && licensedHomes) 
            ? Math.round((licensedHomes / childrenInCare) * 100) / 100 
            : null,
          waitingForAdoption: cleanNumber(row['number of children waiting for adoption']),
          childrenAdopted: cleanNumber(row['number of children adopted']),
          avgMonthsToAdoption: cleanNumber(row['average months to adoption']),
          familyPreservationCases: cleanNumber(row['number of family preservation cases']),
          reunificationRate: cleanNumber(row['biological family reunification rate'])
        };
        countyCount++;
      }
    });
    
    console.log(`   ✓ ${filename}: ${countyCount} counties, ${stateSupplementCount} state supplements`);
    return { countyData, stateSupplementCount, countyCount };
  };
  
  // Parse 2025 first (current/primary data)
  const metrics2025 = parseMetricsFile('2025-metrics-state.csv', 2025);
  
  // Parse 2024 (historical)
  const metrics2024 = parseMetricsFile('2024-metrics-state.csv', 2024);
  
  // Use 2025 as the current county data
  result.counties = metrics2025.countyData;
  
  // If no 2025 data, fall back to 2024
  if (Object.keys(result.counties).length === 0) {
    result.counties = metrics2024.countyData;
  }
  
  // Store county historical data
  // Structure: historicalData[year].counties[countyKey] = { metrics }
  if (Object.keys(metrics2024.countyData).length > 0) {
    result.historicalData['2024'] = result.historicalData['2024'] || { national: {}, states: {}, counties: {} };
    result.historicalData['2024'].counties = metrics2024.countyData;
  }
  
  if (Object.keys(metrics2025.countyData).length > 0) {
    result.historicalData['2025'] = result.historicalData['2025'] || { national: {}, states: {}, counties: {} };
    result.historicalData['2025'].counties = metrics2025.countyData;
  }
  
  console.log(`   ✓ Total counties loaded: ${Object.keys(result.counties).length}`);
  console.log(`   ✓ County historical years: ${[metrics2024.countyCount > 0 ? '2024' : null, metrics2025.countyCount > 0 ? '2025' : null].filter(Boolean).join(', ') || 'none'}`);
  
  // Calculate national church totals from counties
  const totalChurches = safeSum(Object.values(result.counties).map(c => c.totalChurches));
  if (totalChurches) {
    result.national.totalChurches = totalChurches;
    result.national.churchesWithMinistry = Math.round(totalChurches * 0.08);
  }

  // ============================================
  // STEP 3: Parse mte-master.csv for organizations
  // ============================================
  console.log('\n📊 STEP 3: Parsing mte-master.csv (organizations)...');
  const masterPath = path.join(scriptDir, 'mte-master.csv');
  
  if (fs.existsSync(masterPath)) {
    const masterContent = fs.readFileSync(masterPath, 'utf8');
    const masterRows = parseCSV(masterContent);
    
    // Debug: Show available columns
    if (masterRows.length > 0) {
      console.log(`   📋 CSV columns: ${Object.keys(masterRows[0]).join(', ')}`);
      console.log(`   📋 Total rows: ${masterRows.length}`);
      // Show first row as sample
      const firstRow = masterRows[0];
      console.log(`   📋 First row name: "${firstRow['name']}", state: "${firstRow['state']}", lat: "${firstRow['latitude']}"`);
    }
    
    // Debug: Check on_map and use_latlong values
    const onMapValues = [...new Set(masterRows.map(r => r['on_map']))].slice(0, 5);
    const useLatLongValues = [...new Set(masterRows.map(r => r['use_latlong']))].slice(0, 5);
    console.log(`   📋 on_map values found: ${onMapValues.join(', ') || '(empty)'}`);
    console.log(`   📋 use_latlong values found: ${useLatLongValues.join(', ') || '(empty)'}`);
    
    // Debug: Check activity column values
    const activityFosterValues = [...new Set(masterRows.map(r => r['activity_recruit_foster_kinship']).filter(v => v))].slice(0, 5);
    console.log(`   📋 activity_recruit_foster_kinship values: ${activityFosterValues.join(', ') || '(empty)'}`);
    
    // Count rows with non-empty names
    const rowsWithNames = masterRows.filter(r => r['name'] && r['name'].trim()).length;
    console.log(`   📋 Rows with non-empty name: ${rowsWithNames}`);
    
    masterRows.forEach(row => {
      const name = cleanString(row['name']);
      if (!name) return;
      
      // Skip if it's marked as a network, not an organization
      const isOrg = isYes(row['is_organization']);
      const isNetwork = isYes(row['is_network']);
      // If is_organization column exists and is false, skip
      if (row['is_organization'] !== undefined && !isOrg && !isNetwork) return;
      
      const lat = cleanNumber(row['latitude']);
      const lng = cleanNumber(row['longitude']);
      
      // Check both on_map and use_latlong for map visibility
      // on_map values: Yes, No, empty
      // Fallback: if coordinates exist, show on map
      const onMapRaw = (row['on_map'] || '').trim().toLowerCase();
      const useLatLong = row['use_latlong'] === '1';
      const hasCoords = lat && lng;
      const onMap = onMapRaw === 'yes' || onMapRaw === 'true' || onMapRaw === '1' || useLatLong || hasCoords;
      
      // Parse impact areas from activity columns
      // Values can be: "Yes", "true", "1", or empty/No
      const areas = [];
      if (isYes(row['activity_recruit_foster_kinship'])) {
        areas.push('Foster and Kinship Families');
      }
      if (isYes(row['activity_recruit_adoptive'])) {
        areas.push('Adoptive');
      }
      if (isYes(row['activity_bio'])) {
        areas.push('Biological');
      }
      if (isYes(row['activity_support'])) {
        areas.push('Wraparound');
      }
      
      const org = {
        name: name,
        category: cleanString(row['category']) || 'Other',
        state: cleanString(row['state']),
        city: cleanString(row['city']),
        county: cleanString(row['county_name']) || cleanString(row['county']),
        description: cleanString(row['description']) || '',
        website: cleanString(row['website']) || null,
        onMap: onMap,
        coords: (lat && lng) ? [lat, lng] : null,
        areas: areas,
        networkMember: isYes(row['network_member']),
        networkName: cleanString(row['network_name']) || null
      };
      
      result.organizations.push(org);
    });
    
    console.log(`   ✓ Loaded ${result.organizations.length} organizations`);
    const withCoords = result.organizations.filter(o => o.coords).length;
    const withOnMap = result.organizations.filter(o => o.onMap).length;
    const withBoth = result.organizations.filter(o => o.onMap && o.coords).length;
    const withAreas = result.organizations.filter(o => o.areas && o.areas.length > 0).length;
    const withWebsite = result.organizations.filter(o => o.website).length;
    console.log(`   ✓ ${withCoords} with coordinates`);
    console.log(`   ✓ ${withOnMap} with onMap=true`);
    console.log(`   ✓ ${withBoth} with both (will show on map)`);
    console.log(`   ✓ ${withAreas} with impact areas`);
    console.log(`   ✓ ${withWebsite} with website`);
    
    // Debug: show sample org with areas
    if (result.organizations.length > 0) {
      const sampleWithAreas = result.organizations.find(o => o.areas && o.areas.length > 0);
      if (sampleWithAreas) {
        console.log(`   📋 Sample org with areas: "${sampleWithAreas.name}" -> [${sampleWithAreas.areas.join(', ')}]`);
      }
      const sample = result.organizations.find(o => o.coords) || result.organizations[0];
      console.log(`   📋 Sample org: state="${sample.state}", onMap=${sample.onMap === true}, coords=${sample.coords ? 'yes' : 'no'}`);
    }
  } else {
    console.log(`   ⚠️  mte-master.csv not found`);
  }

  // ============================================
  // STEP 4: Parse mte-network-members.csv (optional - network info may already be in master)
  // ============================================
  console.log('\n📊 STEP 4: Parsing mte-network-members.csv...');
  const networkPath = path.join(scriptDir, 'mte-network-members.csv');
  
  if (fs.existsSync(networkPath)) {
    const networkContent = fs.readFileSync(networkPath, 'utf8');
    const networkRows = parseCSV(networkContent);
    
    // Debug: show columns
    if (networkRows.length > 0) {
      console.log(`   📋 Network CSV columns: ${Object.keys(networkRows[0]).join(', ')}`);
      const firstRow = networkRows[0];
      console.log(`   📋 First network row: org="${firstRow['Organization/Ministry Name']}", network="${firstRow['Network Name']}"`);
    }
    
    let networkMatches = 0;
    let networkMisses = 0;
    const missedNames = [];
    
    networkRows.forEach(row => {
      // Try different possible column names
      const orgName = cleanString(row['Organization/Ministry Name']) || cleanString(row['Organization Name']) || cleanString(row['name']);
      const networkName = cleanString(row['Network Name']) || cleanString(row['network_name']);
      
      if (!orgName || !networkName) return;
      
      const org = result.organizations.find(o => o.name === orgName);
      if (org) {
        org.networkMember = true;
        org.networkName = networkName;
        networkMatches++;
      } else {
        networkMisses++;
        if (missedNames.length < 3) missedNames.push(orgName);
      }
    });
    
    console.log(`   ✓ Matched ${networkMatches} organizations to networks`);
    if (networkMisses > 0) {
      console.log(`   ⚠️  ${networkMisses} network entries didn't match orgs`);
      if (missedNames.length > 0) {
        console.log(`   📋 Sample unmatched: ${missedNames.join(', ')}`);
      }
    }
  } else {
    console.log(`   ⚠️  mte-network-members.csv not found (network info may be in mte-master.csv)`);
  }
  
  // Count orgs with network info from master file
  const orgsWithNetwork = result.organizations.filter(o => o.networkMember && o.networkName).length;
  console.log(`   ✓ Total orgs with network membership: ${orgsWithNetwork}`);

  // ============================================
  // STEP 5: Add state coordinates
  // ============================================
  console.log('\n📊 STEP 5: Adding state coordinates...');
  
  // Debug: Check what states orgs have
  const orgStates = [...new Set(result.organizations.map(o => o.state))];
  console.log(`   📋 Org states found: ${orgStates.slice(0, 10).join(', ')}${orgStates.length > 10 ? '...' : ''}`);
  
  let totalOrgCount = 0;
  Object.entries(STATE_CENTROIDS).forEach(([stateName, coords]) => {
    const stateKey = stateToKey(stateName);
    const stateCode = STATE_NAME_TO_CODE[stateName];
    const orgsInState = result.organizations.filter(o => 
      o.state === stateCode && o.onMap && o.coords
    ).length;
    
    totalOrgCount += orgsInState;
    
    result.stateCoordinates[stateName] = {
      coords: coords,
      orgCount: orgsInState
    };
  });
  
  console.log(`   ✓ Added coordinates for ${Object.keys(result.stateCoordinates).length} states`);
  console.log(`   ✓ Total orgs mapped to states: ${totalOrgCount}`);

  // ============================================
  // STEP 6: Build county coordinates by state
  // ============================================
  console.log('\n📊 STEP 6: Building county coordinates...');
  
  Object.keys(result.states).forEach(stateKey => {
    result.countyCoordinates[stateKey] = {};
  });
  
  // Add counties with org coordinates
  result.organizations.forEach(org => {
    if (!org.county || !org.state || !org.coords) return;
    
    const stateName = STATE_CODE_TO_NAME[org.state];
    if (!stateName) return;
    
    const stateKey = stateToKey(stateName);
    const countyName = org.county.replace(/\s+county$/i, '').trim();
    
    if (!result.countyCoordinates[stateKey]) {
      result.countyCoordinates[stateKey] = {};
    }
    
    if (!result.countyCoordinates[stateKey][countyName]) {
      result.countyCoordinates[stateKey][countyName] = {
        coords: org.coords,
        orgCount: 1
      };
    } else {
      result.countyCoordinates[stateKey][countyName].orgCount++;
    }
  });

  // ============================================
  // STEP 7: Data Quality Summary
  // ============================================
  console.log('\n📋 STEP 7: Data quality summary...');
  console.log(`   States: ${Object.keys(result.states).length}`);
  console.log(`   Counties: ${Object.keys(result.counties).length}`);
  console.log(`   Organizations: ${result.organizations.length}`);
  console.log(`   Historical years: ${Object.keys(result.historicalData).join(', ')}`);

  return result;
}

// ============================================
// EXECUTE
// ============================================

try {
  console.log('🚀 MTE FOSTER CARE DATA PARSER');
  console.log('═'.repeat(60));
  console.log('Data Sources:');
  console.log('  ✓ afcars-good.csv (GROUND TRUTH - state/national metrics)');
  console.log('  ✓ 2025-metrics-state.csv (county data, supplemental state data)');
  console.log('  ✓ mte-master.csv (organizations)');
  console.log('  ✓ mte-network-members.csv (network relationships)');
  console.log('\n⚠️  Missing values are stored as null (not 0)');
  
  const data = parseAllData();
  
  // Rename historicalData to 'historical' to match existing real-data.js expectations
  const output = {
    national: data.national,
    states: data.states,
    counties: data.counties,
    organizations: data.organizations,
    stateCoordinates: data.stateCoordinates,
    countyCoordinates: data.countyCoordinates,
    historical: data.historicalData  // real-data.js expects 'historical' not 'historicalData'
  };

  // Write JSON output to current directory (parse-data.js lives in /data folder)
  console.log('\n💾 Writing real-data.json...');
  const jsonPath = path.join(__dirname, 'real-data.json');
  
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`   ✓ Saved to: ${jsonPath}`);
  
  // File size info
  const jsonStats = fs.statSync(jsonPath);
  console.log(`   ✓ Size: ${(jsonStats.size / 1024).toFixed(1)} KB`);
  
  console.log('\n✅ PARSING COMPLETE');
  console.log('═'.repeat(60));
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}