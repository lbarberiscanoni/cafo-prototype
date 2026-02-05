#!/usr/bin/env node

/**
 * merge.js
 * 
 * Merges all parsed JSON files into a single real-data.json for the app.
 * 
 * Combines:
 * - afcars.json: State/national metrics (ADR-006)
 * - sources.json: Dates and definitions per state (ADR-004)
 * - metrics.json: County-level metrics (ADR-005, ADR-006)
 * - orgs-and-networks.json: Organizations and networks (ADR-001, ADR-008)
 * 
 * Output structure:
 * {
 *   metadata: { ... },
 *   national: { ... },
 *   states: { [stateAbbrev]: { info, afcars, counties } },
 *   organizations: [ ... ],
 *   networks: [ ... ]
 * }
 * 
 * Usage: node merge.js [data_dir] [output_file]
 */

const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_DATA_DIR = './';
const DEFAULT_OUTPUT = './real-data.json';

// State abbreviation to full name mapping
const STATE_NAMES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'PR': 'Puerto Rico'
};

// Full name to abbreviation (reverse lookup)
const STATE_ABBREVS = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [name, abbr])
);

// Load JSON file
function loadJSON(dataDir, filename) {
  const filepath = path.join(dataDir, filename);
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Error: ${filename} not found`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Calculate national totals from AFCARS
function calculateNationalTotals(afcarsData) {
  const byYear = {};
  
  for (const record of afcarsData) {
    // Exclude Puerto Rico from US totals
    if (record.state === 'PR') continue;
    
    const year = record.year;
    if (!byYear[year]) {
      byYear[year] = {
        year,
        childrenInCare: 0,
        childrenInFosterCare: 0,
        childrenInKinshipCare: 0,
        childrenWaitingForAdoption: 0,
        childrenAdopted: 0,
        familyPreservationCases: 0,
        stateCount: 0
      };
    }
    
    byYear[year].childrenInCare += record.childrenInCare || 0;
    byYear[year].childrenInFosterCare += record.childrenInFosterCare || 0;
    byYear[year].childrenInKinshipCare += record.childrenInKinshipCare || 0;
    byYear[year].childrenWaitingForAdoption += record.childrenWaitingForAdoption || 0;
    byYear[year].childrenAdopted += record.childrenAdopted || 0;
    byYear[year].familyPreservationCases += record.familyPreservationCases || 0;
    byYear[year].stateCount++;
  }
  
  return byYear;
}

// Build state data structure
function buildStates(afcarsData, sourcesData, metricsData) {
  const states = {};
  
  // Initialize states from AFCARS
  for (const record of afcarsData) {
    const abbrev = record.state;
    if (!states[abbrev]) {
      states[abbrev] = {
        abbreviation: abbrev,
        name: STATE_NAMES[abbrev] || abbrev,
        source: null,
        afcars: {},
        counties: {}
      };
    }
    
    // Add AFCARS data by year
    states[abbrev].afcars[record.year] = {
      childrenInCare: record.childrenInCare,
      childrenInFosterCare: record.childrenInFosterCare,
      childrenInKinshipCare: record.childrenInKinshipCare,
      childrenWaitingForAdoption: record.childrenWaitingForAdoption,
      childrenAdopted: record.childrenAdopted,
      reunificationRate: record.reunificationRate,
      familyPreservationCases: record.familyPreservationCases
    };
  }
  
  // Add source info from Sources & Definitions
  for (const source of sourcesData) {
    // Find state by name
    const abbrev = STATE_ABBREVS[source.state];
    if (!abbrev || !states[abbrev]) {
      // State might not be in AFCARS, create it
      if (abbrev) {
        states[abbrev] = {
          abbreviation: abbrev,
          name: source.state,
          source: null,
          afcars: {},
          counties: {}
        };
      } else {
        continue;
      }
    }
    
    states[abbrev].source = {
      dataDate: source.dataDate,
      dataYear: source.dataYear,
      sourceAgency: source.sourceAgency,
      sourceUrl: source.sourceUrl,
      definitions: source.definitions
    };
  }
  
  // Add county/region data from Metrics
  for (const record of metricsData) {
    const abbrev = record.state;
    if (!states[abbrev]) {
      states[abbrev] = {
        abbreviation: abbrev,
        name: STATE_NAMES[abbrev] || record.stateName,
        source: null,
        afcars: {},
        counties: {}
      };
    }
    
    const geoKey = `${record.geography}_${record.year}`;
    states[abbrev].counties[geoKey] = {
      name: record.geography,
      geographyType: record.geographyType,
      year: record.year,
      population: record.population,
      childrenInCare: record.childrenInCare,
      childrenInFosterCare: record.childrenInFosterCare,
      childrenInKinshipCare: record.childrenInKinshipCare,
      childrenPlacedOutOfCounty: record.childrenPlacedOutOfCounty,
      fosterKinshipHomes: record.fosterKinshipHomes,
      fosterHomes: record.fosterHomes,
      kinshipHomes: record.kinshipHomes,
      childrenWaitingForAdoption: record.childrenWaitingForAdoption,
      reunificationRate: record.reunificationRate,
      familyPreservationCases: record.familyPreservationCases,
      churches: record.churches,
      childrenAdopted: record.childrenAdopted
    };
  }
  
  // Convert counties object to array for each state
  for (const abbrev of Object.keys(states)) {
    const countiesObj = states[abbrev].counties;
    states[abbrev].counties = Object.values(countiesObj);
  }
  
  return states;
}

function merge(dataDir, outputPath) {
  console.log('🔄 MTE Data Merge');
  console.log('═'.repeat(50));
  console.log(`Data directory: ${dataDir}`);
  console.log(`Output: ${outputPath}`);
  console.log('');
  
  // Load all input files
  console.log('📖 Loading input files...');
  const afcars = loadJSON(dataDir, 'afcars.json');
  const sources = loadJSON(dataDir, 'sources.json');
  const metrics = loadJSON(dataDir, 'metrics.json');
  const orgs = loadJSON(dataDir, 'orgs-and-networks.json');
  
  console.log(`   ✓ afcars.json: ${afcars.data.length} records`);
  console.log(`   ✓ sources.json: ${sources.data.length} states`);
  console.log(`   ✓ metrics.json: ${metrics.data.length} records`);
  console.log(`   ✓ orgs-and-networks.json: ${orgs.organizations.length} orgs, ${orgs.networks.length} networks`);
  
  // Build merged structure
  console.log('');
  console.log('🔄 Merging data...');
  
  // Calculate national totals
  const national = calculateNationalTotals(afcars.data);
  console.log(`   ✓ National totals: ${Object.keys(national).length} years`);
  
  // Build state data
  const states = buildStates(afcars.data, sources.data, metrics.data);
  const stateCount = Object.keys(states).length;
  const totalCounties = Object.values(states).reduce((sum, s) => sum + s.counties.length, 0);
  console.log(`   ✓ States: ${stateCount}`);
  console.log(`   ✓ Total county records: ${totalCounties}`);
  
  // Build output
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      sources: {
        afcars: afcars.metadata,
        sources: sources.metadata,
        metrics: metrics.metadata,
        organizations: orgs.metadata
      },
      counts: {
        states: stateCount,
        countyRecords: totalCounties,
        organizations: orgs.organizations.length,
        networks: orgs.networks.length
      }
    },
    national: national,
    states: states,
    organizations: orgs.organizations,
    networks: orgs.networks
  };
  
  // Statistics
  console.log('');
  console.log('📋 Summary:');
  console.log(`   National years: ${Object.keys(national).join(', ')}`);
  console.log(`   States: ${stateCount}`);
  console.log(`   County/region records: ${totalCounties}`);
  console.log(`   Organizations: ${orgs.organizations.length}`);
  console.log(`   Networks: ${orgs.networks.length}`);
  
  // Sample verification
  const tx = states['TX'];
  if (tx) {
    console.log('');
    console.log('✅ Verification (Texas):');
    console.log(`   AFCARS 2023 children in care: ${tx.afcars[2023]?.childrenInCare?.toLocaleString() || 'N/A'}`);
    console.log(`   County records: ${tx.counties.length}`);
    console.log(`   Source date: ${tx.source?.dataDate || 'N/A'}`);
  }
  
  // Write output
  console.log('');
  console.log('💾 Writing output...');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`   ✓ Saved: ${outputPath} (${sizeMB} MB)`);
  
  console.log('');
  console.log('═'.repeat(50));
  console.log('✅ Merge complete!');
}

// Main
const dataDir = process.argv[2] || DEFAULT_DATA_DIR;
const outputPath = process.argv[3] || DEFAULT_OUTPUT;

merge(dataDir, outputPath);