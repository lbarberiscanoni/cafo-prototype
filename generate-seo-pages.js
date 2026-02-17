#!/usr/bin/env node
/**
 * generate-seo-pages.js
 * 
 * Generates static HTML pages for SEO indexing.
 * Each page contains crawlable foster care metrics and a JS redirect
 * to the interactive dashboard at the correct hash route.
 * 
 * Usage: node generate-seo-pages.js [path-to-real-data.json] [output-dir]
 * Default: node generate-seo-pages.js src/data/real-data.json public/data
 * 
 * Run after the data pipeline merges real-data.json.
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIG
// ============================================

const DEFAULT_DATA_PATH = 'src/data/real-data.json';
const DEFAULT_OUTPUT_DIR = 'public/data';
const APP_BASE_URL = 'https://cafo-prototype.vercel.app';
const SITE_NAME = 'More Than Enough - Foster Care Data';

// ============================================
// HELPERS
// ============================================

const fmt = (val) => {
  if (val === null || val === undefined) return 'N/A';
  return Number(val).toLocaleString('en-US');
};

const fmtPct = (val) => {
  if (val === null || val === undefined) return 'N/A';
  if (val < 1) return `${(val * 100).toFixed(1)}%`;
  return `${Number(val).toFixed(1)}%`;
};

const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-');

const stateNameToCode = {
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

// ============================================
// HTML TEMPLATE
// ============================================

function buildPage({ title, description, canonicalPath, hashRoute, breadcrumbs, metricsHtml, schemaJson }) {
  const canonicalUrl = `${APP_BASE_URL}${canonicalPath}`;
  const redirectUrl = `${APP_BASE_URL}/${hashRoute}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${SITE_NAME}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">

  <!-- Schema.org structured data -->
  <script type="application/ld+json">
${JSON.stringify(schemaJson, null, 2)}
  </script>

  <!-- JS redirect for human visitors (Google crawler sees the HTML content below) -->
  <script>
    (function() {
      // Only redirect if not a known bot
      var ua = navigator.userAgent.toLowerCase();
      var isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|ia_archiver/i.test(ua);
      if (!isBot) {
        window.location.replace("${redirectUrl}");
      }
    })();
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  </noscript>

  <style>
    body { font-family: 'Lato', Helvetica, Arial, sans-serif; color: #5c5d5f; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
    h1 { color: #000; font-size: 28px; margin-bottom: 8px; }
    h2 { color: #5c5d5f; font-size: 20px; margin-top: 24px; margin-bottom: 12px; }
    .subtitle { color: #5c5d5f; font-size: 16px; margin-bottom: 24px; }
    .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .metric-label { color: #5c5d5f; }
    .metric-value { font-weight: 700; color: #000; }
    .cta { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #02ADEE; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .cta:hover { background: #019bd5; }
    .breadcrumbs { font-size: 14px; margin-bottom: 16px; }
    .breadcrumbs a { color: #02ADEE; text-decoration: none; }
    .breadcrumbs a:hover { text-decoration: underline; }
    .source { font-size: 12px; color: #999; margin-top: 16px; }
    .logo-text { font-size: 14px; color: #02ADEE; font-weight: 700; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-text">More Than Enough &mdash; Foster Care Data</div>
    <nav class="breadcrumbs">${breadcrumbs}</nav>
    <h1>${title}</h1>
    <p class="subtitle">${description}</p>
${metricsHtml}
    <a class="cta" href="${redirectUrl}">View Interactive Dashboard &rarr;</a>
    <p class="source">Data sources: AFCARS Federal Data, MTE State Metrics. Updated daily.</p>
  </div>
</body>
</html>`;
}

// ============================================
// PAGE GENERATORS
// ============================================

function generateNationalPage(data) {
  const latestYear = Math.max(...Object.keys(data.national).map(Number));
  const national = data.national[latestYear];

  const title = 'Foster Care Data in the United States';
  const description = `Explore national foster care statistics: ${fmt(national.childrenInCare)} children in care, ${fmt(national.childrenWaitingForAdoption)} waiting for adoption. View data by state and county.`;

  const metricsHtml = `
    <h2>National Foster Care Statistics (${latestYear})</h2>
    <div class="metric"><span class="metric-label">Children in Out-of-Home Care</span><span class="metric-value">${fmt(national.childrenInCare)}</span></div>
    <div class="metric"><span class="metric-label">Children in Family-based Foster Care</span><span class="metric-value">${fmt(national.childrenInFosterCare)}</span></div>
    <div class="metric"><span class="metric-label">Children in Kinship Care</span><span class="metric-value">${fmt(national.childrenInKinshipCare)}</span></div>
    <div class="metric"><span class="metric-label">Children Waiting for Adoption</span><span class="metric-value">${fmt(national.childrenWaitingForAdoption)}</span></div>
    <div class="metric"><span class="metric-label">Children Adopted</span><span class="metric-value">${fmt(national.childrenAdopted)}</span></div>
    <div class="metric"><span class="metric-label">Family Preservation Cases</span><span class="metric-value">${fmt(national.familyPreservationCases)}</span></div>
    <div class="metric"><span class="metric-label">Licensed Foster Homes</span><span class="metric-value">${fmt(national.licensedHomes)}</span></div>

    <h2>Explore by State</h2>
    <p>Select a state to view detailed foster care data at the state and county level:</p>
    <ul style="columns: 2; list-style: none; padding: 0;">
${Object.entries(data.states)
  .filter(([abbrev]) => abbrev !== 'PR')
  .sort(([, a], [, b]) => a.name.localeCompare(b.name))
  .map(([abbrev, state]) => {
    const stateSlug = slugify(state.name);
    return `      <li style="margin-bottom: 4px;"><a href="/data/${stateSlug}/" style="color: #02ADEE; text-decoration: none;">${state.name}</a></li>`;
  }).join('\n')}
    </ul>`;

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "United States Foster Care Data",
    "description": description,
    "url": `${APP_BASE_URL}/data/`,
    "publisher": {
      "@type": "Organization",
      "name": "Christian Alliance for Orphans (CAFO)",
      "url": "https://cafo.org/morethanenough/"
    },
    "temporalCoverage": `${latestYear}`,
    "spatialCoverage": {
      "@type": "Place",
      "name": "United States"
    }
  };

  return {
    filePath: 'index.html',
    html: buildPage({
      title,
      description,
      canonicalPath: '/data/',
      hashRoute: '#/national/metric',
      breadcrumbs: '<a href="/data/">United States</a>',
      metricsHtml,
      schemaJson
    })
  };
}

function generateStatePage(abbrev, state, data) {
  const stateSlug = slugify(state.name);
  const afcarsYears = Object.keys(state.afcars || {}).map(Number).sort((a, b) => b - a);
  const latestYear = afcarsYears[0];
  const afcars = latestYear ? state.afcars[latestYear] : {};

  // Aggregate county-level data
  const countyYears = [...new Set((state.counties || []).map(c => c.year))].sort((a, b) => b - a);
  const latestCountyYear = countyYears[0];
  const latestCounties = (state.counties || []).filter(c => c.year === latestCountyYear);
  const totalFosterKinshipHomes = latestCounties.reduce((sum, c) => sum + (c.fosterKinshipHomes || 0), 0);
  const licensedHomes = afcars.licensedHomes || (totalFosterKinshipHomes > 0 ? totalFosterKinshipHomes : null);

  const title = `Foster Care Data in ${state.name}`;
  const childrenInCare = afcars.childrenInCare;
  const waitingAdoption = afcars.childrenWaitingForAdoption;
  const description = `${state.name} foster care statistics: ${fmt(childrenInCare)} children in care, ${fmt(waitingAdoption)} waiting for adoption, ${fmt(licensedHomes)} licensed homes. View county-level data.`;

  let metricsHtml = `
    <h2>${state.name} Foster Care Statistics${latestYear ? ` (${latestYear})` : ''}</h2>
    <div class="metric"><span class="metric-label">Children in Care</span><span class="metric-value">${fmt(childrenInCare)}</span></div>
    <div class="metric"><span class="metric-label">Children in Family-based Foster Care</span><span class="metric-value">${fmt(afcars.childrenInFosterCare)}</span></div>
    <div class="metric"><span class="metric-label">Children in Kinship Care</span><span class="metric-value">${fmt(afcars.childrenInKinshipCare)}</span></div>
    <div class="metric"><span class="metric-label">Licensed Foster Homes</span><span class="metric-value">${fmt(licensedHomes)}</span></div>
    <div class="metric"><span class="metric-label">Children Waiting for Adoption</span><span class="metric-value">${fmt(waitingAdoption)}</span></div>
    <div class="metric"><span class="metric-label">Children Adopted</span><span class="metric-value">${fmt(afcars.childrenAdopted)}</span></div>
    <div class="metric"><span class="metric-label">Reunification Rate</span><span class="metric-value">${fmtPct(afcars.reunificationRate)}</span></div>
    <div class="metric"><span class="metric-label">Family Preservation Cases</span><span class="metric-value">${fmt(afcars.familyPreservationCases)}</span></div>`;

  // Add county links
  if (latestCounties.length > 0) {
    metricsHtml += `\n\n    <h2>Counties in ${state.name}</h2>
    <p>Explore foster care data for ${fmt(latestCounties.length)} counties in ${state.name}:</p>
    <ul style="columns: 2; list-style: none; padding: 0;">`;

    const sortedCounties = [...latestCounties].sort((a, b) => a.name.localeCompare(b.name));
    for (const county of sortedCounties) {
      const countySlug = slugify(county.name);
      metricsHtml += `\n      <li style="margin-bottom: 4px;"><a href="/data/${stateSlug}/${countySlug}/" style="color: #02ADEE; text-decoration: none;">${county.name}</a></li>`;
    }
    metricsHtml += '\n    </ul>';
  }

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${state.name} Foster Care Data`,
    "description": description,
    "url": `${APP_BASE_URL}/data/${stateSlug}/`,
    "publisher": {
      "@type": "Organization",
      "name": "Christian Alliance for Orphans (CAFO)",
      "url": "https://cafo.org/morethanenough/"
    },
    "temporalCoverage": latestYear ? `${latestYear}` : undefined,
    "spatialCoverage": {
      "@type": "Place",
      "name": state.name,
      "containedInPlace": { "@type": "Country", "name": "United States" }
    }
  };

  return {
    filePath: `${stateSlug}/index.html`,
    html: buildPage({
      title,
      description,
      canonicalPath: `/data/${stateSlug}/`,
      hashRoute: `#/state/${stateSlug}/metric`,
      breadcrumbs: `<a href="/data/">United States</a> &rsaquo; <a href="/data/${stateSlug}/">${state.name}</a>`,
      metricsHtml,
      schemaJson
    })
  };
}

function generateCountyPage(county, state, stateSlug, stateAbbrev) {
  const countySlug = slugify(county.name);
  const countyKey = `${countySlug}-${stateAbbrev.toLowerCase()}`;

  const title = `Foster Care Data for ${county.name} County, ${state.name}`;
  const description = `${county.name} County, ${state.name} foster care data: ${fmt(county.childrenInCare)} children in care, ${fmt(county.fosterKinshipHomes)} licensed homes, ${fmt(county.childrenWaitingForAdoption)} waiting for adoption.`;

  // Calculate ratio
  let ratio = null;
  if (county.fosterKinshipHomes && county.childrenInCare && county.childrenInCare > 0) {
    ratio = (county.fosterKinshipHomes / county.childrenInCare).toFixed(2);
  }

  const metricsHtml = `
    <h2>Foster and Kinship Families</h2>
    <div class="metric"><span class="metric-label">Children in Care</span><span class="metric-value">${fmt(county.childrenInCare)}</span></div>
    <div class="metric"><span class="metric-label">Children in Family-based Foster Care</span><span class="metric-value">${fmt(county.childrenInFosterCare)}</span></div>
    <div class="metric"><span class="metric-label">Children in Kinship Care</span><span class="metric-value">${fmt(county.childrenInKinshipCare)}</span></div>
    <div class="metric"><span class="metric-label">Children Placed Out-of-County</span><span class="metric-value">${fmt(county.childrenPlacedOutOfCounty)}</span></div>
    <div class="metric"><span class="metric-label">Licensed Foster Homes</span><span class="metric-value">${fmt(county.fosterKinshipHomes)}</span></div>
    <div class="metric"><span class="metric-label">Licensed Homes per Child in Care</span><span class="metric-value">${ratio || 'N/A'}</span></div>

    <h2>Adoption</h2>
    <div class="metric"><span class="metric-label">Children Waiting for Adoption</span><span class="metric-value">${fmt(county.childrenWaitingForAdoption)}</span></div>
    <div class="metric"><span class="metric-label">Children Adopted</span><span class="metric-value">${fmt(county.childrenAdopted)}</span></div>

    <h2>Biological Family Support</h2>
    <div class="metric"><span class="metric-label">Family Preservation Cases</span><span class="metric-value">${fmt(county.familyPreservationCases)}</span></div>
    <div class="metric"><span class="metric-label">Reunification Rate</span><span class="metric-value">${fmtPct(county.reunificationRate)}</span></div>

    <h2>Community</h2>
    <div class="metric"><span class="metric-label">Churches</span><span class="metric-value">${fmt(county.churches)}</span></div>
    <div class="metric"><span class="metric-label">Population</span><span class="metric-value">${fmt(county.population)}</span></div>`;

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${county.name} County, ${state.name} Foster Care Data`,
    "description": description,
    "url": `${APP_BASE_URL}/data/${stateSlug}/${countySlug}/`,
    "publisher": {
      "@type": "Organization",
      "name": "Christian Alliance for Orphans (CAFO)",
      "url": "https://cafo.org/morethanenough/"
    },
    "temporalCoverage": county.year ? `${county.year}` : undefined,
    "spatialCoverage": {
      "@type": "Place",
      "name": `${county.name} County, ${state.name}`,
      "containedInPlace": { "@type": "AdministrativeArea", "name": state.name }
    }
  };

  return {
    filePath: `${stateSlug}/${countySlug}/index.html`,
    html: buildPage({
      title,
      description,
      canonicalPath: `/data/${stateSlug}/${countySlug}/`,
      hashRoute: `#/county/${countyKey}/metric`,
      breadcrumbs: `<a href="/data/">United States</a> &rsaquo; <a href="/data/${stateSlug}/">${state.name}</a> &rsaquo; <a href="/data/${stateSlug}/${countySlug}/">${county.name} County</a>`,
      metricsHtml,
      schemaJson
    })
  };
}

// ============================================
// SITEMAP GENERATOR
// ============================================

function generateSitemap(pages) {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${APP_BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

  for (const page of pages) {
    // Priority: national=0.9, state=0.8, county=0.6
    const depth = page.canonicalPath.split('/').filter(Boolean).length;
    const priority = depth <= 1 ? '0.9' : depth === 2 ? '0.8' : '0.6';

    xml += `  <url>
    <loc>${APP_BASE_URL}${page.canonicalPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  }

  xml += '</urlset>';
  return xml;
}

// ============================================
// MAIN
// ============================================

function main() {
  const dataPath = process.argv[2] || DEFAULT_DATA_PATH;
  const outputDir = process.argv[3] || DEFAULT_OUTPUT_DIR;

  console.log('🔍 SEO Page Generator');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Data:   ${dataPath}`);
  console.log(`  Output: ${outputDir}`);
  console.log('');

  // Load data
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Data file not found: ${dataPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`✅ Loaded data: ${Object.keys(data.states).length} states`);

  // Track pages for sitemap
  const sitemapEntries = [];
  let stateCount = 0;
  let countyCount = 0;

  // Clean output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. National page
  const nationalPage = generateNationalPage(data);
  const nationalPath = path.join(outputDir, nationalPage.filePath);
  fs.mkdirSync(path.dirname(nationalPath), { recursive: true });
  fs.writeFileSync(nationalPath, nationalPage.html);
  sitemapEntries.push({ canonicalPath: '/data/' });
  console.log(`📄 National page`);

  // 2. State pages + County pages
  for (const [abbrev, state] of Object.entries(data.states)) {
    if (abbrev === 'PR') continue;

    const stateSlug = slugify(state.name);

    // State page
    const statePage = generateStatePage(abbrev, state, data);
    const statePath = path.join(outputDir, statePage.filePath);
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, statePage.html);
    sitemapEntries.push({ canonicalPath: `/data/${stateSlug}/` });
    stateCount++;

    // County pages - only latest year
    const countyYears = [...new Set((state.counties || []).map(c => c.year))].sort((a, b) => b - a);
    const latestCountyYear = countyYears[0];
    const counties = (state.counties || []).filter(c => c.year === latestCountyYear);

    // Deduplicate counties by name (in case of duplicate entries)
    const seenCounties = new Set();
    for (const county of counties) {
      const countySlug = slugify(county.name);
      if (seenCounties.has(countySlug)) continue;
      seenCounties.add(countySlug);

      const countyPage = generateCountyPage(county, state, stateSlug, abbrev);
      const countyPath = path.join(outputDir, countyPage.filePath);
      fs.mkdirSync(path.dirname(countyPath), { recursive: true });
      fs.writeFileSync(countyPath, countyPage.html);
      sitemapEntries.push({ canonicalPath: `/data/${stateSlug}/${countySlug}/` });
      countyCount++;
    }
  }

  // 3. Generate sitemap.xml (goes in public root, not in /data/)
  const sitemapPath = path.join(path.dirname(outputDir), 'sitemap.xml');
  const sitemap = generateSitemap(sitemapEntries);
  fs.writeFileSync(sitemapPath, sitemap);

  // 4. Generate robots.txt update hint
  const robotsHint = `\n# Add to your robots.txt:\n# Sitemap: ${APP_BASE_URL}/sitemap.xml\n`;

  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log(`✅ Generated ${1 + stateCount + countyCount} pages:`);
  console.log(`   📄 1 national page`);
  console.log(`   📄 ${stateCount} state pages`);
  console.log(`   📄 ${countyCount} county pages`);
  console.log(`   🗺️  sitemap.xml (${sitemapEntries.length + 1} URLs)`);
  console.log(robotsHint);
}

main();