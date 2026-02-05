#!/usr/bin/env node

/**
 * audit.js
 * 
 * Verifies parsed JSON files against ground truth before merge.
 * 
 * Checks:
 * - AFCARS: National totals match expected values
 * - Sources: All 51 states present
 * - Metrics: County counts match expected for TX, GA, KY
 * - Orgs: Required fields present, coordinate validity
 * 
 * Input: afcars.json, sources.json, metrics.json, orgs-and-networks.json
 * Output: audit-report.json (and console summary)
 * 
 * Usage: node audit.js [data_dir] [output_file]
 */

const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_DATA_DIR = './';
const DEFAULT_OUTPUT = './audit-report.json';

// Ground truth values (from ADR documentation and Leah confirmation)
const GROUND_TRUTH = {
  afcars: {
    year: 2023,
    excludes: 'PR',
    childrenInCare: 358080,
    childrenAdopted: 55480,
    caChildrenInCare: 44468,
    totalRecords: 156,
    stateCount: 52,
    yearCount: 3
  },
  sources: {
    minStates: 51
  },
  metrics: {
    year: 2025,
    txCounties: 254,
    gaCounties: 159,
    kyCounties: 120
  },
  orgs: {
    minOrganizations: 400,
    minWithCoordinates: 150
  }
};

// Tolerance for numeric comparisons (0 = exact match required)
const TOLERANCE = 0;

class AuditRunner {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.results = {
      timestamp: new Date().toISOString(),
      dataDir: dataDir,
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  // Add a check result
  addCheck(category, name, passed, expected, actual, message = null) {
    const check = {
      category,
      name,
      passed,
      expected,
      actual,
      message
    };
    this.results.checks.push(check);
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    return passed;
  }

  // Add a warning (non-fatal)
  addWarning(category, name, message, actual = null) {
    const check = {
      category,
      name,
      passed: true,
      warning: true,
      message,
      actual
    };
    this.results.checks.push(check);
    this.results.summary.total++;
    this.results.summary.passed++;
    this.results.summary.warnings++;
  }

  // Load JSON file
  loadJSON(filename) {
    const filepath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }

  // Audit AFCARS data
  auditAFCARS() {
    console.log('\n📊 Auditing AFCARS...');
    const data = this.loadJSON('afcars.json');
    
    if (!data) {
      this.addCheck('afcars', 'file_exists', false, 'file exists', 'file not found');
      return;
    }
    
    this.addCheck('afcars', 'file_exists', true, 'file exists', 'file exists');
    
    // Check record count
    const recordCount = data.data?.length || 0;
    this.addCheck('afcars', 'record_count', 
      recordCount === GROUND_TRUTH.afcars.totalRecords,
      GROUND_TRUTH.afcars.totalRecords, recordCount);
    
    // Check state count
    const states = new Set(data.data?.map(r => r.state) || []);
    this.addCheck('afcars', 'state_count',
      states.size === GROUND_TRUTH.afcars.stateCount,
      GROUND_TRUTH.afcars.stateCount, states.size);
    
    // Check year count
    const years = new Set(data.data?.map(r => r.year) || []);
    this.addCheck('afcars', 'year_count',
      years.size === GROUND_TRUTH.afcars.yearCount,
      GROUND_TRUTH.afcars.yearCount, years.size);
    
    // Calculate 2023 US totals (excluding PR)
    const us2023 = data.data?.filter(r => r.year === 2023 && r.state !== 'PR') || [];
    const totalChildrenInCare = us2023.reduce((sum, r) => sum + (r.childrenInCare || 0), 0);
    const totalAdopted = us2023.reduce((sum, r) => sum + (r.childrenAdopted || 0), 0);
    
    this.addCheck('afcars', 'children_in_care_2023',
      Math.abs(totalChildrenInCare - GROUND_TRUTH.afcars.childrenInCare) <= TOLERANCE,
      GROUND_TRUTH.afcars.childrenInCare, totalChildrenInCare);
    
    this.addCheck('afcars', 'children_adopted_2023',
      Math.abs(totalAdopted - GROUND_TRUTH.afcars.childrenAdopted) <= TOLERANCE,
      GROUND_TRUTH.afcars.childrenAdopted, totalAdopted);
    
    // Check CA specifically
    const ca2023 = data.data?.find(r => r.state === 'CA' && r.year === 2023);
    const caChildren = ca2023?.childrenInCare || 0;
    this.addCheck('afcars', 'ca_children_in_care_2023',
      caChildren === GROUND_TRUTH.afcars.caChildrenInCare,
      GROUND_TRUTH.afcars.caChildrenInCare, caChildren);
    
    // Check for null preservation (Family Preservation Cases has many nulls)
    const nullFPC = data.data?.filter(r => r.familyPreservationCases === null).length || 0;
    if (nullFPC > 0) {
      this.addCheck('afcars', 'null_preservation', true, 'nulls preserved', `${nullFPC} null values`);
    } else {
      this.addWarning('afcars', 'null_preservation', 'No null values found - verify this is expected');
    }
  }

