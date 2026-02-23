// Real data for the Foster Care App - All 50 States + DC
// Adapts real-data.json (from pipeline) to format expected by components

import realDataJson from './data/real-data.json';

// ==================== FORMATTING UTILITIES ====================

/** Format number with locale string, returns fallback for null */
export const fmt = (val, fallback = 'N/A') => 
  val !== null && val !== undefined ? val.toLocaleString() : fallback;

/** Format percentage - handles both decimal (0.45) and whole number (45) formats */
export const fmtPct = (val, fallback = 'N/A') => {
  if (val === null || val === undefined) return fallback;
  // If value is less than 1, treat as decimal (0.45 = 45%)
  // If value is >= 1, treat as already a percentage (45 = 45%)
  if (val < 1) {
    return `${(val * 100).toFixed(1)}%`;
  }
  return `${val.toFixed(1)}%`;
};

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
  'Pennsylvania': 'PA', 'Puerto Rico': 'PR', 'Rhode Island': 'RI', 'South Carolina': 'SC', 
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

export const stateCodeToName = Object.fromEntries(
  Object.entries(stateNameToCode).map(([name, code]) => [code, name])
);

// ==================== GEOGRAPHY LABEL OVERRIDES ====================
// Some states don't use "County" — map to the correct label per checklist
const GEOGRAPHY_LABEL_OVERRIDES = {
  'AK': 'District',
  'CT': 'Region',
  'DC': 'District',
  'NH': 'District',
  'SD': 'District Office',
  'VT': 'District Office',
  'WA': 'Region',
};

/** Get the geography label for a state (e.g. "County", "Region", "District Office") */
export const getGeographyLabel = (stateAbbrevOrName) => {
  let abbrev = stateAbbrevOrName;
  if (stateAbbrevOrName && stateAbbrevOrName.length > 2) {
    abbrev = stateNameToCode[stateAbbrevOrName] || stateAbbrevOrName.toUpperCase();
  }
  return GEOGRAPHY_LABEL_OVERRIDES[abbrev] || 'County';
};

// ==================== ACTIVITY TO IMPACT AREA MAPPING ====================
// Maps organization activities to MTE impact areas
const activityToImpactArea = {
  'recruit_foster_kinship': 'Foster and Kinship Families',
  'recruit_adoptive': 'Adoptive',
  'bio_family': 'Biological',
  'support': 'Wraparound'
};

const mapActivitiesToAreas = (activities) => {
  if (!activities || activities.length === 0) return [];
  return [...new Set(activities.map(a => activityToImpactArea[a]).filter(Boolean))];
};

// ==================== NATIONAL STATS ====================
// Use most recent year (2023) as default

const latestYear = Math.max(...Object.keys(realDataJson.national).map(Number));
const latestNational = realDataJson.national[latestYear];

export const nationalStats = {
  childrenInCare: latestNational.childrenInCare,
  childrenInFamilyFoster: latestNational.childrenInFosterCare,
  childrenInKinship: latestNational.childrenInKinshipCare,
  childrenWaitingAdoption: latestNational.childrenWaitingForAdoption,
  childrenAdopted2023: latestNational.childrenAdopted,
  familyPreservationCases: latestNational.familyPreservationCases,
  licensedHomes: latestNational.licensedHomes,
  // Note: totalChurches and churchesWithMinistry not available at national level
  totalChurches: null,
  churchesWithMinistry: null
};

export const nationalByYear = realDataJson.national;

// ==================== STATE DATA ====================
// Transform from { AL: { ... } } to { alabama: { ... } } format expected by components

export const stateData = {};
export const stateDataByCode = {};

