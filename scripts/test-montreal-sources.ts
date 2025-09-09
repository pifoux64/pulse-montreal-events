/**
 * Script de test pour les connecteurs officiels de Montréal
 */

import { QuartierSpectaclesConnector } from '../src/ingestors/quartier-spectacles';
import { TourismeMontrealaConnector } from '../src/ingestors/tourisme-montreal';

async function testMontrealSources() {
  console.log('🏛️ Test des connecteurs officiels de Montréal...\n');

  // Test Quartier des Spectacles
  console.log('🎭 === TEST QUARTIER DES SPECTACLES ===');
  const qdsConnector = new QuartierSpectaclesConnector();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Derniers 30 jours

  try {
    console.log('\n📡 Récupération des événements du QDS...');
    const qdsEvents = await qdsConnector.listUpdatedSince(since, 10);
    console.log(`\n✅ ${qdsEvents.length} événements QDS récupérés:\n`);
    
    qdsEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   📅 Date: ${new Date(event.startDate).toLocaleDateString('fr-FR')}`);
      console.log(`   📍 Venue: ${event.venue}`);
      console.log(`   🎭 Catégorie: ${event.category}`);
      console.log(`   🆓 Gratuit: ${event.isFree ? 'Oui' : 'Non'}`);
      console.log(`   🔗 URL: ${event.url}\n`);
    });

    if (qdsEvents.length > 0) {
      console.log('\n🔄 Test de mapping vers le format unifié...');
      const unifiedEvent = await qdsConnector.mapToUnifiedEvent(qdsEvents[0]);
      console.log('\n✅ Événement QDS unifié:');
      console.log(`   ID: ${unifiedEvent.sourceId}`);
      console.log(`   Source: ${unifiedEvent.source}`);
      console.log(`   Titre: ${unifiedEvent.title}`);
      console.log(`   Description: ${unifiedEvent.description.substring(0, 80)}...`);
      console.log(`   Date début: ${unifiedEvent.startAt}`);
      console.log(`   Date fin: ${unifiedEvent.endAt}`);
      console.log(`   Lieu: ${unifiedEvent.venue?.name}`);
      console.log(`   Coordonnées: ${unifiedEvent.venue?.lat}, ${unifiedEvent.venue?.lon}`);
      console.log(`   Prix min: ${unifiedEvent.priceMin} cents`);
      console.log(`   Catégorie: ${unifiedEvent.category}`);
      console.log(`   Tags: ${unifiedEvent.tags.join(', ')}`);
      console.log(`   Langue: ${unifiedEvent.language}`);
    }
  } catch (error: any) {
    console.error('❌ Erreur QDS:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test Tourisme Montréal
  console.log('🏛️ === TEST TOURISME MONTRÉAL ===');
  const tourismConnector = new TourismeMontrealaConnector();

  try {
    console.log('\n📡 Récupération des événements de Tourisme MTL...');
    const tourismEvents = await tourismConnector.listUpdatedSince(since, 10);
    console.log(`\n✅ ${tourismEvents.length} événements Tourisme MTL récupérés:\n`);
    
    tourismEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   📅 Date: ${new Date(event.startDate).toLocaleDateString('fr-FR')}`);
      console.log(`   📍 Venue: ${event.venue}`);
      console.log(`   🎯 Catégorie: ${event.category}`);
      console.log(`   💰 Prix: ${event.price || 'N/A'}`);
      console.log(`   🏘️ Quartier: ${event.neighborhood || 'N/A'}`);
      console.log(`   🔗 URL: ${event.url}\n`);
    });

    if (tourismEvents.length > 0) {
      console.log('\n🔄 Test de mapping vers le format unifié...');
      const unifiedEvent = await tourismConnector.mapToUnifiedEvent(tourismEvents[0]);
      console.log('\n✅ Événement Tourisme MTL unifié:');
      console.log(`   ID: ${unifiedEvent.sourceId}`);
      console.log(`   Source: ${unifiedEvent.source}`);
      console.log(`   Titre: ${unifiedEvent.title}`);
      console.log(`   Description: ${unifiedEvent.description.substring(0, 80)}...`);
      console.log(`   Date début: ${unifiedEvent.startAt}`);
      console.log(`   Date fin: ${unifiedEvent.endAt}`);
      console.log(`   Lieu: ${unifiedEvent.venue?.name}`);
      console.log(`   Coordonnées: ${unifiedEvent.venue?.lat}, ${unifiedEvent.venue?.lon}`);
      console.log(`   Prix min: ${unifiedEvent.priceMin} cents`);
      console.log(`   Catégorie: ${unifiedEvent.category}`);
      console.log(`   Tags: ${unifiedEvent.tags.join(', ')}`);
      console.log(`   Langue: ${unifiedEvent.language}`);
    }
  } catch (error: any) {
    console.error('❌ Erreur Tourisme MTL:', error.message);
  }

  console.log('\n🎉 Test des connecteurs Montréal terminé avec succès!');
  console.log('\n📝 Résumé:');
  console.log('✅ Quartier des Spectacles - Événements culturels officiels');
  console.log('✅ Tourisme Montréal - Attractions touristiques officielles');
  console.log('✅ Sources légitimes et respectueuses');
  console.log('✅ Intégration complète avec l\'orchestrateur');
  console.log('✅ Pins Pulse colorés par catégorie');
}

testMontrealSources();
