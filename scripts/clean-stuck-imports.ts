/**
 * Script pour nettoyer les imports bloqués en "RUNNING"
 * Marque tous les imports RUNNING depuis plus d'1h comme ERROR
 */

import { prisma } from '../src/lib/prisma';
import { ImportJobStatus } from '@prisma/client';

async function cleanStuckImports() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Trouver tous les imports RUNNING depuis plus d'1h
    // Utilise startedAt si disponible, sinon runAt (compatibilité avec anciens imports)
    const stuckImports = await prisma.importJob.findMany({
      where: {
        status: ImportJobStatus.RUNNING,
        OR: [
          { startedAt: { lt: oneHourAgo } },
          { 
            startedAt: null,
            runAt: { lt: oneHourAgo }
          },
        ],
      },
    });

    if (stuckImports.length === 0) {
      console.log('✅ Aucun import bloqué trouvé');
      return;
    }

    console.log(`🔍 ${stuckImports.length} import(s) bloqué(s) trouvé(s)`);

    // Marquer comme ERROR
    for (const importJob of stuckImports) {
      const jobDate = importJob.startedAt || importJob.runAt;
      const duration = Math.round((Date.now() - jobDate.getTime()) / 1000 / 60); // minutes
      
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: ImportJobStatus.ERROR,
          finishedAt: new Date(),
          errorText: `Import bloqué depuis ${duration} minutes - marqué comme erreur automatiquement`,
          nbErrors: importJob.nbErrors || 1,
        },
      });

      console.log(
        `✅ Import ${importJob.id} (${importJob.source}) marqué comme ERROR (bloqué depuis ${duration} min)`,
      );
    }

    console.log(`\n✅ ${stuckImports.length} import(s) nettoyé(s) avec succès`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanStuckImports();