  // Audit Sources data
  auditSources() {
    console.log('\n📊 Auditing Sources...');
    const data = this.loadJSON('sources.json');
    
    if (!data) {
      this.addCheck('sources', 'file_exists', false, 'file exists', 'file not found');
      return;
    }
    
    this.addCheck('sources', 'file_exists', true, 'file exists', 'file exists');
    
    // Check state count
    const stateCount = data.data?.length || 0;
    this.addCheck('sources', 'state_count',
      stateCount >= GROUND_TRUTH.sources.minStates,
      `>= ${GROUND_TRUTH.sources.minStates}`, stateCount);
    
    // Check all states have dates
    const withDates = data.data?.filter(r => r.dataDate).length || 0;
    const missingDates = stateCount - withDates;
    if (missingDates > 0) {
      this.addWarning('sources', 'states_with_dates', 
        `${missingDates} states missing dates`, `${withDates}/${stateCount}`);
    } else {
      this.addCheck('sources', 'states_with_dates', true, 'all states have dates', `${withDates}/${stateCount}`);
    }
    
    // Check for source URLs
    const withUrls = data.data?.filter(r => r.sourceUrl).length || 0;
    if (withUrls < stateCount * 0.9) {
      this.addWarning('sources', 'states_with_urls',
        `Only ${withUrls}/${stateCount} states have source URLs`);
    } else {
      this.addCheck('sources', 'states_with_urls', true, '>90% have URLs', `${withUrls}/${stateCount}`);
    }
  }

  // Audit Metrics data
  auditMetrics() {
    console.log('\n📊 Auditing Metrics...');
    const data = this.loadJSON('metrics.json');
    
    if (!data) {
      this.addCheck('metrics', 'file_exists', false, 'file exists', 'file not found');
      return;
    }
    
    this.addCheck('metrics', 'file_exists', true, 'file exists', 'file exists');
    
    // Check total records
    const totalRecords = data.data?.length || 0;
    this.addCheck('metrics', 'has_records', totalRecords > 0, '> 0 records', totalRecords);
    
    // Filter to 2025 for county count checks
    const data2025 = data.data?.filter(r => r.year === 2025) || [];
    
    // Texas county count
    const txCount = data2025.filter(r => r.state === 'TX').length;
    this.addCheck('metrics', 'tx_county_count_2025',
      txCount === GROUND_TRUTH.metrics.txCounties,
      GROUND_TRUTH.metrics.txCounties, txCount);
    
    // Georgia county count
    const gaCount = data2025.filter(r => r.state === 'GA').length;
    this.addCheck('metrics', 'ga_county_count_2025',
      gaCount === GROUND_TRUTH.metrics.gaCounties,
      GROUND_TRUTH.metrics.gaCounties, gaCount);
    
    // Kentucky county count
    const kyCount = data2025.filter(r => r.state === 'KY').length;
    this.addCheck('metrics', 'ky_county_count_2025',
      kyCount === GROUND_TRUTH.metrics.kyCounties,
      GROUND_TRUTH.metrics.kyCounties, kyCount);
    
    // Check geography types
    const geoTypes = new Set(data.data?.map(r => r.geographyType) || []);
    const expectedTypes = ['county', 'region', 'district', 'city', 'districtOffice'];
    const hasExpectedTypes = expectedTypes.some(t => geoTypes.has(t));
    this.addCheck('metrics', 'geography_types', hasExpectedTypes, 
      'valid geo types', Array.from(geoTypes).join(', '));
    
    // Check null preservation
    const nullChildrenInCare = data.data?.filter(r => r.childrenInCare === null).length || 0;
    if (nullChildrenInCare > 0) {
      this.addCheck('metrics', 'null_preservation', true, 'nulls preserved', 
        `${nullChildrenInCare} null childrenInCare values`);
    } else {
      this.addWarning('metrics', 'null_preservation', 'No null childrenInCare - verify expected');
    }
    
    // Check both years present
    const years = new Set(data.data?.map(r => r.year) || []);
    const hasBothYears = years.has(2024) && years.has(2025);
    this.addCheck('metrics', 'both_years_present', hasBothYears,
      '2024 and 2025', Array.from(years).sort().join(', '));
  }

