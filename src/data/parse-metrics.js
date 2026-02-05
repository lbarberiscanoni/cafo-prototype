#!/usr/bin/env node

/**
 * parse-metrics.js
 * 
 * Parses MTE_Metrics Excel files (2024 and 2025) into metrics.json
 * 
 * Handles:
 * - Multiple state sheets per file
 * - Geography variations: County, Region, District Office
 * - Column variations across states and years
 * - Non-county states: Alaska (regions), Connecticut (R1-R6), Vermont (district offices)
 * - Null preservation (missing data stays null, not 0)
 * 
 * Input: MTE_Metrics_2024.xlsx, MTE_Metrics_2025.xlsx
 * Output: metrics.json
 * 
 * Usage: node parse-metrics.js [2024_file] [2025_file] [output_file]
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_2024 = './MTE_Metrics_2024.xlsx';
const DEFAULT_2025 = './MTE_Metrics_2025.xlsx';
const DEFAULT_OUTPUT = './metrics.json';

// Sheets to skip (not state data)
const SKIP_SHEETS = [
  'All Data Connect', 'Metrics Check', 'State Overview', 'Top 50%', 
  'Sheet75', 'Sheet1', 'Instructions', 'Data Dictionary'
];

// State name to abbreviation mapping
const STATE_ABBREV = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
  'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
  'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
  'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
  'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
  'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY', 'Puerto Rico': 'PR'
};

// Column name mapping to canonical names
const COLUMN_MAP = {
  // Geography columns (pick first match)
  'County': 'geography',
  'Region': 'geography',
  'District Office': 'geography',
  
  // Population columns
  'County Population': 'population',
  'Region Population': 'population',
  
  // Metric columns
  'Number of Children in Care': 'childrenInCare',
  'Number of Children in Foster Care': 'childrenInFosterCare',
  'Number of Children in Kinship Care': 'childrenInKinshipCare',
  'Number of Children Placed Out-of-County': 'childrenPlacedOutOfCounty',
  'Number of Foster and Kinship Homes': 'fosterKinshipHomes',
  'Number of Foster Homes': 'fosterHomes',
  'Number of Kinship Homes': 'kinshipHomes',
  'Number of Children Waiting for Adoption': 'childrenWaitingForAdoption',
  'Number of Children with 80+ Connections Made': 'childrenWith80PlusConnections',
  'Biological Family Reunification Rate': 'reunificationRate',
  'Biological Family Reunification Rate (Oct-Dec)': 'reunificationRateQ4',
  'Number of Family Preservation Cases': 'familyPreservationCases',
  'Number of Adoptive Families': 'adoptiveFamilies',
  'Number of Biological Families': 'biologicalFamilies',
  'Number of Wraparound Supporters': 'wraparoundSupporters',
  'Number of Churches': 'churches',
  'Foster Family Retention Rate': 'fosterRetentionRate',
  'Number Adopted': 'childrenAdopted',
  'Time Elapsed to Adoption (Months)': 'monthsToAdoption',
  'Average Beds per Family': 'avgBedsPerFamily'
};

// Geography type by state
const GEOGRAPHY_TYPE = {
  'AK': 'region',
  'CT': 'region',
  'NH': 'city',
  'SD': 'city',
  'VT': 'districtOffice',
  'WA': 'region',
  'DC': 'district'
};

// Parse a numeric value, preserving nulls
function parseNumeric(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Handle string values
  const str = String(value).trim();
  if (str === '' || str === 'NaN' || str === 'nan' || str === '-' || str === '*' || str === 'N/A') {
    return null;
  }
  
  // Try to parse
  const num = parseFloat(str.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// Clean geography name
function cleanGeography(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  const str = String(value).trim();
  
  // Skip metadata rows
  if (str === '' || str === 'NaN' || str.toLowerCase().includes('data as of')) {
    return null;
  }
  
  // Skip aggregate rows
  if (str.toLowerCase() === 'central office' || str.toLowerCase() === 'total') {
    return null;
  }
  
  return str;
}

// Parse a single state sheet
function parseStateSheet(workbook, sheetName, year) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  
  // Read all rows as arrays
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rawData.length < 3) return null;
  
  // Row 0 has state name, Row 1 has headers, Row 2+ has data
  // But some sheets might have headers in row 0 - check for 'County' or 'Region'
  let headerRowIdx = 0;
  const geoColumns = ['County', 'Region', 'District Office'];
  
  // Find the header row by looking for geography column
  for (let i = 0; i < Math.min(3, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => geoColumns.includes(String(cell || '').trim()))) {
      headerRowIdx = i;
      break;
    }
  }
  
  const headers = rawData[headerRowIdx];
  if (!headers || headers.length === 0) return null;
  
  // Find state abbreviation
  const stateAbbrev = STATE_ABBREV[sheetName];
  if (!stateAbbrev) return null;
  
  // Determine geography type
  const geoType = GEOGRAPHY_TYPE[stateAbbrev] || 'county';
  
  // Map headers to canonical names
  const colMap = {};
  let geoColIdx = -1;
  
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i] || '').trim();
    const canonical = COLUMN_MAP[header];
    
    if (canonical === 'geography') {
      geoColIdx = i;
      colMap[i] = 'geography';
    } else if (canonical) {
      colMap[i] = canonical;
    }
  }
  
  if (geoColIdx === -1) {
    // No geography column found
    return null;
  }
  
  // Parse data rows (starting after header row)
  const records = [];
  
  for (let rowIdx = headerRowIdx + 1; rowIdx < rawData.length; rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || row.length === 0) continue;
    
    // Get geography name
    const geoName = cleanGeography(row[geoColIdx]);
    if (!geoName) continue;
    
    // Build record
    const record = {
      state: stateAbbrev,
      stateName: sheetName,
      geography: geoName,
      geographyType: geoType,
      year: year
    };
    
    // Parse all mapped columns
    for (const [colIdx, fieldName] of Object.entries(colMap)) {
      if (fieldName === 'geography') continue;
      
      const value = row[parseInt(colIdx)];
      record[fieldName] = parseNumeric(value);
    }
    
    records.push(record);
  }
  
  return records;
}

// Parse a metrics file
function parseMetricsFile(filePath, year) {
  console.log(`\n📖 Reading ${year} file: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  File not found, skipping`);
    return { records: [], states: [], counties: 0 };
  }
  
  const workbook = XLSX.readFile(filePath);
  console.log(`   Found ${workbook.SheetNames.length} sheets`);
  
  const allRecords = [];
  const statesProcessed = [];
  let skipped = 0;
  
  for (const sheetName of workbook.SheetNames) {
    // Skip non-state sheets
    if (SKIP_SHEETS.some(s => sheetName.includes(s))) {
      continue;
    }
    
    // Skip "Data" sheets (raw data duplicates)
    if (sheetName.includes(' Data')) {
      continue;
    }
    
    // Check if it's a known state
    if (!STATE_ABBREV[sheetName]) {
      skipped++;
      continue;
    }
    
    const records = parseStateSheet(workbook, sheetName, year);
    if (records && records.length > 0) {
      allRecords.push(...records);
      statesProcessed.push(STATE_ABBREV[sheetName]);
    }
  }
  
  console.log(`   ✓ Parsed ${statesProcessed.length} states, ${allRecords.length} county records`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped ${skipped} non-state sheets`);
  }
  
  return {
    records: allRecords,
    states: statesProcessed,
    counties: allRecords.length
  };
}

function parseMetrics(file2024, file2025, outputPath) {
  console.log('📊 MTE Metrics Parser');
  console.log('═'.repeat(50));
  console.log(`2024 file: ${file2024}`);
  console.log(`2025 file: ${file2025}`);
  console.log(`Output:    ${outputPath}`);
  
  // Parse both years
  const result2024 = parseMetricsFile(file2024, 2024);
  const result2025 = parseMetricsFile(file2025, 2025);
  
  // Combine records
  const allRecords = [...result2024.records, ...result2025.records];
  
  // Statistics
  const allStates = new Set([...result2024.states, ...result2025.states]);
  const byState = {};
  const byYear = { 2024: 0, 2025: 0 };
  const byGeoType = {};
  
  for (const record of allRecords) {
    // Count by state
    byState[record.state] = (byState[record.state] || 0) + 1;
    
    // Count by year
    byYear[record.year]++;
    
    // Count by geography type
    byGeoType[record.geographyType] = (byGeoType[record.geographyType] || 0) + 1;
  }
  
  // Sample null counts for a few key fields
  const nullCounts = {};
  const keyFields = ['childrenInCare', 'fosterKinshipHomes', 'reunificationRate', 'childrenAdopted', 'churches'];
  for (const field of keyFields) {
    nullCounts[field] = allRecords.filter(r => r[field] === null).length;
  }
  
  // Verification: County counts for known states (from ADR)
  const txCount = allRecords.filter(r => r.state === 'TX' && r.year === 2025).length;
  const gaCount = allRecords.filter(r => r.state === 'GA' && r.year === 2025).length;
  const kyCount = allRecords.filter(r => r.state === 'KY' && r.year === 2025).length;
  
  console.log('\n📋 Summary:');
  console.log(`   Total records: ${allRecords.length}`);
  console.log(`   States: ${allStates.size}`);
  console.log(`   By year: 2024=${byYear[2024]}, 2025=${byYear[2025]}`);
  console.log(`   By geography type:`);
  Object.entries(byGeoType).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });
  
  console.log('\n✅ Verification (2025 county counts):');
  console.log(`   TX: ${txCount} (expected: 254)`);
  console.log(`   GA: ${gaCount} (expected: 159)`);
  console.log(`   KY: ${kyCount} (expected: 120)`);
  
  console.log('\n📋 Null counts (sample fields):');
  Object.entries(nullCounts).forEach(([field, count]) => {
    const pct = ((count / allRecords.length) * 100).toFixed(1);
    console.log(`   ${field}: ${count} (${pct}%)`);
  });
  
  // Build output
  const output = {
    metadata: {
      sources: [path.basename(file2024), path.basename(file2025)],
      generated: new Date().toISOString(),
      totalRecords: allRecords.length,
      stateCount: allStates.size,
      byYear: byYear,
      byGeographyType: byGeoType,
      verification: {
        year: 2025,
        TX: txCount,
        GA: gaCount,
        KY: kyCount
      },
      nullCounts: nullCounts
    },
    data: allRecords
  };
  
  // Write output
  console.log('\n💾 Writing output...');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`   ✓ Saved: ${outputPath} (${sizeMB} MB)`);
  console.log('');
  console.log('═'.repeat(50));
  console.log('✅ Metrics parsing complete!');
}

// Main
const file2024 = process.argv[2] || DEFAULT_2024;
const file2025 = process.argv[3] || DEFAULT_2025;
const outputPath = process.argv[4] || DEFAULT_OUTPUT;

parseMetrics(file2024, file2025, outputPath);