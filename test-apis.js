#!/usr/bin/env node
/**
 * Test script to verify GA4 and Meta API credentials
 * Run with: node test-apis.js
 */
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
      // Remove quotes and comments
      value = value.replace(/^['"](.*)['"]$/, '$1').replace(/#.*$/, '').trim();
      process.env[key] = value;
    }
  });
} catch (err) {
  console.error('Error loading .env.local:', err.message);
}

const TESTS = {
  ga4: false,
  meta: false,
  instagram: false
};

console.log('🔍 Testing API Credentials...\n');

async function testGA4() {
  console.log('1️⃣  Google Analytics 4');
  console.log('─────────────────────────');

  const propertyId = process.env.GA4_PROPERTY_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credentialsJson = process.env.GA4_CREDENTIALS_JSON;

  if (!propertyId) {
    console.log('❌ GA4_PROPERTY_ID not set');
    return false;
  }

  if (!credentialsPath && !credentialsJson) {
    console.log('❌ No GA4 credentials found (need GA4_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS)');
    return false;
  }

  console.log(`✓ Property ID: ${propertyId}`);
  console.log(`✓ Credentials: ${credentialsPath || 'JSON provided'}`);

  // Try to load the credentials file
  if (credentialsPath) {
    try {
      const fullPath = credentialsPath.startsWith('/')
        ? credentialsPath
        : path.join(__dirname, credentialsPath);

      if (fs.existsSync(fullPath)) {
        const creds = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (creds.type === 'service_account') {
          console.log(`✓ Service account email: ${creds.client_email}`);
          console.log('✅ GA4 configuration appears valid');
          console.log('⚠️  To fully verify, the service account needs Viewer access in GA4 Property settings');
          return true;
        } else {
          console.log('❌ Credentials file is not a service account');
          return false;
        }
      } else {
        console.log(`❌ Credentials file not found at: ${fullPath}`);
        return false;
      }
    } catch (err) {
      console.log(`❌ Error reading credentials: ${err.message}`);
      return false;
    }
  }

  return true;
}

async function testMeta() {
  console.log('\n2️⃣  Meta (Facebook/Instagram)');
  console.log('─────────────────────────────');

  const appId = process.env.META_APP_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!appId) {
    console.log('❌ META_APP_ID not set');
    return false;
  }

  if (!accessToken) {
    console.log('❌ META_ACCESS_TOKEN not set');
    return false;
  }

  console.log(`✓ App ID: ${appId}`);
  console.log(`✓ Access Token: ${accessToken.substring(0, 20)}...`);

  if (igAccountId && igAccountId !== 'your-instagram-account-id') {
    console.log(`✓ Instagram Account ID: ${igAccountId}`);
  } else {
    console.log('⚠️  Instagram Account ID not configured (optional)');
  }

  // Test the access token with Graph API
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${accessToken}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Meta API connected successfully`);
      console.log(`   Account name: ${data.name || 'N/A'}`);
      console.log(`   Account ID: ${data.id}`);
      return true;
    } else {
      const error = await response.json();
      console.log(`❌ Meta API error: ${error.error?.message || 'Unknown error'}`);
      console.log(`   Code: ${error.error?.code || 'N/A'}`);
      if (error.error?.code === 190) {
        console.log('   💡 Token may be expired. Generate a new one from Meta for Developers.');
      }
      return false;
    }
  } catch (err) {
    console.log(`❌ Network error: ${err.message}`);
    return false;
  }
}

async function testInstagram() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!igAccountId || igAccountId === 'your-instagram-account-id') {
    console.log('\n3️⃣  Instagram Business Account');
    console.log('───────────────────────────────');
    console.log('⊘  Not configured (optional)');
    return false;
  }

  console.log('\n3️⃣  Instagram Business Account');
  console.log('───────────────────────────────');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${igAccountId}?fields=username,followers_count,media_count&access_token=${accessToken}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Instagram connected: @${data.username || 'N/A'}`);
      console.log(`   Followers: ${data.followers_count?.toLocaleString() || 'N/A'}`);
      console.log(`   Posts: ${data.media_count || 'N/A'}`);
      return true;
    } else {
      const error = await response.json();
      console.log(`❌ Instagram API error: ${error.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Network error: ${err.message}`);
    return false;
  }
}

async function runTests() {
  TESTS.ga4 = await testGA4();
  TESTS.meta = await testMeta();
  TESTS.instagram = await testInstagram();

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Summary');
  console.log('═'.repeat(50));
  console.log(`GA4:       ${TESTS.ga4 ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`Meta:      ${TESTS.meta ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`Instagram: ${TESTS.instagram ? '✅ Ready' : '⊘ Optional'}`);
  console.log('');

  const allGood = TESTS.ga4 && TESTS.meta;
  if (allGood) {
    console.log('🎉 All required APIs are configured correctly!');
    console.log('Run: npm run dev');
    console.log('Then visit: http://localhost:3000');
  } else {
    console.log('⚠️  Some APIs need attention. See details above.');
  }
}

runTests().catch(console.error);
