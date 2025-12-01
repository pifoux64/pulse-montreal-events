#!/usr/bin/env tsx
/**
 * Script pour recalculer les tags structurés (EventTag) pour tous les événements.
 *
 * Usage :
 *   npx tsx scripts/rebuild-tags.ts
 *
 * Pré-requis :
 *   - DATABASE_URL configuré
 *   - Migrations Prisma à jour (EventTag, TagDefinition, UserInterestTag)
 */

import { config } from 'dotenv';
import { prisma } from '../src/lib/prisma';
import { enrichEventWithTags } from '../src/lib/tagging/eventTaggingService';

config({ path: '.env.local' });

async function main() {
  const batchSize = 200;
  let skip = 0;
  let totalProcessed = 0;

  console.log('🚀 Rebuild des tags structurés pour TOUS les événements');

  // Boucle par batch pour éviter de charger tous les events en mémoire
  // et pour pouvoir reprendre facilement si besoin.
  // On limite aux événements SCHEDULED, mais on pourrait étendre si nécessaire.
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
        console.error(`❌ Erreur enrichEventWithTags(${e.id})`, err);
      }
    }

    skip += batchSize;
  }

  console.log(`✅ Rebuild terminé. Événements traités: ${totalProcessed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


