/**
 * Script pour générer des slugs pour toutes les venues qui n'en ont pas
 */

import { prisma } from '../src/lib/prisma';

// Fonction pour générer un slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
    .substring(0, 100); // Limiter la longueur
}

// Fonction pour s'assurer que le slug est unique
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.venue.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function main() {
  console.log('🚀 Génération des slugs pour les venues sans slug...\n');

  try {
    // Récupérer toutes les venues sans slug
    const venues = await prisma.venue.findMany({
      where: {
        slug: null,
      },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    console.log(`📊 ${venues.length} venues sans slug trouvées\n`);

    let updated = 0;
    let skipped = 0;

    for (const venue of venues) {
      try {
        const baseSlug = generateSlug(venue.name);
        const slug = await ensureUniqueSlug(baseSlug, venue.id);

        await prisma.venue.update({
          where: { id: venue.id },
          data: { slug },
        });

        console.log(`✅ Slug généré pour "${venue.name}": ${slug} (${venue._count.events} événements)`);
        updated++;
      } catch (error: any) {
        console.error(`❌ Erreur pour "${venue.name}":`, error.message);
        skipped++;
      }
    }

    console.log(`\n✨ Terminé !`);
    console.log(`   - ${updated} venues mises à jour`);
    console.log(`   - ${skipped} venues ignorées`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
