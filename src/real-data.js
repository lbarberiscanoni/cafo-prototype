// Real data for the Foster Care App - All 50 States + DC with 3,142 Counties
// Imports from real-data.json and provides same exports as mock-data.js

import realDataJson from './data/real-data.json';

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

// ==================== DATA SUMMARY (for debugging) ====================

console.log('📊 Real Data Loaded:');
console.log(`   States: ${Object.keys(stateData).length}`);
console.log(`   Counties: ${Object.keys(countyData).length}`);
console.log(`   Organizations: ${organizations.length}`);
console.log(`   National Children in Care: ${nationalStats.childrenInCare.toLocaleString()}`);