Object.entries(realDataJson.states).forEach(([abbrev, state]) => {
  // Skip Puerto Rico for now (not in main views)
  if (abbrev === 'PR') return;
  
  // Get latest AFCARS year data
  const afcarsYears = Object.keys(state.afcars || {}).map(Number).sort((a, b) => b - a);
  const latestAfcarsYear = afcarsYears[0];
  const latestAfcars = latestAfcarsYear ? state.afcars[latestAfcarsYear] : {};
  
  // Get latest county data year
  const countyYears = [...new Set((state.counties || []).map(c => c.year))].sort((a, b) => b - a);
  const latestCountyYear = countyYears[0] || null;
  
  // Filter and deduplicate counties:
  // 1. Remove junk entries (numeric-only names, or all-null data with no coords)
  // 2. Take only the latest year for each county name
  const validCounties = (state.counties || []).filter(c => {
    // Filter out numeric-only names (e.g. "45444")
    if (/^\d+$/.test(c.name)) return false;
    // Filter out entries where all metric fields are null and no coordinates
    const hasAnyData = ['childrenInCare', 'childrenInFosterCare', 'childrenInKinshipCare',
      'childrenPlacedOutOfCounty', 'fosterKinshipHomes', 'childrenWaitingForAdoption',
      'familyPreservationCases', 'churches', 'population'].some(k => c[k] != null);
    if (!hasAnyData && !c.coordinates) return false;
    return true;
  });
  
  // Deduplicate: keep only the latest year entry per county name
  const countyByName = {};
  validCounties.forEach(c => {
    if (!countyByName[c.name] || c.year > countyByName[c.name].year) {
      countyByName[c.name] = c;
    }
  });
  const latestCounties = Object.values(countyByName);
  const totalFosterKinshipHomes = latestCounties.reduce((sum, c) => sum + (c.fosterKinshipHomes || 0), 0);
  const totalChurches = latestCounties.reduce((sum, c) => sum + (c.churches || 0), 0);
  
  // Create state key (lowercase with dashes)
  const stateKey = state.name.toLowerCase().replace(/\s+/g, '-');
  
  const stateRecord = {
    id: stateKey,
    abbreviation: abbrev,
    name: state.name,
    // AFCARS data (state-level)
    totalChildren: latestAfcars.childrenInCare || null,
    childrenInCare: latestAfcars.childrenInCare || null,
    childrenInFosterCare: latestAfcars.childrenInFosterCare || null,
    childrenInKinshipCare: latestAfcars.childrenInKinshipCare || null,
    waitingForAdoption: latestAfcars.childrenWaitingForAdoption || null,
    childrenAdopted: latestAfcars.childrenAdopted || null,
    reunificationRate: latestAfcars.reunificationRate || null,
    familyPreservationCases: latestAfcars.familyPreservationCases || null,
    // Licensed homes: use AFCARS if available, otherwise aggregate from county data
    licensedHomes: latestAfcars.licensedHomes || (totalFosterKinshipHomes > 0 ? totalFosterKinshipHomes : null),
    // Aggregated from county data
    totalChurches: totalChurches > 0 ? totalChurches : null,
    // Source info
    dataDate: state.source?.dataDate || null,
    dataYear: state.source?.dataYear || null,
    sourceAgency: state.source?.sourceAgency || null,
    sourceUrl: state.source?.sourceUrl || null,
    definitions: state.source?.definitions || {},
    // AFCARS by year
    afcars: state.afcars || {},
    // County data
    countyCount: latestCounties.length,
    latestCountyYear: latestCountyYear,
    geographyLabel: GEOGRAPHY_LABEL_OVERRIDES[abbrev] || 'County'
  };
  
  stateData[stateKey] = stateRecord;
  stateDataByCode[abbrev] = {
    ...state,
    id: stateKey
  };
});

// ==================== COUNTY DATA ====================
// Flatten counties into { "county-name-statecode": { ... } } structure

export const countyData = {};
export const countyCoordinatesByState = {};

