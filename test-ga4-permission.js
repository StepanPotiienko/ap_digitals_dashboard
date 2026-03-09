#!/usr/bin/env node
/**
 * Quick test to verify GA4 service account permissions
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
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
  console.error('❌ Error loading .env.local:', err.message);
  process.exit(1);
}

async function testGA4Permission() {
  console.log('🔍 Testing GA4 Service Account Permissions\n');

  const propertyId = process.env.GA4_PROPERTY_ID;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  console.log('Configuration:');
  console.log(`  Property ID: ${propertyId}`);
  console.log(`  Credentials: ${credPath}\n`);

  try {
    const { BetaAnalyticsDataClient } = require('@google-analytics/data');

    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credPath,
    });

    console.log('📡 Making test request to GA4 API...\n');

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{
        startDate: '7daysAgo',
        endDate: 'today'
      }],
      metrics: [{ name: 'activeUsers' }],
    });

    console.log('✅ SUCCESS! Service account has access to the property.\n');
    console.log('Data received:');
    const users = response.rows?.[0]?.metricValues?.[0]?.value || '0';
    console.log(`  Active users (last 7 days): ${users}\n`);
    console.log('🎉 Your GA4 integration is working! Refresh your dashboard.');

  } catch (error) {
    console.log('❌ PERMISSION DENIED\n');
    console.log('The service account does not have access yet.\n');
    console.log('Please follow these steps:\n');
    console.log('1. Go to https://analytics.google.com/');
    console.log('2. Click Admin → Select Property ' + propertyId);
    console.log('3. Click "Property Access Management"');
    console.log('4. Add user: ap-digitals-dashboard-analytic@ap-digi.iam.gserviceaccount.com');
    console.log('5. Role: Viewer or Analyst');
    console.log('6. Wait 1-2 minutes, then run: node test-ga4-permission.js\n');
    console.log('Error details:', error.message);
  }
}

testGA4Permission();
