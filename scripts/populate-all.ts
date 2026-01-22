/**
 * Script principal pour remplir toutes les salles et organisateurs depuis les événements
 * 
 * Ce script exécute dans l'ordre :
 * 1. Création des salles depuis les événements
 * 2. Création des organisateurs depuis les événements
 * 
 * Usage: npx tsx scripts/populate-all.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  console.log('🚀 Début du remplissage des salles et organisateurs...\n');

  try {
    // 1. Créer les salles
    console.log('📍 Étape 1/2 : Création des salles...\n');
    try {
      const { stdout, stderr } = await execAsync('npx tsx scripts/populate-venues-from-events.ts');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création des salles:', error.message);
      // Continuer même en cas d'erreur
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Créer les organisateurs
    console.log('👥 Étape 2/2 : Création des organisateurs...\n');
    try {
      const { stdout, stderr } = await execAsync('npx tsx scripts/populate-organizers-from-events.ts');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création des organisateurs:', error.message);
    }

    console.log('\n✨ Terminé ! Toutes les salles et organisateurs ont été créés.\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();
