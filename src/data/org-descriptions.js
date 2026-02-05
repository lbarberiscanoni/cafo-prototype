#!/usr/bin/env node

/**
 * Organization Description Generator
 * 
 * Crawls organization websites and generates one-liner descriptions using Claude API.
 * 
 * Usage:
 *   node org-descriptions.js [real-data.json]
 * 
 * Reads from real-data.json and updates organizations in place.
 * Requires ANTHROPIC_API_KEY environment variable.
 * 
 * Set via: export ANTHROPIC_API_KEY=sk-ant-...
 * Or create .env file with: ANTHROPIC_API_KEY=sk-ant-...
 */

const fs = require('fs');
const path = require('path');

// Try to load dotenv if available (check grandparent directory for .env)
try {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch (e) {
  // dotenv not installed, that's fine - will use environment variable directly
}

// Default file path
const DEFAULT_DATA_FILE = './real-data.json';

// Configuration
const CONFIG = {
  fetchTimeout: 10000,        // 10 second timeout per website
  maxContentLength: 50000,    // Max characters to send to Claude
  delayBetweenApiCalls: 500,  // Rate limiting for Anthropic API
  saveEvery: 10,              // Save progress every N orgs
};

// ============================================
// Website Fetching
// ============================================

async function fetchUrl(url, timeout = CONFIG.fetchTimeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OrgDescriptionBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return text.substring(0, CONFIG.maxContentLength * 2);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  }
}

// ============================================
// HTML Parsing
// ============================================

function extractTextFromHtml(html) {
  // Remove scripts and styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  
  // Extract title
  const titleMatch = text.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // Extract meta description
  const metaDescMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) 
    || text.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
  
  // Extract headings
  const headings = [];
  const h1Matches = text.matchAll(/<h1[^>]*>([^<]*)<\/h1>/gi);
  for (const match of h1Matches) {
    if (match[1].trim()) headings.push(match[1].trim());
  }
  const h2Matches = text.matchAll(/<h2[^>]*>([^<]*)<\/h2>/gi);
  for (const match of h2Matches) {
    if (match[1].trim()) headings.push(match[1].trim());
  }
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace and entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  // Truncate to max length
  if (text.length > CONFIG.maxContentLength) {
    text = text.substring(0, CONFIG.maxContentLength) + '...';
  }
  
  return {
    title,
    metaDescription: metaDesc,
    headings: headings.slice(0, 10),
    bodyText: text,
  };
}

// ============================================
// Anthropic API
// ============================================

async function callAnthropic(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [
        { role: 'user', content: prompt }
      ]
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  if (data.content && data.content[0]) {
    return data.content[0].text.trim();
  }
  
  throw new Error('Unexpected API response format');
}

// ============================================
// Description Generation
// ============================================

async function generateDescription(org, apiKey) {
  // Extract fields from org structure
  const name = org.name;
  const website = org.website;
  const category = org.category;
  const state = org.address?.state;
  const city = org.address?.city;
  
  if (!website) {
    return { success: false, error: 'No website URL' };
  }
  
  // Normalize URL
  let url = website.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  console.log(`  → Fetching ${url}...`);
  
  // Fetch website
  let siteContent;
  try {
    const html = await fetchUrl(url);
    console.log(`  → Got ${html.length} chars, extracting text...`);
    siteContent = extractTextFromHtml(html);
  } catch (err) {
    console.log(`  → Fetch failed: ${err.message}, trying www...`);
    // Try with www. prefix if failed
    if (!url.includes('www.')) {
      try {
        const wwwUrl = url.replace('https://', 'https://www.').replace('http://', 'http://www.');
        const html = await fetchUrl(wwwUrl);
        siteContent = extractTextFromHtml(html);
      } catch (err2) {
        return { success: false, error: `Fetch failed: ${err.message}` };
      }
    } else {
      return { success: false, error: `Fetch failed: ${err.message}` };
    }
  }
  
  console.log(`  → Calling Anthropic API...`);
  
  // Build prompt
  const prompt = `You are writing one-liner descriptions for foster care and child welfare organizations for a directory.

Organization: ${name}
${category ? `Category: ${category}` : ''}
${city && state ? `Location: ${city}, ${state}` : state ? `State: ${state}` : ''}
Website: ${url}

Website content:
- Title: ${siteContent.title || 'N/A'}
- Meta description: ${siteContent.metaDescription || 'N/A'}
- Key headings: ${siteContent.headings.length ? siteContent.headings.join(', ') : 'N/A'}
- Page content excerpt: ${siteContent.bodyText.substring(0, 3000)}

Based on this information, write a single sentence (15-25 words) describing what this organization does in the foster care/child welfare space. Focus on their mission, services, or unique approach. Do not start with the organization name. Do not include quotation marks.

One-liner description:`;

  try {
    await delay(CONFIG.delayBetweenApiCalls);
    const description = await callAnthropic(prompt, apiKey);
    return { success: true, description: cleanDescription(description) };
  } catch (err) {
    return { success: false, error: `API error: ${err.message}` };
  }
}

