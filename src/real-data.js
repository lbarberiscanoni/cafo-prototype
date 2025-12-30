// Real data for the Foster Care App - All 50 States + DC with 3,142 Counties
// Imports from real-data.json and provides same exports as mock-data.js

import realDataJson from './data/real-data.json';

// ==================== FORMATTING UTILITIES ====================
// Use these to safely display values that may be null

/** Format number with locale string, returns fallback for null */
export const fmt = (val, fallback = 'N/A') => 
  val !== null && val !== undefined ? val.toLocaleString() : fallback;

/** Format percentage */
export const fmtPct = (val, fallback = 'N/A') => 
  val !== null && val !== undefined ? `${val}%` : fallback;

/** Format large numbers with K/M suffix */
export const fmtCompact = (val, fallback = 'N/A') => {
  if (val === null || val === undefined) return fallback;
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${Math.round(val / 1000)}K`;
  return val.toLocaleString();
};

/** Check if value exists (not null/undefined) */
export const hasValue = (val) => val !== null && val !== undefined;

console.log('📊 Real Data Loaded:');
console.log(`   States: ${Object.keys(realDataJson.states).length}`);
console.log(`   Counties: ${Object.keys(realDataJson.counties).length}`);
console.log(`   Organizations: ${realDataJson.organizations.length}`);
console.log(`   National Children in Care: ${fmt(realDataJson.national.childrenInCare)}`);

// ==================== DIRECT EXPORTS FROM JSON ====================

export const nationalStats = realDataJson.national;
export const stateData = realDataJson.states;
export const stateCoordinates = realDataJson.stateCoordinates;
export const organizations = realDataJson.organizations;

// ==================== COUNTY DATA ====================

// Transform counties object to match mock-data structure
export const countyData = realDataJson.counties;

// ==================== MAP COORDINATES ====================

// Transform county coordinates to nested structure by state
export const countyCoordinatesByState = Object.entries(realDataJson.countyCoordinates).reduce((acc, [countyKey, data]) => {
  // countyKey format: "autauga-al", "baldwin-al", etc.
  const county = realDataJson.counties[countyKey];
  if (!county) return acc;
  
  const stateKey = county.state.toLowerCase().replace(/\s+/g, '-');
  
  if (!acc[stateKey]) {
    acc[stateKey] = {};
  }
  
  // Extract county name without "County, State" suffix
  const countyName = county.name.split(',')[0]
    .replace(' County', '')
    .replace(' Parish', '')
    .replace(' Municipality', '')
    .replace(' Borough', '')
    .replace(' City', '');
  
  acc[stateKey][countyName] = {
    coords: data.coords,
    orgCount: data.orgCount
  };
  
  return acc;
}, {});

// ==================== HELPER MAPPINGS ====================

// State name to code mapping for maps
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

// Helper to get state data in format for InteractiveUSMap
export const getStateMapData = () => {
  const mapData = {};
  
  Object.entries(stateData).forEach(([stateId, data]) => {
    mapData[data.name] = {
      value: data.totalChildren,
      code: stateNameToCode[data.name]
    };
  });
  
  return mapData;
};

// ==================== HISTORICAL DATA ====================
// Historical data is imported from real-data.json
// Structure: { years: [2024, 2025], states: { "alabama": { name, metrics: {...} }, ... } }

export const historicalData = realDataJson.historical || null;