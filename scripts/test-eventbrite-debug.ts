#!/usr/bin/env tsx
/**
 * Script de diagnostic Eventbrite - Pulse Montreal
 * Teste différentes méthodes d'authentification et endpoints
 */

import { config } from 'dotenv';

// Charger les variables d'environnement
config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg: string) => console.log(`${colors.bright}${colors.cyan}🔍 ${msg}${colors.reset}\n`),
};

async function testEventbriteAPI() {
  log.title('Diagnostic API Eventbrite');

  const token = process.env.EVENTBRITE_TOKEN;
  if (!token) {
    log.error('EVENTBRITE_TOKEN manquant dans .env.local');
    console.log('\n💡 Pour obtenir un token:');
    console.log('1. Allez sur https://www.eventbrite.com/platform/');
    console.log('2. Créez une application');
    console.log('3. Récupérez votre token dans "Your API keys"');
    return;
  }

  log.info(`Token trouvé: ${token.substring(0, 8)}...${token.substring(token.length - 4)}`);

  const baseUrl = 'https://www.eventbriteapi.com/v3';

  // Test 1: Endpoint /events/search avec token en paramètre
  log.title('Test 1: /events/search avec token en paramètre');
  try {
    const params = new URLSearchParams({
      'location.address': 'Montreal, QC, Canada',
      'location.within': '25km',
      'start_date.range_start': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      'status': 'live',
      'token': token,
    });

    const url1 = `${baseUrl}/events/search?${params}`;
    log.info(`Requête: GET ${url1.replace(token, 'TOKEN_MASQUÉ')}`);
    
    const response1 = await fetch(url1);
    const status1 = response1.status;
    const text1 = await response1.text();
    
    if (response1.ok) {
      log.success(`✅ Status: ${status1}`);
      try {
        const data = JSON.parse(text1);
        log.success(`✅ ${data.events?.length || 0} événement(s) trouvé(s)`);
        if (data.events && data.events.length > 0) {
          console.log(`   Premier événement: ${data.events[0].name?.text || 'Sans titre'}`);
        }
      } catch (e) {
        log.warning('Réponse non-JSON');
      }
    } else {
      log.error(`❌ Status: ${status1}`);
      log.error(`Réponse: ${text1.substring(0, 200)}`);
    }
  } catch (error: any) {
    log.error(`Erreur: ${error.message}`);
  }

  // Test 2: Endpoint /events/search avec Authorization header
  log.title('\nTest 2: /events/search avec Authorization header');
  try {
    const params = new URLSearchParams({
      'location.address': 'Montreal, QC, Canada',
      'location.within': '25km',
      'start_date.range_start': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      'status': 'live',
    });

    const url2 = `${baseUrl}/events/search?${params}`;
    log.info(`Requête: GET ${url2} (avec header Authorization)`);
    
    const response2 = await fetch(url2, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const status2 = response2.status;
    const text2 = await response2.text();
    
    if (response2.ok) {
      log.success(`✅ Status: ${status2}`);
      try {
        const data = JSON.parse(text2);
        log.success(`✅ ${data.events?.length || 0} événement(s) trouvé(s)`);
      } catch (e) {
        log.warning('Réponse non-JSON');
      }
    } else {
      log.error(`❌ Status: ${status2}`);
      log.error(`Réponse: ${text2.substring(0, 200)}`);
    }
  } catch (error: any) {
    log.error(`Erreur: ${error.message}`);
  }

  // Test 3: Endpoint /users/me pour vérifier l'authentification
  log.title('\nTest 3: /users/me (vérification authentification)');
  try {
    const url3 = `${baseUrl}/users/me/?token=${token}`;
    log.info(`Requête: GET ${url3.replace(token, 'TOKEN_MASQUÉ')}`);
    
    const response3 = await fetch(url3);
    const status3 = response3.status;
    const text3 = await response3.text();
    
    if (response3.ok) {
      log.success(`✅ Status: ${status3} - Token valide !`);
      try {
        const data = JSON.parse(text3);
        console.log(`   Utilisateur: ${data.first_name || ''} ${data.last_name || ''} (${data.emails?.[0]?.email || 'N/A'})`);
      } catch (e) {
        log.warning('Réponse non-JSON');
      }
    } else {
      log.error(`❌ Status: ${status3}`);
      log.error(`Réponse: ${text3.substring(0, 200)}`);
      if (status3 === 401) {
        log.error('\n💡 Le token est invalide ou expiré. Obtenez un nouveau token sur:');
        log.error('   https://www.eventbrite.com/platform/');
      }
    }
  } catch (error: any) {
    log.error(`Erreur: ${error.message}`);
  }

  // Test 4: Endpoint alternatif /events/ (sans search)
  log.title('\nTest 4: /events/ (endpoint alternatif)');
  try {
    const params = new URLSearchParams({
      'location.address': 'Montreal',
      'token': token,
    });

    const url4 = `${baseUrl}/events/?${params}`;
    log.info(`Requête: GET ${url4.replace(token, 'TOKEN_MASQUÉ')}`);
    
    const response4 = await fetch(url4);
    const status4 = response4.status;
    const text4 = await response4.text();
    
    if (response4.ok) {
      log.success(`✅ Status: ${status4}`);
      log.info('Cet endpoint fonctionne !');
    } else {
      log.error(`❌ Status: ${status4}`);
      log.error(`Réponse: ${text4.substring(0, 200)}`);
    }
  } catch (error: any) {
    log.error(`Erreur: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  log.title('Résumé');
  console.log('Si tous les tests échouent avec 401/403:');
  console.log('  → Le token est invalide ou expiré');
  console.log('  → Obtenez un nouveau token sur https://www.eventbrite.com/platform/');
  console.log('\nSi les tests retournent 404:');
  console.log('  → L\'endpoint a peut-être changé');
  console.log('  → Vérifiez la documentation: https://www.eventbrite.com/platform/api/');
}

testEventbriteAPI().catch(console.error);


















