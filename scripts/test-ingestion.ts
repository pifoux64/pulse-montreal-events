#!/usr/bin/env tsx
/**
 * Script de test d'ingestion - Pulse Montreal
 * Teste chaque connecteur individuellement
 */

import { config } from 'dotenv';
import { EventbriteConnector } from '../src/ingestors/eventbrite';
import { orchestrator } from '../src/lib/orchestrator';

// Charger les variables d'environnement
config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg: string) => console.log(`${colors.bright}${colors.cyan}🎵 ${msg}${colors.reset}\n`),
};

async function testEventbriteConnector() {
  log.title('Test du Connecteur Eventbrite');

  const token = process.env.EVENTBRITE_TOKEN;
  if (!token) {
    log.error('EVENTBRITE_TOKEN manquant dans .env.local');
    return false;
  }

  try {
    const connector = new EventbriteConnector(token);
    
    log.info('Test de connexion à l\'API Eventbrite...');
    
    // Test avec une date récente pour avoir des résultats
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours
    const events = await connector.listUpdatedSince(since, 5); // Limiter à 5 pour le test
    
    log.success(`${events.length} événement(s) récupéré(s) depuis Eventbrite`);
    
    if (events.length > 0) {
      log.info('Premier événement:');
      console.log(`   📅 ${events[0].name?.text || 'Sans titre'}`);
      console.log(`   📍 ${events[0].venue_id ? 'Avec lieu' : 'En ligne'}`);
      console.log(`   🔗 ${events[0].url}`);
      
      // Test du mapping
      log.info('Test du mapping vers format unifié...');
      const unified = await connector.mapToUnifiedEvent(events[0]);
      log.success('Mapping réussi !');
      console.log(`   📝 Titre: ${unified.title}`);
      console.log(`   🏷️  Catégorie: ${unified.category}`);
      console.log(`   💰 Prix: ${unified.priceMin ? `${unified.priceMin/100}$` : 'Gratuit'}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Erreur Eventbrite: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
}

async function testTicketmasterAPI() {
  log.title('Test de l\'API Ticketmaster');

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    log.error('TICKETMASTER_API_KEY manquant dans .env.local');
    return false;
  }

  try {
    log.info('Test de connexion à l\'API Ticketmaster...');
    
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=Montreal&countryCode=CA&size=5`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const events = data._embedded?.events || [];
    
    log.success(`${events.length} événement(s) récupéré(s) depuis Ticketmaster`);
    
    if (events.length > 0) {
      log.info('Premier événement:');
      console.log(`   📅 ${events[0].name || 'Sans titre'}`);
      console.log(`   📍 ${events[0]._embedded?.venues?.[0]?.name || 'Lieu inconnu'}`);
      console.log(`   🔗 ${events[0].url}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Erreur Ticketmaster: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
}

async function testMeetupAPI() {
  log.title('Test de l\'API Meetup');

  const token = process.env.MEETUP_TOKEN;
  if (!token) {
    log.error('MEETUP_TOKEN manquant dans .env.local');
    return false;
  }

  try {
    log.info('Test de connexion à l\'API Meetup...');
    
    // Note: Meetup a migré vers GraphQL, mais l'ancienne API REST fonctionne encore
    const url = `https://api.meetup.com/find/upcoming_events?key=${token}&city=Montreal&country=CA&page=5`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const events = data.events || [];
    
    log.success(`${events.length} événement(s) récupéré(s) depuis Meetup`);
    
    if (events.length > 0) {
      log.info('Premier événement:');
      console.log(`   📅 ${events[0].name || 'Sans titre'}`);
      console.log(`   👥 ${events[0].group?.name || 'Groupe inconnu'}`);
      console.log(`   🔗 ${events[0].link}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Erreur Meetup: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
}

async function testFullIngestion() {
  log.title('Test d\'Ingestion Complète');

  try {
    log.info('Démarrage de l\'orchestrateur d\'ingestion...');
    
    const results = await orchestrator.runIngestion();
    
    log.success('Ingestion terminée !');
    
    console.log('\n📊 Résultats par source:');
    for (const [source, stats] of Object.entries(results)) {
      if (stats) {
        console.log(`\n🔗 ${source}:`);
        console.log(`   📥 Récupérés: ${stats.totalFetched}`);
        console.log(`   ✅ Traités: ${stats.totalProcessed}`);
        console.log(`   🆕 Créés: ${stats.totalCreated}`);
        console.log(`   🔄 Mis à jour: ${stats.totalUpdated}`);
        console.log(`   ⏭️  Ignorés: ${stats.totalSkipped}`);
        console.log(`   ❌ Erreurs: ${stats.totalErrors}`);
        console.log(`   ⏱️  Durée: ${stats.duration}ms`);
        
        if (stats.errors.length > 0) {
          console.log(`   🐛 Détail erreurs:`);
          stats.errors.slice(0, 3).forEach(error => {
            console.log(`      - ${error}`);
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Erreur ingestion complète: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
}

async function main() {
  console.clear();
  log.title('Test des Connecteurs d\'Ingestion - Pulse Montreal');

  const tests = [
    { name: 'Eventbrite', test: testEventbriteConnector },
    { name: 'Ticketmaster', test: testTicketmasterAPI },
    { name: 'Meetup', test: testMeetupAPI },
  ];

  const results: Record<string, boolean> = {};

  // Tests individuels
  for (const { name, test } of tests) {
    try {
      results[name] = await test();
    } catch (error) {
      log.error(`Test ${name} échoué: ${error}`);
      results[name] = false;
    }
    console.log(''); // Ligne vide entre les tests
  }

  // Résumé des tests individuels
  console.log(`${colors.bright}${colors.cyan}📊 Résumé des Tests Individuels:${colors.reset}`);
  for (const [name, success] of Object.entries(results)) {
    if (success) {
      log.success(`${name}: Connecteur fonctionnel`);
    } else {
      log.error(`${name}: Connecteur non fonctionnel`);
    }
  }

  const workingConnectors = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 ${workingConnectors}/${tests.length} connecteur(s) fonctionnel(s)`);

  // Test d'ingestion complète si au moins un connecteur fonctionne
  if (workingConnectors > 0) {
    console.log('\n' + '='.repeat(50));
    const fullTestSuccess = await testFullIngestion();
    
    if (fullTestSuccess) {
      log.success('\n🎉 Tous les tests sont réussis ! Votre système d\'ingestion est prêt.');
    } else {
      log.warning('\n⚠️  L\'ingestion complète a échoué. Vérifiez la configuration de la base de données.');
    }
  } else {
    log.warning('\n⚠️  Aucun connecteur ne fonctionne. Vérifiez vos clés API.');
  }

  // Conseils
  console.log(`\n${colors.bright}${colors.green}💡 Conseils:${colors.reset}`);
  console.log('• Eventbrite et Ticketmaster sont les sources les plus riches');
  console.log('• Meetup est excellent pour les événements communautaires');
  console.log('• L\'ingestion automatique se déclenche toutes les 2 heures');
  console.log('• Consultez /api/ingestion/status pour suivre les ingestions');
}

main().catch(console.error);
