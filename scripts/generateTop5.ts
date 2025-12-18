/**
 * Script pour générer des Top 5 par genre
 * Usage: npx tsx scripts/generateTop5.ts
 */

import { prisma } from '../src/lib/prisma';
import { upsertPulsePicksPost, PulsePicksTheme } from '../src/lib/editorial/pulsePicksEngine';
import { MONTREAL_TIMEZONE } from '../src/lib/utils';

// Genres/thèmes pour lesquels générer des Top 5
// Tous les genres musicaux + catégories générales
const THEMES: PulsePicksTheme[] = [
  // Catégories générales
  'musique',
  'famille',
  'culture',
  'sport',
  'gratuit',
  // Tous les genres musicaux
  'reggae',
  'hip_hop',
  'pop',
  'rnb',
  'rock',
  'heavy_metal',
  'punk',
  'jazz',
  'soul',
  'funk',
  'blues',
  'techno',
  'house',
  'trance',
  'drum_and_bass',
  'electronic',
  'latin',
  'afrobeat',
  'experimental',
  'world',
  'classique',
  'disco',
  'country',
  'folk',
  'indie',
  'alternative',
  'dubstep',
];

async function generateTop5ForAllThemes() {
  console.log('🎯 Génération des Top 5 par genre...\n');

  // Calculer la période de la semaine actuelle (lundi à dimanche)
  const now = new Date();
  const montrealDate = new Date(now.toLocaleString('en-US', { timeZone: MONTREAL_TIMEZONE }));
  
  // Trouver le lundi de cette semaine
  const dayOfWeek = montrealDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si dimanche, remonter de 6 jours, sinon remonter à lundi
  const monday = new Date(montrealDate);
  monday.setDate(montrealDate.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  // Dimanche de cette semaine
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  console.log(`📅 Période: ${monday.toLocaleDateString('fr-CA')} - ${sunday.toLocaleDateString('fr-CA')}\n`);

  const results = [];

  for (const theme of THEMES) {
    try {
      console.log(`🔄 Génération Top 5 pour "${theme}"...`);
      
      const result = await upsertPulsePicksPost({
        theme,
        periodStart: monday,
        periodEnd: sunday,
        limit: 5,
      });

      // Publier automatiquement le Top 5
      const publishedPost = await prisma.editorialPost.update({
        where: { id: result.post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      console.log(`✅ Top 5 "${theme}" généré et publié: ${publishedPost.slug}`);
      console.log(`   ${result.candidates.length} événements sélectionnés\n`);

      results.push({
        theme,
        slug: publishedPost.slug,
        eventsCount: result.candidates.length,
        success: true,
      });
    } catch (error: any) {
      console.error(`❌ Erreur pour "${theme}":`, error.message);
      results.push({
        theme,
        success: false,
        error: error.message,
      });
    }
  }

  console.log('\n📊 Résumé:');
  console.log('='.repeat(50));
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Réussis: ${successful.length}`);
  successful.forEach((r) => {
    console.log(`   - ${r.theme}: ${r.eventsCount} événements (${r.slug})`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Échecs: ${failed.length}`);
    failed.forEach((r) => {
      console.log(`   - ${r.theme}: ${r.error}`);
    });
  }

  console.log('\n✨ Terminé!');
}

// Exécuter le script
generateTop5ForAllThemes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });

