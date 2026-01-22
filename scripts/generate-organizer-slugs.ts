/**
 * Script pour générer des slugs pour toutes les organisateurs qui n'en ont pas
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
    const existing = await prisma.organizer.findUnique({
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
  console.log('🚀 Génération des slugs pour les organisateurs sans slug...\n');

  try {
    // Récupérer toutes les organisateurs sans slug
    const organizers = await prisma.organizer.findMany({
      where: {
        slug: null,
      },
      include: {
        _count: {
          select: {
            events: true,
            followers: true,
          },
        },
      },
    });

    console.log(`📊 ${organizers.length} organisateurs sans slug trouvés\n`);

    let updated = 0;
    let skipped = 0;

    for (const organizer of organizers) {
      try {
        const baseSlug = generateSlug(organizer.displayName);
        const slug = await ensureUniqueSlug(baseSlug, organizer.id);

        await prisma.organizer.update({
          where: { id: organizer.id },
          data: { slug },
        });

        console.log(`✅ Slug généré pour "${organizer.displayName}": ${slug} (${organizer._count.events} événements, ${organizer._count.followers} abonnés)`);
        updated++;
      } catch (error: any) {
        console.error(`❌ Erreur pour "${organizer.displayName}":`, error.message);
        skipped++;
      }
    }

    console.log(`\n✨ Terminé !`);
    console.log(`   - ${updated} organisateurs mis à jour`);
    console.log(`   - ${skipped} organisateurs ignorés`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
