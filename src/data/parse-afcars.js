#!/usr/bin/env node

/**
 * parse-afcars.js
 * 
 * Parses AFCARS_GOOD.xlsx (federal foster care data) into afcars.json
 * 
 * Input: AFCARS.xlsx (156 rows = 52 states × 3 years)
 * Output: afcars.json
 * 
 * Usage: node parse-afcars.js [input_file] [output_file]
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_INPUT = './AFCARS.xlsx';
const DEFAULT_OUTPUT = './afcars.json';

// Column mapping: Excel column name → JSON field name
const COLUMN_MAP = {
  'State': 'state',
  'Year': 'year',
  'Children in Care': 'childrenInCare',
  'Children in Foster Care': 'childrenInFosterCare',
  'Children in Kinship Care': 'childrenInKinshipCare',
  'Children Waiting For Adoption': 'childrenWaitingForAdoption',
  'Number of Adoptions': 'childrenAdopted',
  'Biological Reunification Rate': 'reunificationRate',
  'Family Preservation Cases': 'familyPreservationCases',
  'Number of Licensed Homes': 'licensedHomes',
};

// Parse a cell value, handling nulls
function parseValue(value, fieldName) {
  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Handle special null markers in Family Preservation Cases
  if (value === '-' || value === '*') {
    return null;
  }
  
  // For state, return as-is (string)
  if (fieldName === 'state') {
    return String(value).trim();
  }
  
  // For year, return as integer
  if (fieldName === 'year') {
    return parseInt(value, 10);
  }
  
  // For reunification rate, keep as decimal
  if (fieldName === 'reunificationRate') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  // For all other numeric fields, parse as integer
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function parseAFCARS(inputPath, outputPath) {
  console.log('📊 AFCARS Parser');
  console.log('═'.repeat(50));
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log('');
  
  // Check input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  // Read Excel file
  console.log('📖 Reading Excel file...');
  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON (array of objects)
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  console.log(`   Found ${rawData.length} rows`);
  
  // Validate columns
  const firstRow = rawData[0];
  const expectedColumns = Object.keys(COLUMN_MAP);
  const actualColumns = Object.keys(firstRow);
  
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  if (missingColumns.length > 0) {
    console.error(`❌ Error: Missing columns: ${missingColumns.join(', ')}`);
    process.exit(1);
  }
  console.log('   ✓ All expected columns present');
  
  // Parse each row
  console.log('');
  console.log('🔄 Parsing data...');
  const data = [];
  const nullCounts = {};
  
  // Initialize null counts
  Object.values(COLUMN_MAP).forEach(field => {
    nullCounts[field] = 0;
  });
  
  for (const row of rawData) {
    const record = {};
    
    for (const [excelCol, jsonField] of Object.entries(COLUMN_MAP)) {
      const value = parseValue(row[excelCol], jsonField);
      record[jsonField] = value;
      
      if (value === null) {
        nullCounts[jsonField]++;
      }
    }
    
    data.push(record);
  }
  
  // Gather statistics
  const years = [...new Set(data.map(d => d.year))].sort();
  const states = [...new Set(data.map(d => d.state))].sort();
  
  // Calculate totals for verification
  const totals2023 = data
    .filter(d => d.year === 2023 && d.state !== 'PR')
    .reduce((acc, d) => {
      acc.childrenInCare += d.childrenInCare || 0;
      acc.childrenAdopted += d.childrenAdopted || 0;
      return acc;
    }, { childrenInCare: 0, childrenAdopted: 0 });
  
  console.log(`   ✓ Parsed ${data.length} records`);
  console.log(`   ✓ Years: ${years.join(', ')}`);
  console.log(`   ✓ States: ${states.length}`);
  console.log('');
  
  // Report nulls
  console.log('📋 Null counts:');
  for (const [field, count] of Object.entries(nullCounts)) {
    if (count > 0) {
      console.log(`   ${field}: ${count}`);
    }
  }
  console.log('');
  
  // Verification sums (2023 national totals excluding PR)
  console.log('✅ Verification (2023 US totals, excluding PR):');
  console.log(`   Children in Care: ${totals2023.childrenInCare.toLocaleString()}`);
  console.log(`   Children Adopted: ${totals2023.childrenAdopted.toLocaleString()}`);
  console.log('');
  
  // Build output
  const output = {
    metadata: {
      source: path.basename(inputPath),
      generated: new Date().toISOString(),
      years: years,
      stateCount: states.length,
      recordCount: data.length,
      nullCounts: nullCounts,
      verification: {
        year: 2023,
        excludes: 'PR',
        childrenInCare: totals2023.childrenInCare,
        childrenAdopted: totals2023.childrenAdopted
      }
    },
    data: data
  };
  
  // Write output
  console.log('💾 Writing output...');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`   ✓ Saved: ${outputPath} (${sizeKB} KB)`);
  console.log('');
  console.log('═'.repeat(50));
  console.log('✅ AFCARS parsing complete!');
}

// Main
const inputPath = process.argv[2] || DEFAULT_INPUT;
const outputPath = process.argv[3] || DEFAULT_OUTPUT;

parseAFCARS(inputPath, outputPath);