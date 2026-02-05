// Real data for the Foster Care App - All 50 States + DC
// Adapts real-data.json (from pipeline) to format expected by components

import realDataJson from './data/real-data.json';

// ==================== FORMATTING UTILITIES ====================

/** Format number with locale string, returns fallback for null */
export const fmt = (val, fallback = 'N/A') => 
  val !== null && val !== undefined ? val.toLocaleString() : fallback;

/** Format percentage */
export const fmtPct = (val, fallback = 'N/A') => 
  val !== null && val !== undefined ? `${(val * 100).toFixed(1)}%` : fallback;

/** Format large numbers with K/M suffix */
export const fmtCompact = (val, fallback = 'N/A') => {
  if (val === null || val === undefined) return fallback;
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${Math.round(val / 1000)}K`;
  return val.toLocaleString();
};

/** Check if value exists (not null/undefined) */
export const hasValue = (val) => val !== null && val !== undefined;

// ==================== STATE MAPPINGS ====================

export const stateNameToCode = {
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

export const stateCodeToName = Object.fromEntries(
  Object.entries(stateNameToCode).map(([name, code]) => [code, name])
);

// ==================== NATIONAL STATS ====================
// Use most recent year (2023) as default

const latestYear = Math.max(...Object.keys(realDataJson.national).map(Number));
export const nationalStats = realDataJson.national[latestYear];
export const nationalByYear = realDataJson.national;

// ==================== STATE DATA ====================
// Transform from { AL: { ... } } to format expected by components

export const stateData = Object.fromEntries(
  Object.entries(realDataJson.states).map(([abbrev, state]) => {
    // Get latest AFCARS year data
    const afcarsYears = Object.keys(state.afcars || {}).map(Number).sort((a, b) => b - a);
    const latestAfcars = afcarsYears[0] ? state.afcars[afcarsYears[0]] : {};
    
    // Get latest county data year
    const countyYears = [...new Set(state.counties.map(c => c.year))].sort((a, b) => b - a);
    const latestCountyYear = countyYears[0] || null;
    
    // Create state key (lowercase with dashes)
    const stateKey = state.name.toLowerCase().replace(/\s+/g, '-');
    
    return [stateKey, {
      id: stateKey,
      abbreviation: abbrev,
      name: state.name,
      // AFCARS data (state-level)
      totalChildren: latestAfcars.childrenInCare || null,
      childrenInCare: latestAfcars.childrenInCare || null,
      childrenInFosterCare: latestAfcars.childrenInFosterCare || null,
      childrenInKinshipCare: latestAfcars.childrenInKinshipCare || null,
      childrenWaitingForAdoption: latestAfcars.childrenWaitingForAdoption || null,
      childrenAdopted: latestAfcars.childrenAdopted || null,
      reunificationRate: latestAfcars.reunificationRate || null,
      familyPreservationCases: latestAfcars.familyPreservationCases || null,
      // Source info
      dataDate: state.source?.dataDate || null,
      dataYear: state.source?.dataYear || null,
      sourceAgency: state.source?.sourceAgency || null,
      sourceUrl: state.source?.sourceUrl || null,
      definitions: state.source?.definitions || {},
      // AFCARS by year
      afcars: state.afcars || {},
      // County data
      countyCount: state.counties.filter(c => c.year === latestCountyYear).length,
      latestCountyYear: latestCountyYear
    }];
  })
);

// Also export keyed by abbreviation for easy lookup
export const stateDataByCode = Object.fromEntries(
  Object.entries(realDataJson.states).map(([abbrev, state]) => [abbrev, {
    ...state,
    id: state.name.toLowerCase().replace(/\s+/g, '-')
  }])
);

// ==================== COUNTY DATA ====================
// Flatten counties into { "county-name_state-abbrev_year": { ... } } structure

export const countyData = {};
export const countyCoordinatesByState = {};

Object.entries(realDataJson.states).forEach(([abbrev, state]) => {
  const stateKey = state.name.toLowerCase().replace(/\s+/g, '-');
  
  if (!countyCoordinatesByState[stateKey]) {
    countyCoordinatesByState[stateKey] = {};
  }
  
  state.counties.forEach(county => {
    // Create county key
    const countyName = county.name.toLowerCase().replace(/\s+/g, '-');
    const countyKey = `${countyName}_${abbrev.toLowerCase()}_${county.year}`;
    
    countyData[countyKey] = {
      id: countyKey,
      name: county.name,
      state: state.name,
      stateAbbrev: abbrev,
      geographyType: county.geographyType || 'county',
      year: county.year,
      population: county.population,
      childrenInCare: county.childrenInCare,
      childrenInFosterCare: county.childrenInFosterCare,
      childrenInKinshipCare: county.childrenInKinshipCare,
      childrenPlacedOutOfCounty: county.childrenPlacedOutOfCounty,
      fosterKinshipHomes: county.fosterKinshipHomes,
      fosterHomes: county.fosterHomes,
      kinshipHomes: county.kinshipHomes,
      childrenWaitingForAdoption: county.childrenWaitingForAdoption,
      reunificationRate: county.reunificationRate,
      familyPreservationCases: county.familyPreservationCases,
      churches: county.churches,
      childrenAdopted: county.childrenAdopted,
      coordinates: county.coordinates || null
    };
    
    // Add to coordinates by state (for maps)
    if (county.coordinates) {
      countyCoordinatesByState[stateKey][county.name] = {
        coords: [county.coordinates.lat, county.coordinates.lng],
        orgCount: 0 // Will be calculated if needed
      };
    }
  });
});

// ==================== GET COUNTIES FOR STATE ====================

export const getCountiesForState = (stateNameOrAbbrev, year = null) => {
  // Normalize to abbreviation
  let abbrev = stateNameOrAbbrev;
  if (stateNameOrAbbrev.length > 2) {
    abbrev = stateNameToCode[stateNameOrAbbrev] || stateNameOrAbbrev.toUpperCase();
  }
  
  const state = realDataJson.states[abbrev];
  if (!state) return [];
  
  let counties = state.counties;
  
  // Filter by year if specified
  if (year) {
    counties = counties.filter(c => c.year === year);
  } else {
    // Get most recent year only
    const years = [...new Set(counties.map(c => c.year))].sort((a, b) => b - a);
    if (years.length > 0) {
      counties = counties.filter(c => c.year === years[0]);
    }
  }
  
  return counties;
};

// ==================== ORGANIZATIONS ====================

export const organizations = realDataJson.organizations.map(org => ({
  ...org,
  // Ensure consistent field names
  description: org.generatedDescription || org.description || null,
  lat: org.coordinates?.lat || null,
  lng: org.coordinates?.lng || null,
  state: org.address?.state || null,
  city: org.address?.city || null,
  county: org.address?.county || null
}));

export const networks = realDataJson.networks || [];

// ==================== STATE COORDINATES (for US map) ====================

export const stateCoordinates = {
  'AL': [32.806671, -86.791130], 'AK': [61.370716, -152.404419], 'AZ': [33.729759, -111.431221],
  'AR': [34.969704, -92.373123], 'CA': [36.116203, -119.681564], 'CO': [39.059811, -105.311104],
  'CT': [41.597782, -72.755371], 'DE': [39.318523, -75.507141], 'DC': [38.897438, -77.026817],
  'FL': [27.766279, -81.686783], 'GA': [33.040619, -83.643074], 'HI': [21.094318, -157.498337],
  'ID': [44.240459, -114.478828], 'IL': [40.349457, -88.986137], 'IN': [39.849426, -86.258278],
  'IA': [42.011539, -93.210526], 'KS': [38.526600, -96.726486], 'KY': [37.668140, -84.670067],
  'LA': [31.169546, -91.867805], 'ME': [44.693947, -69.381927], 'MD': [39.063946, -76.802101],
  'MA': [42.230171, -71.530106], 'MI': [43.326618, -84.536095], 'MN': [45.694454, -93.900192],
  'MS': [32.741646, -89.678696], 'MO': [38.456085, -92.288368], 'MT': [46.921925, -110.454353],
  'NE': [41.125370, -98.268082], 'NV': [38.313515, -117.055374], 'NH': [43.452492, -71.563896],
  'NJ': [40.298904, -74.521011], 'NM': [34.840515, -106.248482], 'NY': [42.165726, -74.948051],
  'NC': [35.630066, -79.806419], 'ND': [47.528912, -99.784012], 'OH': [40.388783, -82.764915],
  'OK': [35.565342, -96.928917], 'OR': [44.572021, -122.070938], 'PA': [40.590752, -77.209755],
  'RI': [41.680893, -71.511780], 'SC': [33.856892, -80.945007], 'SD': [44.299782, -99.438828],
  'TN': [35.747845, -86.692345], 'TX': [31.054487, -97.563461], 'UT': [40.150032, -111.862434],
  'VT': [44.045876, -72.710686], 'VA': [37.769337, -78.169968], 'WA': [47.400902, -121.490494],
  'WV': [38.491226, -80.954453], 'WI': [44.268543, -89.616508], 'WY': [42.755966, -107.302490]
};

// ==================== HISTORICAL DATA ====================
// Build from AFCARS multi-year data

export const historicalData = {
  years: Object.keys(realDataJson.national).map(Number).sort(),
  national: realDataJson.national,
  states: Object.fromEntries(
    Object.entries(realDataJson.states).map(([abbrev, state]) => [
      state.name.toLowerCase().replace(/\s+/g, '-'),
      {
        name: state.name,
        abbreviation: abbrev,
        afcars: state.afcars
      }
    ])
  )
};

// ==================== MAP HELPERS ====================

export const getStateMapData = () => {
  const mapData = {};
  
  Object.entries(stateData).forEach(([stateId, data]) => {
    mapData[data.name] = {
      value: data.childrenInCare,
      code: data.abbreviation
    };
  });
  
  return mapData;
};

// ==================== LOGGING ====================

const totalCounties = Object.values(realDataJson.states).reduce(
  (sum, state) => sum + state.counties.length, 0
);
const withCoords = Object.values(realDataJson.states).reduce(
  (sum, state) => sum + state.counties.filter(c => c.coordinates).length, 0
);
const withDescriptions = organizations.filter(o => o.description).length;

console.log('📊 Real Data Loaded:');
console.log(`   States: ${Object.keys(realDataJson.states).length}`);
console.log(`   County records: ${totalCounties}`);
console.log(`   Counties with coordinates: ${withCoords}`);
console.log(`   Organizations: ${organizations.length} (${withDescriptions} with descriptions)`);
console.log(`   Networks: ${networks.length}`);
console.log(`   National Children in Care (${latestYear}): ${fmt(nationalStats.childrenInCare)}`);