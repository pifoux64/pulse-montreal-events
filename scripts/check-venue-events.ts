/**
 * Script pour vérifier les événements d'une venue spécifique
 */

import { prisma } from '../src/lib/prisma';

async function main() {
  const venueSlug = process.argv[2] || 'le-belmont';
  
  console.log(`🔍 Vérification des événements pour la venue: ${venueSlug}\n`);

  try {
    const venue = await prisma.venue.findUnique({
      where: { slug: venueSlug },
      include: {
        events: {
          orderBy: {
            startAt: 'desc',
          },
          take: 20,
          select: {
            id: true,
            title: true,
            startAt: true,
            status: true,
            venueId: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!venue) {
      console.log(`❌ Venue "${venueSlug}" non trouvée`);
      return;
    }

    console.log(`✅ Venue trouvée: ${venue.name}`);
    console.log(`   ID: ${venue.id}`);
    console.log(`   Slug: ${venue.slug}`);
    console.log(`   Total événements (selon _count): ${venue._count.events}`);
    console.log(`   Événements récupérés: ${venue.events.length}\n`);

    if (venue.events.length === 0) {
      console.log('⚠️  Aucun événement récupéré dans la relation');
      
      // Vérifier directement dans la table events
      const directEvents = await prisma.event.findMany({
        where: {
          venueId: venue.id,
        },
        select: {
          id: true,
          title: true,
          startAt: true,
          status: true,
          venueId: true,
        },
        take: 10,
      });

      console.log(`\n📊 Événements trouvés directement (venueId=${venue.id}): ${directEvents.length}`);
      if (directEvents.length > 0) {
        console.log('\nPremiers événements:');
        directEvents.forEach((event, i) => {
          const date = new Date(event.startAt);
          const isPast = date < new Date();
          console.log(`  ${i + 1}. ${event.title}`);
          console.log(`     Date: ${date.toLocaleString('fr-CA')} ${isPast ? '(passé)' : '(futur)'}`);
          console.log(`     Status: ${event.status}`);
          console.log(`     venueId: ${event.venueId}`);
        });
      }
    } else {
      console.log('Événements récupérés:');
      venue.events.forEach((event, i) => {
        const date = new Date(event.startAt);
        const isPast = date < new Date();
        console.log(`  ${i + 1}. ${event.title}`);
        console.log(`     Date: ${date.toLocaleString('fr-CA')} ${isPast ? '(passé)' : '(futur)'}`);
        console.log(`     Status: ${event.status}`);
      });
    }

    // Vérifier les événements futurs
    const now = new Date();
    const futureEvents = await prisma.event.findMany({
      where: {
        venueId: venue.id,
        status: 'SCHEDULED',
        startAt: {
          gte: now,
        },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
      },
    });

    console.log(`\n📅 Événements futurs (status=SCHEDULED, startAt >= maintenant): ${futureEvents.length}`);
    if (futureEvents.length > 0) {
      futureEvents.forEach((event, i) => {
        console.log(`  ${i + 1}. ${event.title} - ${new Date(event.startAt).toLocaleString('fr-CA')}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
