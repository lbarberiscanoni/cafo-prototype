#!/usr/bin/env node

/**
 * parse-orgs-from-master.js
 * 
 * Parses MTE_Master_Data.xlsx into orgs-and-networks.json
 * 
 * Reads from 3 sheets:
 * - Master: Organizations with names, locations, coordinates, categories
 * - Network Members: Which orgs belong to which networks (ADR-001: authoritative)
 * - Counties Served: Which counties each org serves (ADR-008: for profile display)
 * 
 * Input: MTE_Master_Data.xlsx
 * Output: orgs-and-networks.json
 * 
 * Usage: node parse-orgs-from-master.js [input_file] [output_file]
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Default paths
const DEFAULT_INPUT = './MTE_Master_Data.xlsx';
const DEFAULT_OUTPUT = './orgs-and-networks.json';

// Clean string value
function cleanString(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const str = String(value).trim();
  return str === '' || str === 'NaN' || str === 'nan' ? null : str;
}

// Parse boolean/flag value
function parseFlag(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return value === 1;
  const str = String(value).toLowerCase().trim();
  return str === 'yes' || str === '1' || str === 'true';
}

// Parse coordinate value
function parseCoord(value) {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

// Parse Master sheet
function parseMasterSheet(workbook) {
  console.log('📋 Parsing Master sheet...');
  const sheet = workbook.Sheets['Master'];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  console.log(`   Found ${rawData.length} rows`);
  
  const organizations = [];
  const orgsByName = new Map();
  let withCoords = 0;
  
  for (const row of rawData) {
    const name = cleanString(row['name']);
    if (!name) continue;
    
    const lat = parseCoord(row['latitude']);
    const lng = parseCoord(row['longitude']);
    const hasCoords = lat !== null && lng !== null;
    if (hasCoords) withCoords++;
    
    // Parse activities
    const activities = [];
    if (parseFlag(row['activity_recruit_foster_kinship'])) activities.push('recruit_foster_kinship');
    if (parseFlag(row['activity_recruit_adoptive'])) activities.push('recruit_adoptive');
    if (parseFlag(row['activity_bio'])) activities.push('bio_family');
    if (parseFlag(row['activity_support'])) activities.push('support');
    if (parseFlag(row['activity_all'])) activities.push('all');
    
    const org = {
      id: row['id'] || null,
      name: name,
      isOrganization: parseFlag(row['is_organization']),
      isNetwork: parseFlag(row['is_network']),
      address: {
        street: cleanString(row['address']),
        city: cleanString(row['city']),
        state: cleanString(row['state']),
        zip: cleanString(row['zip']),
        county: cleanString(row['county_name']) || cleanString(row['county'])
      },
      coordinates: hasCoords ? { lat, lng } : null,
      website: cleanString(row['website']),
      category: cleanString(row['category']),
      activities: activities,
      officialFosterMinistry: parseFlag(row['official_foster_ministry']),
      contact: {
        name: cleanString(row['contact_name']),
        title: cleanString(row['contact_title']),
        email: cleanString(row['contact_email'])
      },
      onMap: parseFlag(row['on_map']),
      // These will be populated from other sheets
      networkMemberships: [],
      countiesServed: []
    };
    
    organizations.push(org);
    orgsByName.set(name.toLowerCase(), org);
  }
  
  console.log(`   ✓ Parsed ${organizations.length} organizations`);
  console.log(`   ✓ ${withCoords} have coordinates`);
  
  return { organizations, orgsByName };
}

// Parse Network Members sheet
function parseNetworkMembers(workbook, orgsByName) {
  console.log('');
  console.log('📋 Parsing Network Members sheet...');
  const sheet = workbook.Sheets['Network Members'];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  console.log(`   Found ${rawData.length} rows`);
  
  const networks = new Map();
  let matched = 0;
  let skipped = 0;
  const skippedOrgs = [];
  
  for (const row of rawData) {
    const orgName = cleanString(row['Organization/Ministry Name']);
    const networkName = cleanString(row['Network Name']);
    
    if (!orgName || !networkName) continue;
    
    // Find org in Master (ADR-003: skip if not found)
    const org = orgsByName.get(orgName.toLowerCase());
    if (!org) {
      skipped++;
      skippedOrgs.push(orgName);
      continue;
    }
    
    // Add network membership to org
    org.networkMemberships.push({
      network: networkName,
      fellowshipCohort: cleanString(row['Fellowship Cohort']),
      mouParticipant: parseFlag(row['MOU Participant']),
      addedToMap: cleanString(row['Added to Map']),
      membershipOnMap: parseFlag(row['Network Membership on Map'])
    });
    matched++;
    
    // Build networks list
    if (!networks.has(networkName)) {
      networks.set(networkName, {
        name: networkName,
        members: []
      });
    }
    networks.get(networkName).members.push(orgName);
  }
  
  console.log(`   ✓ ${matched} memberships matched to organizations`);
  if (skipped > 0) {
    console.log(`   ⚠️  ${skipped} memberships skipped (org not in Master - per ADR-003)`);
    if (skippedOrgs.length <= 5) {
      skippedOrgs.forEach(name => console.log(`      - ${name}`));
    } else {
      skippedOrgs.slice(0, 3).forEach(name => console.log(`      - ${name}`));
      console.log(`      ... and ${skippedOrgs.length - 3} more`);
    }
  }
  
  // Convert networks map to array
  const networksList = Array.from(networks.values()).map(n => ({
    name: n.name,
    memberCount: n.members.length,
    members: n.members
  }));
  
  console.log(`   ✓ ${networksList.length} unique networks`);
  
  return { networks: networksList, matched, skipped, skippedOrgs };
}

// Parse Counties Served sheet
function parseCountiesServed(workbook, orgsByName) {
  console.log('');
  console.log('📋 Parsing Counties Served sheet...');
  const sheet = workbook.Sheets['Counties Served'];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  console.log(`   Found ${rawData.length} rows`);
  
  let matched = 0;
  let skipped = 0;
  
  for (const row of rawData) {
    const orgName = cleanString(row['name']);
    const county = cleanString(row['county']);
    const state = cleanString(row['state']);
    
    if (!orgName) continue;
    
    // Find org in Master
    const org = orgsByName.get(orgName.toLowerCase());
    if (!org) {
      skipped++;
      continue;
    }
    
    // Skip if no county data
    if (!county) continue;
    
    // Add county to org's counties served
    org.countiesServed.push({
      county: county,
      state: state,
      countyState: cleanString(row['county_state'])
    });
    matched++;
  }
  
  // Count orgs with counties served
  let orgsWithCounties = 0;
  for (const [_, org] of orgsByName) {
    if (org.countiesServed.length > 0) orgsWithCounties++;
  }
  
  console.log(`   ✓ ${matched} county entries matched`);
  console.log(`   ✓ ${orgsWithCounties} organizations have counties served data`);
  if (skipped > 0) {
    console.log(`   ⚠️  ${skipped} entries skipped (org not in Master)`);
  }
  
  return { matched, skipped, orgsWithCounties };
}

function parseOrganizations(inputPath, outputPath) {
  console.log('📊 Organizations Parser');
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
  console.log(`   Sheets: ${workbook.SheetNames.join(', ')}`);
  console.log('');
  
  // Parse Master sheet
  const { organizations, orgsByName } = parseMasterSheet(workbook);
  
  // Parse Network Members sheet (ADR-001: authoritative for network membership)
  const networkResults = parseNetworkMembers(workbook, orgsByName);
  
  // Parse Counties Served sheet (ADR-008: for profile display)
  const countiesResults = parseCountiesServed(workbook, orgsByName);
  
  // Statistics
  const withCoords = organizations.filter(o => o.coordinates !== null).length;
  const withWebsite = organizations.filter(o => o.website !== null).length;
  const withActivities = organizations.filter(o => o.activities.length > 0).length;
  const withNetworks = organizations.filter(o => o.networkMemberships.length > 0).length;
  const withCounties = organizations.filter(o => o.countiesServed.length > 0).length;
  
  // Category breakdown
  const categories = {};
  organizations.forEach(o => {
    const cat = o.category || 'Unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  console.log('');
  console.log('📋 Summary:');
  console.log(`   Organizations: ${organizations.length}`);
  console.log(`   With coordinates: ${withCoords}`);
  console.log(`   With website: ${withWebsite}`);
  console.log(`   With activities: ${withActivities}`);
  console.log(`   With network memberships: ${withNetworks}`);
  console.log(`   With counties served: ${withCounties}`);
  console.log(`   Networks: ${networkResults.networks.length}`);
  console.log('');
  console.log('   Categories:');
  Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}`);
  });
  
  // Build output
  const output = {
    metadata: {
      source: path.basename(inputPath),
      generated: new Date().toISOString(),
      organizationCount: organizations.length,
      networkCount: networkResults.networks.length,
      stats: {
        withCoordinates: withCoords,
        withWebsite: withWebsite,
        withActivities: withActivities,
        withNetworkMemberships: withNetworks,
        withCountiesServed: withCounties
      },
      categories: categories,
      networkMemberships: {
        total: networkResults.matched,
        skipped: networkResults.skipped,
        skippedOrgs: networkResults.skippedOrgs
      }
    },
    organizations: organizations,
    networks: networkResults.networks
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
  console.log('✅ Organizations parsing complete!');
}

// Main
const inputPath = process.argv[2] || DEFAULT_INPUT;
const outputPath = process.argv[3] || DEFAULT_OUTPUT;

parseOrganizations(inputPath, outputPath);