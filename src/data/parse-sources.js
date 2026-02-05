#!/usr/bin/env node

/**
 * parse-sources.js
 * 
 * Parses Sources_and_Definitions.xlsx into sources.json
 * 
 * This file provides:
 * - Authoritative "Date of Data Collection" per state (ADR-004)
 * - Source URLs and agency names
 * - Metric definitions per state (for tooltips - ADR-009)
 * 
 * Input: Sources_and_Definitions.xlsx
 * Output: sources.json
 * 
 * Usage: node parse-sources.js [input_file] [output_file]
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_INPUT = './Sources_and_Definitions.xlsx';
const DEFAULT_OUTPUT = './sources.json';

// Column mapping: Excel column name → JSON field name
const COLUMN_MAP = {
  'Unnamed: 0': 'state',
  'Date of Data Collection': 'dataDate',
  'Source': 'sourceAgency',
  'Source Hyperlink': 'sourceUrl',
  'Number of Children in Care': 'defChildrenInCare',
  'Number of Children in Family Foster Care': 'defChildrenInFosterCare',
  'Number of Children in Kinship Care': 'defChildrenInKinshipCare',
  'Number of Children Placed Out-of-County': 'defChildrenPlacedOutOfCounty',
  'Number of Foster and Kinship Homes': 'defFosterKinshipHomes',
  'Number of Children Waiting for Adoption': 'defChildrenWaitingForAdoption',
  'Biological Family Reunification Rate': 'defReunificationRate',
  'Number of Family Preservation Cases': 'defFamilyPreservationCases',
  'Number of Churches': 'defChurches',
  'Number of Children Adopted': 'defChildrenAdopted',
  'Months Elapsed to Adoption': 'defMonthsToAdoption'
};

// Clean up cell value
function cleanValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Convert to string and trim
  let str = String(value).trim();
  
  // Remove embedded notes like "(check when back in the US)"
  // These are in Nevada, Ohio, West Virginia
  str = str.replace(/\s*\(check when.*?\)\s*/gi, '').trim();
  
  // Return null for empty strings
  if (str === '' || str === 'NaN') {
    return null;
  }
  
  return str;
}

// Parse date value
function parseDate(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's already a Date object (Excel dates)
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  // If it's a string, try to parse it
  const str = String(value).trim();
  if (!str || str === 'NaN') {
    return null;
  }
  
  // Try parsing as date
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Return as-is if we can't parse
  return str;
}

// Extract year from date string
function extractYear(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

function parseSources(inputPath, outputPath) {
  console.log('📊 Sources and Definitions Parser');
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
  const workbook = XLSX.readFile(inputPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  console.log(`   Found ${rawData.length} rows`);
  
  // Parse each row
  console.log('');
  console.log('🔄 Parsing data...');
  const data = [];
  const issues = [];
  
  for (const row of rawData) {
    // Get state name from first column (xlsx uses __EMPTY for unnamed columns)
    const stateName = row['__EMPTY'];
    if (!stateName || String(stateName).trim() === '') {
      continue; // Skip empty rows
    }
    
    const state = cleanValue(stateName);
    
    // Check for known typos
    if (state === 'Pennslyvania') {
      issues.push(`Typo found: "Pennslyvania" should be "Pennsylvania"`);
    }
    
    const record = {
      state: state,
      dataDate: parseDate(row['Date of Data Collection']),
      dataYear: null,
      sourceAgency: cleanValue(row['Source']),
      sourceUrl: cleanValue(row['Source Hyperlink']),
      definitions: {}
    };
    
    // Extract year from date
    record.dataYear = extractYear(record.dataDate);
    
    // Parse definitions
    const defColumns = [
      ['Number of Children in Care', 'childrenInCare'],
      ['Number of Children in Family Foster Care', 'childrenInFosterCare'],
      ['Number of Children in Kinship Care', 'childrenInKinshipCare'],
      ['Number of Children Placed Out-of-County', 'childrenPlacedOutOfCounty'],
      ['Number of Foster and Kinship Homes', 'fosterKinshipHomes'],
      ['Number of Children Waiting for Adoption', 'childrenWaitingForAdoption'],
      ['Biological Family Reunification Rate', 'reunificationRate'],
      ['Number of Family Preservation Cases', 'familyPreservationCases'],
      ['Number of Churches', 'churches'],
      ['Number of Children Adopted', 'childrenAdopted'],
      ['Months Elapsed to Adoption', 'monthsToAdoption']
    ];
    
    for (const [excelCol, jsonField] of defColumns) {
      const def = cleanValue(row[excelCol]);
      if (def) {
        record.definitions[jsonField] = def;
      }
    }
    
    data.push(record);
  }
  
  console.log(`   ✓ Parsed ${data.length} states`);
  
  // Report issues
  if (issues.length > 0) {
    console.log('');
    console.log('⚠️  Data issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  // Statistics
  const withUrl = data.filter(d => d.sourceUrl).length;
  const byYear = {};
  data.forEach(d => {
    const year = d.dataYear || 'unknown';
    byYear[year] = (byYear[year] || 0) + 1;
  });
  
  // Count definitions coverage
  const defCoverage = {};
  const defFields = ['childrenInCare', 'childrenInFosterCare', 'childrenInKinshipCare', 
                     'fosterKinshipHomes', 'childrenWaitingForAdoption', 'reunificationRate',
                     'familyPreservationCases', 'churches', 'childrenAdopted'];
  for (const field of defFields) {
    defCoverage[field] = data.filter(d => d.definitions[field]).length;
  }
  
  console.log('');
  console.log('📋 Statistics:');
  console.log(`   States with source URL: ${withUrl}/${data.length}`);
  console.log('');
  console.log('   Data year distribution:');
  Object.entries(byYear).sort((a, b) => b[0] - a[0]).forEach(([year, count]) => {
    console.log(`     ${year}: ${count} states`);
  });
  console.log('');
  console.log('   Definition coverage:');
  Object.entries(defCoverage).forEach(([field, count]) => {
    console.log(`     ${field}: ${count} states`);
  });
  
  // Build output
  const output = {
    metadata: {
      source: path.basename(inputPath),
      generated: new Date().toISOString(),
      stateCount: data.length,
      statesWithUrl: withUrl,
      dataYearDistribution: byYear,
      definitionCoverage: defCoverage,
      issues: issues
    },
    data: data
  };
  
  // Write output
  console.log('');
  console.log('💾 Writing output...');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`   ✓ Saved: ${outputPath} (${sizeKB} KB)`);
  console.log('');
  console.log('═'.repeat(50));
  console.log('✅ Sources and Definitions parsing complete!');
  
  // Warn if missing expected states
  if (data.length < 51) {
    console.log('');
    console.log(`⚠️  Note: Only ${data.length} states found. Expected 51.`);
    console.log('   Leah may need to add missing states (NY, SD).');
  }
}

// Main
const inputPath = process.argv[2] || DEFAULT_INPUT;
const outputPath = process.argv[3] || DEFAULT_OUTPUT;

parseSources(inputPath, outputPath);