function cleanDescription(desc) {
  // Remove quotes if wrapped
  let cleaned = desc.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Main Processing
// ============================================

async function processOrganizations(dataPath, apiKey) {
  console.log('🏢 ORGANIZATION DESCRIPTION GENERATOR');
  console.log('═'.repeat(60));
  console.log(`Data file: ${dataPath}`);
  console.log('');
  
  // Read input
  console.log('📖 Loading data...');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Get organizations array
  const organizations = data.organizations;
  if (!organizations || !Array.isArray(organizations)) {
    console.error('❌ Error: No organizations array found in data');
    process.exit(1);
  }
  
  console.log(`   Found ${organizations.length} organizations`);
  
  // Filter to orgs with websites but no description
  const toProcess = organizations.filter(org => 
    org.website && 
    (!org.generatedDescription || org.generatedDescription.trim() === '')
  );
  
  console.log(`   ${toProcess.length} organizations need descriptions`);
  
  if (toProcess.length === 0) {
    console.log('\n✅ All organizations already have descriptions!');
    return;
  }
  
  // Process each organization
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  
  console.log('\n🔄 Generating descriptions...\n');
  
  for (const org of toProcess) {
    processed++;
    console.log(`[${processed}/${toProcess.length}] ${org.name}`);
    
    const result = await generateDescription(org, apiKey);
    
    if (result.success) {
      org.generatedDescription = result.description;
      delete org.descriptionError;
      succeeded++;
      console.log(`  ✓ ${result.description}`);
    } else {
      org.generatedDescription = null;
      org.descriptionError = result.error;
      failed++;
      console.log(`  ✗ ${result.error}`);
    }
    
    console.log('');
    
    // Save progress periodically
    if (processed % CONFIG.saveEvery === 0) {
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log(`  [Saved progress - ${processed}/${toProcess.length}]\n`);
    }
  }
  
  // Update metadata
  data.metadata.enrichment = data.metadata.enrichment || {};
  data.metadata.enrichment.descriptions = {
    generated: new Date().toISOString(),
    processed: processed,
    succeeded: succeeded,
    failed: failed
  };
  
  // Final save
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  const stats = fs.statSync(dataPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`   Total organizations: ${organizations.length}`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   File size: ${sizeMB} MB`);
  console.log(`\n✅ Descriptions saved to ${dataPath}`);
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY not found in environment.');
    console.error('');
    console.error('Set it with:');
    console.error('  export ANTHROPIC_API_KEY=sk-ant-...');
    console.error('');
    console.error('Or create a .env file with:');
    console.error('  ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }
  
  const dataPath = process.argv[2] || DEFAULT_DATA_FILE;
  
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Error: File not found: ${dataPath}`);
    process.exit(1);
  }
  
  try {
    await processOrganizations(dataPath, apiKey);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();