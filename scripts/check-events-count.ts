/**
 * Script pour vérifier le nombre d'événements dans la base de données
 * Usage: tsx scripts/check-events-count.ts
 */

import { prisma } from '../src/lib/prisma';
import { EventSource, EventStatus } from '@prisma/client';

async function checkEventsCount() {
  console.log('📊 Vérification du nombre d\'événements dans la base de données...\n');

  try {
    // Total d'événements
    const totalEvents = await prisma.event.count();
    
    // Événements actifs (SCHEDULED ou UPDATED)
    const activeEvents = await prisma.event.count({
      where: {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.UPDATED],
        },
      },
    });

    // Événements futurs (startAt >= maintenant)
    const now = new Date();
    const futureEvents = await prisma.event.count({
      where: {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.UPDATED],
        },
        startAt: {
          gte: now,
        },
      },
    });

    // Événements par source
    const eventsBySource = await prisma.event.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      where: {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.UPDATED],
        },
        startAt: {
          gte: now,
        },
      },
    });

    // Événements par catégorie
    const eventsByCategory = await prisma.event.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      where: {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.UPDATED],
        },
        startAt: {
          gte: now,
        },
      },
    });

    console.log('📈 Statistiques globales:');
    console.log(`   Total d'événements: ${totalEvents}`);
    console.log(`   Événements actifs: ${activeEvents}`);
    console.log(`   Événements futurs: ${futureEvents}\n`);

    console.log('📊 Événements futurs par source:');
    eventsBySource.forEach(({ source, _count }) => {
      console.log(`   ${source}: ${_count.id}`);
    });

    console.log('\n📊 Événements futurs par catégorie:');
    eventsByCategory.forEach(({ category, _count }) => {
      console.log(`   ${category}: ${_count.id}`);
    });

    // Objectif SPRINT 1: 300+ événements
    console.log('\n🎯 Objectif SPRINT 1:');
    if (futureEvents >= 300) {
      console.log(`   ✅ Objectif atteint ! (${futureEvents} événements futurs)`);
    } else {
      console.log(`   ⚠️  Objectif non atteint (${futureEvents} / 300 événements futurs)`);
      console.log(`   💡 Suggestion: Lancer une ingestion complète pour importer plus d'événements`);
    }

    // Derniers imports
    const lastImports = await prisma.importJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        source: true,
        status: true,
        startedAt: true,
        nbCreated: true,
        nbUpdated: true,
        nbErrors: true,
      },
    });

    console.log('\n📥 Derniers imports:');
    lastImports.forEach((job) => {
      console.log(`   ${job.source} (${job.status}): ${job.nbCreated} créés, ${job.nbUpdated} mis à jour, ${job.nbErrors} erreurs`);
      console.log(`      ${job.startedAt.toLocaleString('fr-CA')}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkEventsCount();