Object.entries(realDataJson.states).forEach(([abbrev, state]) => {
  if (abbrev === 'PR') return;
  
  const stateKey = state.name.toLowerCase().replace(/\s+/g, '-');
  
  if (!countyCoordinatesByState[stateKey]) {
    countyCoordinatesByState[stateKey] = {};
  }
  
  // Filter out junk entries and deduplicate (keep latest year per name)
  const validCounties = (state.counties || []).filter(c => {
    if (/^\d+$/.test(c.name)) return false;
    const hasAnyData = ['childrenInCare', 'childrenInFosterCare', 'childrenInKinshipCare',
      'childrenPlacedOutOfCounty', 'fosterKinshipHomes', 'childrenWaitingForAdoption',
      'familyPreservationCases', 'churches', 'population'].some(k => c[k] != null);
    if (!hasAnyData && !c.coordinates) return false;
    return true;
  });
  
  const countyByName = {};
  validCounties.forEach(c => {
    if (!countyByName[c.name] || c.year > countyByName[c.name].year) {
      countyByName[c.name] = c;
    }
  });
  const deduplicatedCounties = Object.values(countyByName);

  deduplicatedCounties.forEach(county => {
    // Create county key: "county-name-statecode" (e.g., "autauga-al")
    const countyName = county.name.toLowerCase().replace(/\s+/g, '-');
    const countyKey = `${countyName}-${abbrev.toLowerCase()}`;
    
    // Calculate licensedHomesPerChild
    const licensedHomesPerChild = (county.fosterKinshipHomes && county.childrenInCare && county.childrenInCare > 0)
      ? (county.fosterKinshipHomes / county.childrenInCare).toFixed(2)
      : null;
    
    countyData[countyKey] = {
      id: countyKey,
      name: `${county.name}, ${state.name}`,
      countyName: county.name,
      state: state.name,
      stateAbbrev: abbrev,
      geographyType: county.geographyType || 'county',
      geographyLabel: GEOGRAPHY_LABEL_OVERRIDES[abbrev] || 'County',
      year: county.year,
      population: county.population,
      // Map to expected field names
      childrenInCare: county.childrenInCare,
      childrenInFamily: county.childrenInFosterCare, // Alias for components
      childrenInFosterCare: county.childrenInFosterCare,
      childrenInKinship: county.childrenInKinshipCare,
      childrenInKinshipCare: county.childrenInKinshipCare,
      childrenOutOfCounty: county.childrenPlacedOutOfCounty,
      childrenPlacedOutOfCounty: county.childrenPlacedOutOfCounty,
      licensedHomes: county.fosterKinshipHomes,
      fosterKinshipHomes: county.fosterKinshipHomes,
      licensedHomesPerChild: licensedHomesPerChild,
      waitingForAdoption: county.childrenWaitingForAdoption,
      childrenWaitingForAdoption: county.childrenWaitingForAdoption,
      childrenAdopted: county.childrenAdopted,
      childrenAdopted2024: county.childrenAdopted, // Alias for year-specific display
      reunificationRate: county.reunificationRate,
      familyPreservationCases: county.familyPreservationCases,
      totalChurches: county.churches,
      churches: county.churches,
      coordinates: county.coordinates || null,
      // Fields not in new data - set to null
      avgMonthsToAdoption: null,
      churchesProvidingSupport: null,
      supportPercentage: null
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
  
  // Filter out junk entries
  let counties = (state.counties || []).filter(c => {
    if (/^\d+$/.test(c.name)) return false;
    const hasAnyData = ['childrenInCare', 'childrenInFosterCare', 'childrenInKinshipCare',
      'childrenPlacedOutOfCounty', 'fosterKinshipHomes', 'childrenWaitingForAdoption',
      'familyPreservationCases', 'churches', 'population'].some(k => c[k] != null);
    if (!hasAnyData && !c.coordinates) return false;
    return true;
  });
  
  // Filter by year if specified
  if (year) {
    counties = counties.filter(c => c.year === year);
  } else {
    // Deduplicate: keep latest year per name
    const byName = {};
    counties.forEach(c => {
      if (!byName[c.name] || c.year > byName[c.name].year) {
        byName[c.name] = c;
      }
    });
    counties = Object.values(byName);
  }
  
  return counties;
};

// ==================== ORGANIZATIONS ====================

export const organizations = (realDataJson.organizations || [])
  .filter(org => org.isOrganization) // Exclude network-only entries
  .map(org => {
    // Get first network membership if any
    const firstMembership = org.networkMemberships?.[0];
    
    return {
      ...org,
      // Ensure consistent field names expected by components
      description: org.generatedDescription || null,
      // Convert coordinates object to array format
      coords: org.coordinates ? [org.coordinates.lat, org.coordinates.lng] : null,
      lat: org.coordinates?.lat || null,
      lng: org.coordinates?.lng || null,
      // Flatten address fields
      state: org.address?.state || null,
      city: org.address?.city || null,
      county: org.address?.county || null,
      // Map activities to impact areas
      areas: mapActivitiesToAreas(org.activities),
      // Network membership - derive from array
      networkName: firstMembership?.network || null,
      networkMember: firstMembership ? true : false,
      // Location display string
      location: org.address?.city 
        ? `${org.address.city}, ${org.address.state}`
        : org.address?.state || null
    };
  });

export const networks = (realDataJson.networks || []).map(net => ({
  name: net.name,
  memberCount: net.memberCount,
  members: net.members
}));

// ==================== STATE COORDINATES (for US map) ====================

export const stateCoordinates = {
  'Alabama': { coords: [32.806671, -86.791130], orgCount: 0 },
  'Alaska': { coords: [61.370716, -152.404419], orgCount: 0 },
  'Arizona': { coords: [33.729759, -111.431221], orgCount: 0 },
  'Arkansas': { coords: [34.969704, -92.373123], orgCount: 0 },
  'California': { coords: [36.116203, -119.681564], orgCount: 0 },
  'Colorado': { coords: [39.059811, -105.311104], orgCount: 0 },
  'Connecticut': { coords: [41.597782, -72.755371], orgCount: 0 },
  'Delaware': { coords: [39.318523, -75.507141], orgCount: 0 },
  'District of Columbia': { coords: [38.897438, -77.026817], orgCount: 0 },
  'Florida': { coords: [27.766279, -81.686783], orgCount: 0 },
  'Georgia': { coords: [33.040619, -83.643074], orgCount: 0 },
  'Hawaii': { coords: [21.094318, -157.498337], orgCount: 0 },
  'Idaho': { coords: [44.240459, -114.478828], orgCount: 0 },
  'Illinois': { coords: [40.349457, -88.986137], orgCount: 0 },
  'Indiana': { coords: [39.849426, -86.258278], orgCount: 0 },
  'Iowa': { coords: [42.011539, -93.210526], orgCount: 0 },
  'Kansas': { coords: [38.526600, -96.726486], orgCount: 0 },
  'Kentucky': { coords: [37.668140, -84.670067], orgCount: 0 },
  'Louisiana': { coords: [31.169546, -91.867805], orgCount: 0 },
  'Maine': { coords: [44.693947, -69.381927], orgCount: 0 },
  'Maryland': { coords: [39.063946, -76.802101], orgCount: 0 },
  'Massachusetts': { coords: [42.230171, -71.530106], orgCount: 0 },
  'Michigan': { coords: [43.326618, -84.536095], orgCount: 0 },
  'Minnesota': { coords: [45.694454, -93.900192], orgCount: 0 },
  'Mississippi': { coords: [32.741646, -89.678696], orgCount: 0 },
  'Missouri': { coords: [38.456085, -92.288368], orgCount: 0 },
  'Montana': { coords: [46.921925, -110.454353], orgCount: 0 },
  'Nebraska': { coords: [41.125370, -98.268082], orgCount: 0 },
  'Nevada': { coords: [38.313515, -117.055374], orgCount: 0 },
  'New Hampshire': { coords: [43.452492, -71.563896], orgCount: 0 },
  'New Jersey': { coords: [40.298904, -74.521011], orgCount: 0 },
  'New Mexico': { coords: [34.840515, -106.248482], orgCount: 0 },
  'New York': { coords: [42.165726, -74.948051], orgCount: 0 },
  'North Carolina': { coords: [35.630066, -79.806419], orgCount: 0 },
  'North Dakota': { coords: [47.528912, -99.784012], orgCount: 0 },
  'Ohio': { coords: [40.388783, -82.764915], orgCount: 0 },
  'Oklahoma': { coords: [35.565342, -96.928917], orgCount: 0 },
  'Oregon': { coords: [44.572021, -122.070938], orgCount: 0 },
  'Pennsylvania': { coords: [40.590752, -77.209755], orgCount: 0 },
  'Rhode Island': { coords: [41.680893, -71.511780], orgCount: 0 },
  'South Carolina': { coords: [33.856892, -80.945007], orgCount: 0 },
  'South Dakota': { coords: [44.299782, -99.438828], orgCount: 0 },
  'Tennessee': { coords: [35.747845, -86.692345], orgCount: 0 },
  'Texas': { coords: [31.054487, -97.563461], orgCount: 0 },
  'Utah': { coords: [40.150032, -111.862434], orgCount: 0 },
  'Vermont': { coords: [44.045876, -72.710686], orgCount: 0 },
  'Virginia': { coords: [37.769337, -78.169968], orgCount: 0 },
  'Washington': { coords: [47.400902, -121.490494], orgCount: 0 },
  'West Virginia': { coords: [38.491226, -80.954453], orgCount: 0 },
  'Wisconsin': { coords: [44.268543, -89.616508], orgCount: 0 },
  'Wyoming': { coords: [42.755966, -107.302490], orgCount: 0 }
};

// Calculate org counts per state
organizations.forEach(org => {
  if (org.state && stateCodeToName[org.state]) {
    const stateName = stateCodeToName[org.state];
    if (stateCoordinates[stateName]) {
      stateCoordinates[stateName].orgCount++;
    }
  }
});

// ==================== HISTORICAL DATA ====================
// Build from AFCARS multi-year data + county metrics

export const historicalData = {};

// Add national data by year
Object.entries(realDataJson.national).forEach(([year, data]) => {
  if (!historicalData[year]) {
    historicalData[year] = { national: {}, states: {}, counties: {} };
  }
  historicalData[year].national = {
    childrenInCare: data.childrenInCare,
    childrenInFamilyFoster: data.childrenInFosterCare,
    childrenInKinship: data.childrenInKinshipCare,
    childrenWaitingAdoption: data.childrenWaitingForAdoption,
    childrenAdopted: data.childrenAdopted,
    familyPreservationCases: data.familyPreservationCases,
    licensedHomes: data.licensedHomes
  };
});

// Add state data by year (from AFCARS)
Object.entries(realDataJson.states).forEach(([abbrev, state]) => {
  if (abbrev === 'PR') return;
  
  const stateKey = state.name.toLowerCase().replace(/\s+/g, '-');
  
  Object.entries(state.afcars || {}).forEach(([year, data]) => {
    if (!historicalData[year]) {
      historicalData[year] = { national: {}, states: {}, counties: {} };
    }
    historicalData[year].states[stateKey] = {
      name: state.name,
      totalChildren: data.childrenInCare,
      childrenInFosterCare: data.childrenInFosterCare,
      childrenInKinship: data.childrenInKinshipCare,
      licensedHomes: data.licensedHomes,
      waitingForAdoption: data.childrenWaitingForAdoption,
      childrenAdopted: data.childrenAdopted,
      reunificationRate: data.reunificationRate,
      familyPreservationCases: data.familyPreservationCases
    };
  });
  
  // Add county data by year (from metrics) — filter junk entries
  (state.counties || []).filter(c => {
    if (/^\d+$/.test(c.name)) return false;
    const hasAnyData = ['childrenInCare', 'childrenInFosterCare', 'childrenInKinshipCare',
      'childrenPlacedOutOfCounty', 'fosterKinshipHomes', 'childrenWaitingForAdoption',
      'familyPreservationCases', 'churches', 'population'].some(k => c[k] != null);
    if (!hasAnyData && !c.coordinates) return false;
    return true;
  }).forEach(county => {
    const countyName = county.name.toLowerCase().replace(/\s+/g, '-');
    const countyKey = `${countyName}-${abbrev.toLowerCase()}`;
    const year = String(county.year);
    
    if (!historicalData[year]) {
      historicalData[year] = { national: {}, states: {}, counties: {} };
    }
    
    historicalData[year].counties[countyKey] = {
      name: county.name,
      childrenInCare: county.childrenInCare,
      childrenInFamily: county.childrenInFosterCare,
      childrenInKinship: county.childrenInKinshipCare,
      licensedHomes: county.fosterKinshipHomes,
      waitingForAdoption: county.childrenWaitingForAdoption,
      childrenAdopted: county.childrenAdopted,
      reunificationRate: county.reunificationRate,
      familyPreservationCases: county.familyPreservationCases,
      totalChurches: county.churches,
      childrenOutOfCounty: county.childrenPlacedOutOfCounty
    };
  });
});

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

const totalCounties = Object.keys(countyData).length;
const withCoords = Object.values(countyData).filter(c => c.coordinates).length;
const orgsWithCoords = organizations.filter(o => o.coords).length;
const withDescriptions = organizations.filter(o => o.description).length;

console.log('📊 Real Data Loaded:');
console.log(`   States: ${Object.keys(stateData).length}`);
console.log(`   County records: ${totalCounties}`);
console.log(`   Counties with coordinates: ${withCoords}`);
console.log(`   Organizations: ${organizations.length} (${orgsWithCoords} with coords, ${withDescriptions} with descriptions)`);
console.log(`   Networks: ${networks.length}`);
console.log(`   National Children in Care (${latestYear}): ${fmt(nationalStats.childrenInCare)}`);
console.log(`   National Licensed Homes (${latestYear}): ${fmt(nationalStats.licensedHomes)}`);