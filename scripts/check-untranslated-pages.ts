#!/usr/bin/env tsx

/**
 * Script pour identifier toutes les pages non traduites
 * Cherche les textes hardcodés en français dans les pages
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const FRENCH_PATTERNS = [
  /Tableau de bord/i,
  /Gérez vos/i,
  /Nouvel événement/i,
  /Vues \(/i,
  /Clics \(/i,
  /Favoris \(/i,
  /Événements à venir/i,
  /Mes événements/i,
  /Outils IA/i,
  /Import ICS/i,
  /Afficher|Masquer/i,
  /Upgradez vers PRO/i,
  /Créer un événement/i,
  /Aucun événement/i,
  /Programmé/i,
  /vues|favoris/i,
  /Voir|Modifier|Supprimer/i,
  /Mes Favoris/i,
  /Calendrier/i,
  /Pour toi/i,
  /Top 5/i,
  /Prix|Pricing/i,
  /Fonctionnalités/i,
  /Notifications/i,
  /Carte/i,
  /Profil/i,
  /Organisateur/i,
  /Salle/i,
  /Dashboard/i,
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /messages\//,
  /scripts\//,
  /prisma\//,
  /\.md$/,
];

async function findUntranslatedPages() {
  const pagesDir = path.join(process.cwd(), 'src/app');
  const pageFiles = await glob('**/page.tsx', {
    cwd: pagesDir,
    absolute: true,
  });

  const untranslated: Array<{ file: string; matches: string[] }> = [];

  for (const file of pageFiles) {
    if (IGNORE_PATTERNS.some(pattern => pattern.test(file))) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    
    // Vérifier si useTranslations ou getTranslations est utilisé
    const hasTranslations = /useTranslations|getTranslations/.test(content);
    
    // Chercher les patterns français
    const matches: string[] = [];
    for (const pattern of FRENCH_PATTERNS) {
      const found = content.match(pattern);
      if (found) {
        matches.push(...found);
      }
    }

    if (matches.length > 0 || (!hasTranslations && content.includes('"'))) {
      untranslated.push({
        file: path.relative(process.cwd(), file),
        matches: [...new Set(matches)],
      });
    }
  }

  return untranslated;
}

async function main() {
  console.log('🔍 Recherche des pages non traduites...\n');
  
  const untranslated = await findUntranslatedPages();
  
  if (untranslated.length === 0) {
    console.log('✅ Toutes les pages sont traduites !');
    return;
  }

  console.log(`❌ ${untranslated.length} pages non traduites trouvées:\n`);
  
  for (const { file, matches } of untranslated) {
    console.log(`📄 ${file}`);
    if (matches.length > 0) {
      console.log(`   Patterns trouvés: ${matches.slice(0, 5).join(', ')}${matches.length > 5 ? '...' : ''}`);
    }
    console.log();
  }
}

main().catch(console.error);
