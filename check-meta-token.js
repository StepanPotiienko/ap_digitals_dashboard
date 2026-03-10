#!/usr/bin/env node
/**
 * Check Meta access token permissions
 * Uses appsecret_proof on every Graph API call as required by server-side policy.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRAPH_API = 'https://graph.facebook.com/v21.0';

function appSecretProof(accessToken, appSecret) {
  return crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
}

function buildUrl(endpoint, params) {
  const qs = new URLSearchParams(params).toString();
  return `${GRAPH_API}${endpoint}?${qs}`;
}

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
  console.error('Error loading .env.local:', err.message);
  process.exit(1);
}

const REQUIRED_SCOPES = [
  'pages_manage_metadata',
  'pages_read_engagement',
  'read_insights',
  'instagram_basic',
  'instagram_manage_insights',
];

function printTokenInstructions(appId) {
  const scopeList = REQUIRED_SCOPES.join(',');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ІНСТРУКЦІЯ: Як отримати правильний токен');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n1. Відкрийте Graph API Explorer:');
  console.log('   https://developers.facebook.com/tools/explorer/');
  console.log(`\n2. У полі "Application" оберіть ваш додаток (ID: ${appId || 'ваш app ID'})`);
  console.log('\n3. Натисніть "Generate Access Token" і додайте такі права:');
  REQUIRED_SCOPES.forEach(s => console.log(`     ☐ ${s}`));
  console.log('\n4. Скопіюйте Short-lived User Token і запустіть обмін на довгостроковий:');
  console.log('   node check-meta-token.js --exchange <SHORT_LIVED_TOKEN>');
  console.log('\n   Або обміняйте вручну:');
  console.log(`   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId || 'APP_ID'}&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN`);
  console.log('\n5. Скопіюйте отриманий long-lived token у .env.local:');
  console.log('   META_ACCESS_TOKEN=<long-lived-token>');
  console.log('\n⚠️  ВАЖЛИВО: Для роботи на сервері в додатку Facebook Developer потрібно:');
  console.log('   App Settings → Advanced → Require App Secret → ON');
  console.log('   (appsecret_proof вже додається автоматично в lib/meta.ts)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function exchangeToken(shortLivedToken) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('❌ META_APP_ID and META_APP_SECRET must be set in .env.local');
    process.exit(1);
  }

  console.log('\n🔄 Обмін Short-lived token на Long-lived token...\n');

  const response = await fetch(
    buildUrl('/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    })
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('❌ Помилка обміну токену:', data.error?.message);
    process.exit(1);
  }

  const longLivedToken = data.access_token;
  const expiresIn = data.expires_in ? `${Math.round(data.expires_in / 86400)} днів` : 'невідомо';

  console.log('✅ Long-lived token отримано!');
  console.log(`  Термін дії: ~${expiresIn}`);
  console.log('\n📝 Оновіть .env.local:');
  console.log(`  META_ACCESS_TOKEN=${longLivedToken}`);
}

async function checkTokenPermissions() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!accessToken || !appSecret) {
    console.error('❌ META_ACCESS_TOKEN and META_APP_SECRET must be set in .env.local');
    process.exit(1);
  }

  const proof = appSecretProof(accessToken, appSecret);
  // App token is used as the access_token for debug_token (does not require appsecret_proof)
  const appToken = appId ? `${appId}|${appSecret}` : accessToken;

  console.log('🔍 Перевірка Meta Access Token\n');

  try {
    // 1. Inspect token via debug_token
    const debugResponse = await fetch(
      buildUrl('/debug_token', { input_token: accessToken, access_token: appToken })
    );

    if (!debugResponse.ok) {
      const err = await debugResponse.json();
      console.error('❌ Помилка при перевірці токену:', err.error?.message);
      return;
    }

    const { data: tokenInfo } = await debugResponse.json();

    console.log('📊 Інформація про токен:');
    console.log(`  Тип:        ${tokenInfo.type}`);
    console.log(`  App ID:     ${tokenInfo.app_id}`);
    console.log(`  Дійсний:    ${tokenInfo.is_valid ? 'Так ✅' : 'Ні ❌'}`);
    console.log(`  Термін дії: ${tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000).toLocaleDateString('uk-UA') : 'Безстроковий'}`);

    // Check token expiry
    const expiresAt = tokenInfo.expires_at;
    const isExpired = expiresAt && expiresAt * 1000 < Date.now();
    if (isExpired) {
      console.log('\n⚠️  Токен вже прострочений!');
    }

    console.log('\n🔐 Права доступу (scopes):');
    const scopes = tokenInfo.scopes || [];
    const missingScopes = REQUIRED_SCOPES.filter(s => !scopes.includes(s));
    REQUIRED_SCOPES.forEach(scope => {
      console.log(`  ${scopes.includes(scope) ? '✅' : '❌'} ${scope}`);
    });
    const otherScopes = scopes.filter(s => !REQUIRED_SCOPES.includes(s));
    if (otherScopes.length) {
      console.log(`\n  Інші права: ${otherScopes.join(', ')}`);
    }

    if (missingScopes.length > 0 || isExpired) {
      console.log(`\n❌ Токен непридатний для роботи дашборду.`);
      if (missingScopes.length > 0) {
        console.log(`   Відсутні права: ${missingScopes.join(', ')}`);
      }
      printTokenInstructions(appId);
      return;
    }

    // 2. Fetch pages — appsecret_proof required for user token on server
    console.log('\n👤 Перевірка доступу до Pages:');
    const pagesResponse = await fetch(
      buildUrl('/me/accounts', { access_token: accessToken, appsecret_proof: proof })
    );

    if (!pagesResponse.ok) {
      const err = await pagesResponse.json();
      console.log('  ❌ Не вдалося отримати список сторінок');
      console.log('  Помилка:', err.error?.message);
      return;
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      console.log('  ❌ Сторінки не знайдені (токен потребує оновлення або сторінок немає)');
      printTokenInstructions(appId);
      return;
    }

    console.log(`  ✅ Знайдено ${pages.length} сторінок:`);
    pages.forEach(page => {
      console.log(`     - ${page.name} (ID: ${page.id})`);
    });

    // 3. Verify page-level insights using the page access token + its own proof
    console.log('\n📈 Перевірка Page Insights (перша сторінка):');
    const firstPage = pages[0];
    const pageToken = firstPage.access_token;
    const pageProof = appSecretProof(pageToken, appSecret);

    // fan_count via page fields (page_fans deprecated in v18+)
    const pageFieldsResponse = await fetch(
      buildUrl(`/${firstPage.id}`, {
        fields: 'fan_count,followers_count,name',
        access_token: pageToken,
        appsecret_proof: pageProof,
      })
    );

    // page_post_engagements and page_views_total are valid in v21 with period=lifetime
    const insightsResponse = await fetch(
      buildUrl(`/${firstPage.id}/insights`, {
        metric: 'page_post_engagements,page_views_total',
        period: 'lifetime',
        access_token: pageToken,
        appsecret_proof: pageProof,
      })
    );

    if (pageFieldsResponse.ok) {
      const pf = await pageFieldsResponse.json();
      console.log(`  ✅ Підписники (followers_count): ${pf.followers_count ?? pf.fan_count ?? 'n/a'}`);
    }

    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      const metrics = insightsData.data || [];
      if (metrics.length > 0) {
        console.log('  ✅ Page Insights доступні:');
        metrics.forEach(m => {
          const latest = m.values?.[m.values.length - 1]?.value ?? 'n/a';
          console.log(`     - ${m.name}: ${JSON.stringify(latest)}`);
        });
      } else {
        console.log('  ⊘ Метрики порожні (дані ще не накопичились)');
      }
    } else {
      const err = await insightsResponse.json();
      console.log('  ❌ Page Insights недоступні:', err.error?.message);
    }

    // 4. Check Instagram Business accounts — reuse user token proof
    console.log('\n📸 Перевірка Instagram Business:');
    const igResponse = await fetch(
      buildUrl('/me/accounts', {
        fields: 'name,instagram_business_account',
        access_token: accessToken,
        appsecret_proof: proof,
      })
    );

    if (igResponse.ok) {
      const igData = await igResponse.json();
      const pagesWithIG = (igData.data || []).filter(p => p.instagram_business_account);

      if (pagesWithIG.length > 0) {
        console.log('  ✅ Знайдено Instagram Business акаунти:');
        pagesWithIG.forEach(page => {
          const igId = page.instagram_business_account.id;
          console.log(`     - ${page.name} → Instagram ID: ${igId}`);
          if (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID !== igId) {
            console.log(`       ⚠️  Додайте в .env.local: INSTAGRAM_BUSINESS_ACCOUNT_ID=${igId}`);
          } else {
            console.log('       ✅ Вже налаштований в .env.local');
          }
        });
      } else {
        console.log('  ⊘ Instagram Business не підключений до жодної сторінки');
      }
    } else {
      const err = await igResponse.json();
      console.log('  ❌ Не вдалося перевірити Instagram:', err.error?.message);
    }

  } catch (error) {
    console.error('Помилка:', error.message);
  }
}

// Support: node check-meta-token.js --exchange <short_lived_token>
const args = process.argv.slice(2);
if (args[0] === '--exchange' && args[1]) {
  exchangeToken(args[1]);
} else {
  checkTokenPermissions();
}