  // Audit Organizations data
  auditOrgs() {
    console.log('\n📊 Auditing Organizations...');
    const data = this.loadJSON('orgs-and-networks.json');
    
    if (!data) {
      this.addCheck('orgs', 'file_exists', false, 'file exists', 'file not found');
      return;
    }
    
    this.addCheck('orgs', 'file_exists', true, 'file exists', 'file exists');
    
    const orgs = data.organizations || [];
    const networks = data.networks || [];
    
    // Check organization count
    this.addCheck('orgs', 'organization_count',
      orgs.length >= GROUND_TRUTH.orgs.minOrganizations,
      `>= ${GROUND_TRUTH.orgs.minOrganizations}`, orgs.length);
    
    // Check organizations with coordinates
    const withCoords = orgs.filter(o => o.coordinates !== null).length;
    this.addCheck('orgs', 'with_coordinates',
      withCoords >= GROUND_TRUTH.orgs.minWithCoordinates,
      `>= ${GROUND_TRUTH.orgs.minWithCoordinates}`, withCoords);
    
    // Check coordinate validity (lat between -90 and 90, lng between -180 and 180)
    const invalidCoords = orgs.filter(o => {
      if (!o.coordinates) return false;
      const { lat, lng } = o.coordinates;
      return lat < -90 || lat > 90 || lng < -180 || lng > 180;
    });
    this.addCheck('orgs', 'valid_coordinates',
      invalidCoords.length === 0,
      '0 invalid', invalidCoords.length);
    
    // Check all orgs have names
    const withNames = orgs.filter(o => o.name && o.name.trim() !== '').length;
    this.addCheck('orgs', 'all_have_names',
      withNames === orgs.length,
      orgs.length, withNames);
    
    // Check networks
    this.addCheck('orgs', 'has_networks', networks.length > 0, '> 0', networks.length);
    
    // Check for orgs with network memberships
    const withMemberships = orgs.filter(o => o.networkMemberships?.length > 0).length;
    if (withMemberships > 0) {
      this.addCheck('orgs', 'orgs_with_memberships', true, '> 0', withMemberships);
    } else {
      this.addWarning('orgs', 'orgs_with_memberships', 'No orgs have network memberships');
    }
    
    // Check for orgs with counties served
    const withCounties = orgs.filter(o => o.countiesServed?.length > 0).length;
    if (withCounties > 0) {
      this.addCheck('orgs', 'orgs_with_counties', true, '> 0', withCounties);
    } else {
      this.addWarning('orgs', 'orgs_with_counties', 'No orgs have counties served data');
    }
  }

  // Run all audits
  run() {
    console.log('🔍 MTE Data Audit');
    console.log('═'.repeat(50));
    console.log(`Data directory: ${this.dataDir}`);
    
    this.auditAFCARS();
    this.auditSources();
    this.auditMetrics();
    this.auditOrgs();
    
    return this.results;
  }

  // Print summary
  printSummary() {
    const { passed, failed, warnings, total } = this.results.summary;
    
    console.log('\n' + '═'.repeat(50));
    console.log('📋 AUDIT SUMMARY');
    console.log('═'.repeat(50));
    
    // Group by category
    const byCategory = {};
    for (const check of this.results.checks) {
      if (!byCategory[check.category]) {
        byCategory[check.category] = { passed: 0, failed: 0, warnings: 0 };
      }
      if (check.passed) {
        byCategory[check.category].passed++;
        if (check.warning) byCategory[check.category].warnings++;
      } else {
        byCategory[check.category].failed++;
      }
    }
    
    for (const [category, counts] of Object.entries(byCategory)) {
      const status = counts.failed > 0 ? '❌' : '✅';
      const warnStr = counts.warnings > 0 ? ` (${counts.warnings} warnings)` : '';
      console.log(`${status} ${category}: ${counts.passed}/${counts.passed + counts.failed} passed${warnStr}`);
    }
    
    console.log('');
    console.log(`Total: ${passed}/${total} checks passed`);
    if (warnings > 0) console.log(`Warnings: ${warnings}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED CHECKS:');
      for (const check of this.results.checks.filter(c => !c.passed)) {
        console.log(`   ${check.category}.${check.name}: expected ${check.expected}, got ${check.actual}`);
      }
    }
    
    console.log('');
    if (failed === 0) {
      console.log('✅ AUDIT PASSED - Safe to proceed with merge');
    } else {
      console.log('❌ AUDIT FAILED - Fix issues before merging');
    }
  }
}

// Main
function main() {
  const dataDir = process.argv[2] || DEFAULT_DATA_DIR;
  const outputPath = process.argv[3] || DEFAULT_OUTPUT;
  
  const audit = new AuditRunner(dataDir);
  const results = audit.run();
  audit.printSummary();
  
  // Write report
  console.log(`\n💾 Writing report to ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  // Exit with error code if failed
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

main();