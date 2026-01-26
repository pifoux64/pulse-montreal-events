#!/usr/bin/env tsx

/**
 * Script pour identifier et corriger les pages avec du texte français hardcodé
 * Génère un rapport détaillé et propose des corrections
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Issue {
  file: string;
  line: number;
  text: string;
  suggestion?: string;
}

// Textes français critiques à remplacer
const CRITICAL_FRENCH_TEXTS: Array<{ pattern: RegExp; translationKey: string; enValue: string }> = [
  // Messages d'erreur
  { pattern: /Erreur lors du chargement/g, translationKey: 'errors.loadingError', enValue: 'Error loading' },
  { pattern: /Erreur lors de la récupération/g, translationKey: 'errors.fetchError', enValue: 'Error fetching' },
  { pattern: /Erreur lors de la mise à jour/g, translationKey: 'errors.updateError', enValue: 'Error updating' },
  { pattern: /Erreur lors de la création/g, translationKey: 'errors.createError', enValue: 'Error creating' },
  { pattern: /Erreur lors de l'envoi/g, translationKey: 'errors.sendError', enValue: 'Error sending' },
  { pattern: /Erreur inconnue/g, translationKey: 'errors.unknownError', enValue: 'Unknown error' },
  { pattern: /Erreur de chargement/g, translationKey: 'errors.loadingError', enValue: 'Loading error' },
  
  // Messages d'authentification
  { pattern: /Identifiants invalides/g, translationKey: 'auth.invalidCredentials', enValue: 'Invalid credentials' },
  { pattern: /Vous n'avez pas l'autorisation/g, translationKey: 'auth.accessDenied', enValue: 'You do not have permission' },
  { pattern: /Vous devez être connecté/g, translationKey: 'auth.sessionRequired', enValue: 'You must be logged in' },
  { pattern: /Réessayer/g, translationKey: 'errors.tryAgain', enValue: 'Try Again' },
  { pattern: /Retour à l'accueil/g, translationKey: 'errors.goHome', enValue: 'Go Home' },
  
  // Placeholders et labels
  { pattern: /Rechercher une salle/g, translationKey: 'venues.searchPlaceholder', enValue: 'Search for a venue' },
  { pattern: /Rechercher un organisateur/g, translationKey: 'organizers.searchPlaceholder', enValue: 'Search for an organizer' },
  { pattern: /Rechercher des événements/g, translationKey: 'home.searchPlaceholder', enValue: 'Search for events' },
  
  // Titres de pages
  { pattern: /Ce soir à Montréal/g, translationKey: 'pages.tonight', enValue: 'Tonight in Montreal' },
  { pattern: /Ce week-end à Montréal/g, translationKey: 'pages.weekend', enValue: 'This Weekend in Montreal' },
  { pattern: /Salle non trouvée/g, translationKey: 'venues.notFound', enValue: 'Venue not found' },
  { pattern: /Organisateur non trouvé/g, translationKey: 'organizers.notFound', enValue: 'Organizer not found' },
  { pattern: /Événement non trouvé/g, translationKey: 'events.notFound', enValue: 'Event not found' },
  { pattern: /Top 5 non trouvé/g, translationKey: 'top5.notFound', enValue: 'Top 5 not found' },
  
  // Descriptions
  { pattern: /Découvrez les événements de ce soir/g, translationKey: 'pages.tonightDescription', enValue: 'Discover tonight\'s events' },
  { pattern: /Découvrez les événements de ce week-end/g, translationKey: 'pages.weekendDescription', enValue: 'Discover this weekend\'s events' },
];

// Fonction pour détecter les problèmes dans un fichier
function detectIssues(filePath: string, content: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Ignorer les commentaires, imports, et certaines lignes
    if (line.trim().startsWith('//') || 
        line.trim().startsWith('/*') || 
        line.trim().startsWith('*') ||
        line.trim().startsWith('import') ||
        line.trim().startsWith('export') ||
        line.includes('className=') ||
        line.includes('useTranslations') ||
        line.includes('getTranslations') ||
        line.includes('t(') ||
        line.includes('t.') ||
        line.includes('console.')) {
      return;
    }
    
    // Chercher les textes français critiques
    for (const { pattern, translationKey, enValue } of CRITICAL_FRENCH_TEXTS) {
      if (pattern.test(line)) {
        // Vérifier que c'est dans une chaîne de caractères
        const stringMatch = line.match(/['"`]([^'"`]*)['"`]/g);
        if (stringMatch && stringMatch.some(str => pattern.test(str))) {
          issues.push({
            file: filePath,
            line: index + 1,
            text: line.trim(),
            suggestion: `Use translation key: ${translationKey} or replace with: "${enValue}"`
          });
          break;
        }
      }
    }
  });
  
  return issues;
}

async function main() {
  console.log('🔍 Analyse des pages pour identifier le texte français hardcodé...\n');
  
  const appDir = path.join(process.cwd(), 'src', 'app');
  const pageFiles = await glob('**/page.tsx', { cwd: appDir, absolute: true });
  const clientFiles = await glob('**/*-client.tsx', { cwd: appDir, absolute: true });
  const componentFiles = await glob('**/*.tsx', { cwd: path.join(process.cwd(), 'src', 'components'), absolute: true });
  
  const allFiles = [...pageFiles, ...clientFiles, ...componentFiles];
  
  const allIssues: Issue[] = [];
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const issues = detectIssues(file, content);
      allIssues.push(...issues);
    } catch (error) {
      // Ignorer les erreurs de lecture
    }
  }
  
  // Grouper par fichier
  const issuesByFile = new Map<string, Issue[]>();
  allIssues.forEach(issue => {
    const relativePath = path.relative(process.cwd(), issue.file);
    if (!issuesByFile.has(relativePath)) {
      issuesByFile.set(relativePath, []);
    }
    issuesByFile.get(relativePath)!.push(issue);
  });
  
  if (issuesByFile.size === 0) {
    console.log('✅ Aucun texte français hardcodé critique détecté !\n');
    return;
  }
  
  console.log(`⚠️  ${issuesByFile.size} fichier(s) avec du texte français hardcodé:\n`);
  
  issuesByFile.forEach((issues, file) => {
    console.log(`📄 ${file}`);
    issues.slice(0, 10).forEach(issue => {
      console.log(`   Ligne ${issue.line}: ${issue.text.substring(0, 80)}${issue.text.length > 80 ? '...' : ''}`);
      if (issue.suggestion) {
        console.log(`      💡 ${issue.suggestion}`);
      }
    });
    if (issues.length > 10) {
      console.log(`   ... et ${issues.length - 10} autres`);
    }
    console.log('');
  });
  
  // Générer un rapport JSON
  const reportPath = path.join(process.cwd(), 'i18n-issues-report.json');
  const report = {
    generatedAt: new Date().toISOString(),
    totalFiles: issuesByFile.size,
    totalIssues: allIssues.length,
    issues: Array.from(issuesByFile.entries()).map(([file, issues]) => ({
      file,
      issues: issues.map(i => ({
        line: i.line,
        text: i.text,
        suggestion: i.suggestion
      }))
    }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Rapport détaillé sauvegardé dans: ${reportPath}\n`);
  
  console.log('📋 Résumé:');
  console.log(`   - Fichiers avec problèmes: ${issuesByFile.size}`);
  console.log(`   - Total d'occurrences: ${allIssues.length}`);
  console.log('\n💡 Pour corriger ces problèmes:');
  console.log('   1. Utilisez useTranslations() ou getTranslations() dans les composants');
  console.log('   2. Ajoutez les clés manquantes dans messages/en.json');
  console.log('   3. Remplacez les textes hardcodés par des appels de traduction');
}

main().catch(console.error);
