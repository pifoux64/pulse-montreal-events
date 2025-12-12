/**
 * Script pour lancer une ingestion complète de toutes les sources
 * Usage: tsx scripts/run-full-ingestion.ts
 */

import { orchestrator } from '../src/lib/orchestrator';
import { logger } from '../src/lib/logger';

async function runFullIngestion() {
  console.log('🚀 Démarrage de l\'ingestion complète...\n');

  try {
    const startTime = Date.now();
    
    const results = await orchestrator.runIngestion();
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ Ingestion complète terminée !\n');
    console.log(`⏱️  Durée totale: ${Math.round(duration / 1000)}s\n`);
    
    console.log('📊 Résultats par source:');
    console.log('─'.repeat(60));
    
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const [source, stats] of Object.entries(results)) {
      if (stats) {
        totalCreated += stats.totalCreated;
        totalUpdated += stats.totalUpdated;
        totalSkipped += stats.totalSkipped;
        totalErrors += stats.totalErrors;
        
        console.log(`\n🔗 ${source}:`);
        console.log(`   📥 Récupérés: ${stats.totalFetched}`);
        console.log(`   ✅ Traités: ${stats.totalProcessed}`);
        console.log(`   🆕 Créés: ${stats.totalCreated}`);
        console.log(`   🔄 Mis à jour: ${stats.totalUpdated}`);
        console.log(`   ⏭️  Ignorés: ${stats.totalSkipped}`);
        console.log(`   ❌ Erreurs: ${stats.totalErrors}`);
        console.log(`   ⏱️  Durée: ${Math.round(stats.duration / 1000)}s`);
        
        if (stats.errors.length > 0) {
          console.log(`   🐛 Détail erreurs:`);
          stats.errors.slice(0, 3).forEach(error => {
            console.log(`      - ${error.substring(0, 80)}${error.length > 80 ? '...' : ''}`);
          });
          if (stats.errors.length > 3) {
            console.log(`      ... et ${stats.errors.length - 3} autres erreurs`);
          }
        }
      }
    }
    
    console.log('\n' + '─'.repeat(60));
    console.log('📈 Totaux:');
    console.log(`   🆕 Créés: ${totalCreated}`);
    console.log(`   🔄 Mis à jour: ${totalUpdated}`);
    console.log(`   ⏭️  Ignorés: ${totalSkipped}`);
    console.log(`   ❌ Erreurs: ${totalErrors}`);
    
    console.log('\n✅ Ingestion terminée avec succès !');
    
  } catch (error) {
    logger.error('Erreur lors de l\'ingestion complète:', error);
    console.error('\n❌ Erreur lors de l\'ingestion:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runFullIngestion();

