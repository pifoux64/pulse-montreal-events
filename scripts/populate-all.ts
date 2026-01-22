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
    // 0. Générer les slugs pour les venues existantes
    console.log('🔗 Étape 0/3 : Génération des slugs pour les venues existantes...\n');
    try {
      const { stdout, stderr } = await execAsync('npx tsx scripts/generate-venue-slugs.ts');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération des slugs:', error.message);
      // Continuer même en cas d'erreur
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 1. Créer les salles depuis les événements
    console.log('📍 Étape 1/3 : Création des salles depuis les événements...\n');
    try {
      const { stdout, stderr } = await execAsync('npx tsx scripts/populate-venues-improved.ts');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création des salles:', error.message);
      // Continuer même en cas d'erreur
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Créer les organisateurs depuis les événements
    console.log('👥 Étape 2/3 : Création des organisateurs depuis les événements...\n');
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
