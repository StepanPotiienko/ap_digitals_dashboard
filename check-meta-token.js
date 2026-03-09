#!/usr/bin/env node
/**
 * Check Meta access token permissions
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
  console.error('Error loading .env.local:', err.message);
  process.exit(1);
}

async function checkTokenPermissions() {
  const accessToken = process.env.META_ACCESS_TOKEN;

  console.log('🔍 Перевірка Meta Access Token\n');

  try {
    // Check token info and permissions
    const debugResponse = await fetch(
      `https://graph.facebook.com/v19.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );

    if (!debugResponse.ok) {
      console.log('❌ Помилка при перевірці токену');
      return;
    }

    const debugData = await debugResponse.json();
    const tokenInfo = debugData.data;

    console.log('📊 Інформація про токен:');
    console.log(`  Тип: ${tokenInfo.type}`);
    console.log(`  App ID: ${tokenInfo.app_id}`);
    console.log(`  Дійсний: ${tokenInfo.is_valid ? 'Так ✅' : 'Ні ❌'}`);
    console.log(`  Термін дії: ${tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000).toLocaleDateString('uk-UA') : 'Безстроковий'}`);
    console.log(`\n🔐 Права доступу (scopes):`);

    const scopes = tokenInfo.scopes || [];
    const requiredScopes = [
      'pages_read_engagement',
      'pages_show_list',
      'read_insights',
      'instagram_basic',
      'instagram_manage_insights'
    ];

    requiredScopes.forEach(scope => {
      const hasScope = scopes.includes(scope);
      console.log(`  ${hasScope ? '✅' : '❌'} ${scope}`);
    });

    console.log('\n👤 Перевірка доступу доPages:');

    // Check pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

      if (pages.length > 0) {
        console.log(`  ✅ Знайдено ${pages.length} сторінок:`);
        pages.forEach(page => {
          console.log(`     - ${page.name} (ID: ${page.id})`);
        });
      } else {
        console.log('  ❌ Сторінки не знайдені');
        console.log('\n💡 Рішення:');
        console.log('  1. Створіть Facebook Page: https://facebook.com/pages/create/');
        console.log('  2. Або згенеруйте новий токен з потрібними правами');
      }
    } else {
      console.log('  ❌ Не вдалося отримати список сторінок');
      const errorData = await pagesResponse.json();
      console.log('  Помилка:', errorData.error?.message);
    }

    // Check Instagram
    console.log('\n📸 Перевірка Instagram Business:');
    const igResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
    );

    if (igResponse.ok) {
      const igData = await igResponse.json();
      const pagesWithIG = igData.data?.filter(p => p.instagram_business_account) || [];

      if (pagesWithIG.length > 0) {
        console.log('  ✅ Знайдено Instagram Business акаунти:');
        pagesWithIG.forEach(page => {
          const igId = page.instagram_business_account.id;
          console.log(`     - Instagram ID: ${igId}`);
          console.log(`       Додайте в .env.local: INSTAGRAM_BUSINESS_ACCOUNT_ID=${igId}`);
        });
      } else {
        console.log('  ⊘ Instagram Business не підключений');
      }
    }

  } catch (error) {
    console.error('Помилка:', error.message);
  }
}

checkTokenPermissions();
