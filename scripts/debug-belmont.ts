/**
 * Script de debug pour voir comment les données de "Le Belmont" sont stockées
 */

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔍 Recherche des événements pour "Le Belmont"...\n');

  try {
    // Chercher les événements qui mentionnent "belmont"
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: 'belmont', mode: 'insensitive' } },
          { description: { contains: 'belmont', mode: 'insensitive' } },
        ],
      },
      include: {
        features: true,
        venue: true,
        eventSources: true,
      },
      take: 10,
    });

    console.log(`📊 ${events.length} événements trouvés mentionnant "belmont"\n`);

    for (const event of events) {
      console.log(`\n📅 Événement: ${event.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   venueId: ${event.venueId || 'NULL'}`);
      console.log(`   venue: ${event.venue ? event.venue.name : 'NULL'}`);
      console.log(`   Features (${event.features.length}):`);
      for (const feature of event.features) {
        console.log(`     - ${feature.featureKey}: ${JSON.stringify(feature.featureValue).substring(0, 100)}`);
      }
      console.log(`   EventSources (${event.eventSources.length}):`);
      for (const source of event.eventSources) {
        console.log(`     - source: ${source.source}, externalId: ${source.externalId}`);
        if (source.metadata) {
          console.log(`       metadata: ${JSON.stringify(source.metadata).substring(0, 200)}`);
        }
      }
      console.log(`   Description (premiers 200 chars): ${event.description.substring(0, 200)}...`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
