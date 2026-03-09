#!/usr/bin/env node
/**
 * Direct test of GA4 and Meta API functions
 */

// Load environment variables
const fs = require('fs');
const path = require('path');
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.replace(/^['"](.*)['"]$/, '$1').replace(/#.*$/, '').trim();
      process.env[key] = value;
    }
  });
} catch (err) {
  console.error('Error loading .env.local:', err.message);
  process.exit(1);
}

console.log('🔍 Testing API Functions Directly\n');
console.log('Environment:');
console.log('- GA4_PROPERTY_ID:', process.env.GA4_PROPERTY_ID);
console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('- META_APP_ID:', process.env.META_APP_ID);
console.log('- META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN?.substring(0, 20) + '...\n');

async function testGA4() {
  console.log('Testing GA4...');
  try {
    const { fetchGa4Metrics } = require('./lib/ga4.ts');
    const result = await fetchGa4Metrics('2026-02-01', '2026-03-09');
    console.log('GA4 Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('GA4 Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testMeta() {
  console.log('\nTesting Meta...');
  try {
    const { fetchMetaSocialMetrics } = require('./lib/meta.ts');
    const result = await fetchMetaSocialMetrics('2026-02-01', '2026-03-09');
    console.log('Meta Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Meta Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function run() {
  await testGA4();
  await testMeta();
}

run().catch(console.error);
