#!/usr/bin/env tsx
/**
 * Script pour :
 * 1. Lancer l'ingestion Bandsintown
 * 2. Attendre le déploiement Vercel (optionnel)
 * 3. Relancer rebuild-tags pour reclassifier tous les événements avec les nouveaux styles
 *
 * Usage :
 *   npx tsx scripts/ingest-bandsintown-and-rebuild.ts
 */

import { config } from 'dotenv';
import { prisma } from '../src/lib/prisma';
import { orchestrator } from '../src/lib/orchestrator';
import { EventSource } from '@prisma/client';
import { enrichEventWithTags } from '../src/lib/tagging/eventTaggingService';

config({ path: '.env.local' });

async function waitForDeployment(seconds: number = 60) {
  console.log(`⏳ Attente de ${seconds} secondes pour le déploiement Vercel...`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  console.log('✅ Attente terminée');
}

async function ingestBandsintown() {
  console.log('🎸 Démarrage de l\'ingestion Bandsintown...');
  
  try {
    const stats = await orchestrator.runSingleSource(EventSource.BANDSINTOWN);
    console.log('✅ Ingestion Bandsintown terminée:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ingestion Bandsintown:', error);
    throw error;
  }
}

async function rebuildAllTags() {
  console.log('🚀 Rebuild des tags structurés pour TOUS les événements...');
  
  const batchSize = 200;
  let skip = 0;
  let totalProcessed = 0;
  let totalErrors = 0;

  for (;;) {
    const events = await prisma.event.findMany({
      select: { id: true },
      skip,
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    if (events.length === 0) break;

    console.log(`📦 Traitement d'un batch de ${events.length} événements (skip=${skip})`);

    for (const e of events) {
      try {
        await enrichEventWithTags(e.id);
        totalProcessed += 1;
      } catch (err) {
        totalErrors += 1;
        console.error(`❌ Erreur enrichEventWithTags(${e.id})`, err);
      }
    }

    skip += batchSize;
  }

  console.log(`✅ Rebuild terminé. Événements traités: ${totalProcessed}, Erreurs: ${totalErrors}`);
}

async function main() {
  try {
    // 1. Ingestion Bandsintown
    await ingestBandsintown();
    
    // 2. Attendre le déploiement (60 secondes par défaut)
    await waitForDeployment(60);
    
    // 3. Rebuild des tags
    await rebuildAllTags();
    
    console.log('🎉 Toutes les opérations sont terminées !');
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

