/**
 * Test script for Google Search Console API credentials
 * Run: node test-gsc.js
 */

require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");

async function testGscConnection() {
  console.log("🔍 Testing Google Search Console API connection...\n");

  // Check environment variables
  console.log("📋 Checking environment variables:");
  console.log("   GSC_SITE_URL:", process.env.GSC_SITE_URL || "❌ Not set");
  console.log(
    "   GOOGLE_APPLICATION_CREDENTIALS:",
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "❌ Not set",
  );

  if (!process.env.GSC_SITE_URL) {
    console.log("\n❌ GSC_SITE_URL is not set in .env.local");
    console.log("\n📝 To fix:");
    console.log("   1. Go to https://search.google.com/search-console");
    console.log("   2. Add your website property if not already added");
    console.log("   3. Copy the site URL (e.g., https://example.com or sc-domain:example.com)");
    console.log("   4. Add to .env.local: GSC_SITE_URL=https://your-site.com");
    return;
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("\n❌ GOOGLE_APPLICATION_CREDENTIALS is not set");
    console.log("   This should already be set for GA4 integration");
    return;
  }

  try {
    // Test authentication
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const searchconsole = google.searchconsole({
      version: "v1",
      auth,
    });

    console.log("\n✅ Google Auth initialized");

    // Try to fetch data
    console.log("\n🔄 Testing API access...");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    const formatDate = (d) => d.toISOString().split("T")[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl: process.env.GSC_SITE_URL,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["query"],
        rowLimit: 5,
      },
    });

    const rows = response.data.rows || [];

    console.log("\n✅ Successfully fetched data from Google Search Console!");
    console.log(`\n📊 Last 7 days summary:`);

    const totalClicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const totalImpressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = rows.length > 0
      ? rows.reduce((sum, row) => sum + (row.position || 0), 0) / rows.length
      : 0;

    console.log(`   Total Clicks: ${totalClicks}`);
    console.log(`   Total Impressions: ${totalImpressions}`);
    console.log(`   Average CTR: ${avgCtr.toFixed(2)}%`);
    console.log(`   Average Position: ${avgPosition.toFixed(1)}`);

    if (rows.length > 0) {
      console.log(`\n📈 Top ${rows.length} queries:`);
      rows.forEach((row, i) => {
        console.log(
          `   ${i + 1}. "${row.keys[0]}" - ${row.clicks} clicks, ${row.impressions} impressions (pos: ${row.position?.toFixed(1)})`,
        );
      });
    }

    console.log("\n✅ Google Search Console integration is working correctly!");
    console.log("   You can now see search data in your dashboard.");

  } catch (error) {
    console.error("\n❌ Error testing Google Search Console API:");

    if (error.message?.includes("Permission denied")) {
      console.log("\n🔐 Permission Error:");
      console.log("   Your service account needs access to Google Search Console.");
      console.log("\n📝 To fix:");
      console.log("   1. Go to https://search.google.com/search-console");
      console.log("   2. Select your property");
      console.log("   3. Go to Settings → Users and permissions");
      console.log(`   4. Add user: ${process.env.GOOGLE_APPLICATION_CREDENTIALS?.includes('/') ? 'service account email from credentials file' : 'your service account email'}`);
      console.log("   5. Grant 'Owner' or 'Full' permission");
      console.log("\n   Service accounts are found in the JSON credentials file");
      console.log("   Look for the 'client_email' field");
    } else if (error.message?.includes("not found")) {
      console.log("\n🌐 Site Not Found Error:");
      console.log(`   The site URL "${process.env.GSC_SITE_URL}" was not found in Search Console.`);
      console.log("\n📝 To fix:");
      console.log("   1. Go to https://search.google.com/search-console");
      console.log("   2. Add your property if not already added");
      console.log("   3. Make sure GSC_SITE_URL matches exactly (including https://)");
    } else {
      console.log(`\n   ${error.message}`);
    }

    console.log("\n🔍 Full error for debugging:");
    console.log(error);
  }
}

testGscConnection();
