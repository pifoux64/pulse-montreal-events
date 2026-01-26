#!/usr/bin/env tsx

/**
 * Script pour vérifier la couverture i18n en anglais
 * - Compare les clés de traduction entre fr.json et en.json
 * - Identifie les pages avec du texte hardcodé en français
 * - Génère un rapport détaillé
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

// Fonction pour extraire toutes les clés d'un objet JSON de manière récursive
function extractKeys(obj: TranslationKeys, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Fonction pour obtenir la valeur d'une clé imbriquée
function getNestedValue(obj: TranslationKeys, keyPath: string): string | undefined {
  const keys = keyPath.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

// Mots français communs à rechercher dans le code
const FRENCH_WORDS = [
  'événement', 'événements', 'Événement', 'Événements',
  'organisateur', 'organisateurs', 'Organisateur', 'Organisateurs',
  'salle', 'salles', 'Salle', 'Salles',
  'favoris', 'Favoris',
  'calendrier', 'Calendrier',
  'carte', 'Carte',
  'profil', 'Profil',
  'publier', 'Publier',
  'pour toi', 'Pour toi',
  'aujourd\'hui', 'Aujourd\'hui',
  'ce soir', 'Ce soir',
  'week-end', 'Week-end',
  'catégorie', 'Catégorie',
  'catégories', 'Catégories',
  'rechercher', 'Rechercher',
  'filtrer', 'Filtrer',
  'trier', 'Trier',
  'chargement', 'Chargement',
  'erreur', 'Erreur',
  'succès', 'Succès',
  'annuler', 'Annuler',
  'confirmer', 'Confirmer',
  'sauvegarder', 'Sauvegarder',
  'modifier', 'Modifier',
  'supprimer', 'Supprimer',
  'suivant', 'Suivant',
  'précédent', 'Précédent',
  'fermer', 'Fermer',
  'ouvrir', 'Ouvrir',
  'oui', 'Oui',
  'non', 'Non',
  'gratuit', 'Gratuit',
  'prix', 'Prix',
  'date', 'Date',
  'heure', 'Heure',
  'lieu', 'Lieu',
  'description', 'Description',
  'titre', 'Titre',
  'nom', 'Nom',
  'adresse', 'Adresse',
  'ville', 'Ville',
  'accueil', 'Accueil',
  'découvrir', 'Découvrir',
  'musique', 'Musique',
  'famille', 'Famille',
  'culture', 'Culture',
  'sport', 'Sport',
  'notifications', 'Notifications',
  'messages', 'Messages',
  'social', 'Social',
  'pulsers', 'Pulsers',
  'top 5', 'Top 5',
  'picks', 'Picks',
  'pulse picks', 'Pulse Picks',
  'organisateur', 'Organisateur',
  'dashboard', 'Dashboard',
  'intégrations', 'Intégrations',
  'mon profil', 'Mon profil',
  'tableau de bord', 'Tableau de bord',
  'créer un événement', 'Créer un événement',
  'mes événements', 'Mes événements',
  'statistiques', 'Statistiques',
  'promotions', 'Promotions',
  'paramètres', 'Paramètres',
  'vérification', 'Vérification',
  'abonnement', 'Abonnement',
  'facturation', 'Facturation',
  'support', 'Support',
  'administration', 'Administration',
  'utilisateurs', 'Utilisateurs',
  'analytiques', 'Analytiques',
  'ingestion', 'Ingestion',
  'modération', 'Modération',
  'rapports', 'Rapports',
  'logs', 'Logs',
  'page non trouvée', 'Page non trouvée',
  'erreur serveur', 'Erreur serveur',
  'accès refusé', 'Accès refusé',
  'non autorisé', 'Non autorisé',
  'requête invalide', 'Requête invalide',
  'erreur réseau', 'Erreur réseau',
  'erreur inconnue', 'Erreur inconnue',
  'réessayer', 'Réessayer',
  'retour à l\'accueil', 'Retour à l\'accueil',
  'contacter le support', 'Contacter le support',
  'se connecter', 'Se connecter',
  's\'inscrire', 'S\'inscrire',
  'se déconnecter', 'Se déconnecter',
  'adresse e-mail', 'Adresse e-mail',
  'mot de passe', 'Mot de passe',
  'mot de passe oublié', 'Mot de passe oublié',
  'réinitialiser le mot de passe', 'Réinitialiser le mot de passe',
  'créer un compte', 'Créer un compte',
  'vous avez déjà un compte', 'Vous avez déjà un compte',
  'vous n\'avez pas de compte', 'Vous n\'avez pas de compte',
  'se connecter avec', 'Se connecter avec',
  's\'inscrire avec', 'S\'inscrire avec',
  'lien magique', 'Lien magique',
  'envoyer le lien magique', 'Envoyer le lien magique',
  'vérifiez votre e-mail', 'Vérifiez votre e-mail',
  'un lien de connexion a été envoyé', 'Un lien de connexion a été envoyé',
  'identifiants invalides', 'Identifiants invalides',
  'compte non trouvé', 'Compte non trouvé',
  'cette adresse e-mail est déjà utilisée', 'Cette adresse e-mail est déjà utilisée',
  'le mot de passe est trop faible', 'Le mot de passe est trop faible',
  'conditions d\'utilisation', 'Conditions d\'utilisation',
  'politique de confidentialité', 'Politique de confidentialité',
  'j\'accepte les conditions d\'utilisation', 'J\'accepte les conditions d\'utilisation',
  'gestion des cookies', 'Gestion des cookies',
  'nous utilisons des cookies', 'Nous utilisons des cookies',
  'accepter tous les cookies', 'Accepter tous les cookies',
  'refuser les cookies non-essentiels', 'Refuser les cookies non-essentiels',
  'sauvegarder mes préférences', 'Sauvegarder mes préférences',
  'voir les détails', 'Voir les détails',
  'masquer les détails', 'Masquer les détails',
  'cookies nécessaires', 'Cookies nécessaires',
  'cookies analytiques', 'Cookies analytiques',
  'cookies marketing', 'Cookies marketing',
  'configurez vos préférences', 'Configurez vos préférences',
  'étape', 'Étape',
  'passer', 'Passer',
  'terminer', 'Terminer',
  'quels genres musicaux vous intéressent', 'Quels genres musicaux vous intéressent',
  'sélectionnez un ou plusieurs genres', 'Sélectionnez un ou plusieurs genres',
  'quels types d\'événements vous intéressent', 'Quels types d\'événements vous intéressent',
  'choisissez les catégories d\'événements', 'Choisissez les catégories d\'événements',
  'quelles ambiances vous plaisent', 'Quelles ambiances vous plaisent',
  'sélectionnez les vibes', 'Sélectionnez les vibes',
  'préférences optionnelles', 'Préférences optionnelles',
  'ces informations nous aident', 'Ces informations nous aident',
  'vous pouvez passer cette étape', 'Vous pouvez passer cette étape',
  'jours préférés', 'Jours préférés',
  'horaires préférés', 'Horaires préférés',
  'semaine', 'Semaine',
  'weekend', 'Weekend',
  'jour', 'Jour',
  'soir', 'Soir',
  'nuit', 'Nuit',
  'sauvegarde en cours', 'Sauvegarde en cours',
  'découvrez des événements faits pour vous', 'Découvrez des événements faits pour vous',
  'basés sur vos préférences', 'Basés sur vos préférences',
  'aucune recommandation pour le moment', 'Aucune recommandation pour le moment',
  'configurez vos préférences', 'Configurez vos préférences',
  'dans votre profil', 'Dans votre profil',
  'pour recevoir des recommandations personnalisées', 'Pour recevoir des recommandations personnalisées',
  'configurer mes préférences', 'Configurer mes préférences',
  'aller au profil', 'Aller au profil',
  'recommandé', 'Recommandé',
  'événement recommandé', 'Événement recommandé',
  'événements recommandés', 'Événements recommandés',
  'ce week-end', 'Ce week-end',
  'tous les événements', 'Tous les événements',
  'actualiser', 'Actualiser',
  'chargement de vos recommandations', 'Chargement de vos recommandations',
  'erreur lors du chargement des recommandations', 'Erreur lors du chargement des recommandations',
  'vérifiez votre connexion', 'Vérifiez votre connexion',
  'votre genre préféré', 'Votre genre préféré',
  'voir le top 5', 'Voir le Top 5',
  'top 5 sélectionné par notre ia', 'Top 5 sélectionné par notre IA',
  'sélectionner la langue', 'Sélectionner la langue',
  'français', 'Français',
  'anglais', 'Anglais',
  'espagnol', 'Espagnol',
  'partager', 'Partager',
  'sauvegarder les 5', 'Sauvegarder les 5',
  'ajout', 'Ajout',
  'sauvegardé', 'Sauvegardé',
  'top 5', 'Top 5',
  'à montréal', 'À Montréal',
  'période du', 'Période du',
  'au', 'Au',
  'aucun événement sélectionné pour ce top 5', 'Aucun événement sélectionné pour ce Top 5',
  'pour le moment', 'Pour le moment',
  'envoie cette liste à quelqu\'un', 'Envoie cette liste à quelqu\'un',
  'retour à l\'accueil', 'Retour à l\'accueil',
  'erreur lors de l\'ajout aux favoris', 'Erreur lors de l\'ajout aux favoris',
  'mon profil', 'Mon profil',
  'gérez vos préférences', 'Gérez vos préférences',
  'pour recevoir des recommandations personnalisées d\'événements', 'Pour recevoir des recommandations personnalisées d\'événements',
  'mes goûts & préférences', 'Mes goûts & préférences',
  'ces préférences servent', 'Ces préférences servent',
  'aux recommandations et notifications', 'Aux recommandations et notifications',
  'modifier mes préférences d\'onboarding', 'Modifier mes préférences d\'onboarding',
  'recommandations personnalisées', 'Recommandations personnalisées',
  'utiliser vos goûts musicaux', 'Utiliser vos goûts musicaux',
  'pour des recommandations personnalisées', 'Pour des recommandations personnalisées',
  'recommandations personnalisées activées', 'Recommandations personnalisées activées',
  'recommandations personnalisées désactivées', 'Recommandations personnalisées désactivées',
  'mes préférences manuelles', 'Mes préférences manuelles',
  'aucune préférence manuelle pour l\'instant', 'Aucune préférence manuelle pour l\'instant',
  'ajouter une préférence', 'Ajouter une préférence',
  'genres musicaux', 'Genres musicaux',
  'ambiances', 'Ambiances',
  'genre', 'Genre',
  'style', 'Style',
  'type', 'Type',
  'ambiance', 'Ambiance',
  'genre (pour styles)', 'Genre (pour styles)',
  'valeur', 'Valeur',
  'sélectionner', 'Sélectionner',
  'ajouter', 'Ajouter',
  'retirer', 'Retirer',
  'chargement', 'Chargement',
  'intégrations organisateur', 'Intégrations organisateur',
  'publiez vos événements', 'Publiez vos événements',
  'sur facebook, eventbrite', 'Sur Facebook, Eventbrite',
  'et d\'autres plateformes', 'Et d\'autres plateformes',
  'gérer les intégrations', 'Gérer les intégrations',
  'facebook/eventbrite', 'Facebook/Eventbrite',
  'mes organisateurs suivis', 'Mes organisateurs suivis',
  'organisateurs que vous suivez', 'Organisateurs que vous suivez',
  'pour recevoir des notifications', 'Pour recevoir des notifications',
  'sur leurs nouveaux événements', 'Sur leurs nouveaux événements',
  'vous ne suivez aucun organisateur', 'Vous ne suivez aucun organisateur',
  'pour le moment', 'Pour le moment',
  'découvrir des organisateurs', 'Découvrir des organisateurs',
  'erreur lors du chargement', 'Erreur lors du chargement',
  'réessayer', 'Réessayer',
  'préférences mises à jour avec succès', 'Préférences mises à jour avec succès',
  'erreur lors de la mise à jour', 'Erreur lors de la mise à jour',
  'erreur inconnue', 'Erreur inconnue',
  'préférence ajoutée', 'Préférence ajoutée',
  'erreur de connexion', 'Erreur de connexion',
  'vérifiez votre connexion internet', 'Vérifiez votre connexion internet',
  'catégories d\'événements', 'Catégories d\'événements',
];

// Fonction pour détecter du texte français dans un fichier
function detectFrenchText(content: string, filePath: string): string[] {
  const issues: string[] = [];
  const lines = content.split('\n');
  
  // Ignorer les commentaires et les imports
  const codeLines = lines.filter((line, index) => {
    const trimmed = line.trim();
    return !trimmed.startsWith('//') && 
           !trimmed.startsWith('/*') && 
           !trimmed.startsWith('*') &&
           !trimmed.startsWith('import') &&
           !trimmed.startsWith('export') &&
           !trimmed.startsWith('from') &&
           !trimmed.startsWith('useTranslations') &&
           !trimmed.startsWith('getTranslations') &&
           trimmed.length > 0;
  });
  
  codeLines.forEach((line, index) => {
    const originalIndex = lines.indexOf(line);
    
    // Chercher des mots français
    for (const word of FRENCH_WORDS) {
      // Éviter les faux positifs dans les commentaires de code
      if (line.includes(word) && 
          !line.includes('//') && 
          !line.includes('/*') &&
          !line.includes('*') &&
          !line.includes('useTranslations') &&
          !line.includes('getTranslations') &&
          !line.includes('t(') &&
          !line.includes('t.') &&
          !line.includes('translation') &&
          !line.includes('Translation')) {
        // Vérifier si c'est dans une chaîne de caractères
        const stringMatch = line.match(/['"`]([^'"`]*)['"`]/g);
        if (stringMatch && stringMatch.some(str => str.includes(word))) {
          issues.push(`Ligne ${originalIndex + 1}: "${line.trim()}"`);
          break;
        }
      }
    }
  });
  
  return issues;
}

async function main() {
  console.log('🔍 Vérification de la couverture i18n en anglais...\n');
  
  // Charger les fichiers de traduction
  const messagesDir = path.join(process.cwd(), 'messages');
  const frPath = path.join(messagesDir, 'fr.json');
  const enPath = path.join(messagesDir, 'en.json');
  
  if (!fs.existsSync(frPath)) {
    console.error('❌ Fichier fr.json introuvable');
    process.exit(1);
  }
  
  if (!fs.existsSync(enPath)) {
    console.error('❌ Fichier en.json introuvable');
    process.exit(1);
  }
  
  const frTranslations: TranslationKeys = JSON.parse(fs.readFileSync(frPath, 'utf-8'));
  const enTranslations: TranslationKeys = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  
  // Extraire toutes les clés
  const frKeys = extractKeys(frTranslations);
  const enKeys = extractKeys(enTranslations);
  
  console.log(`📊 Statistiques des traductions:`);
  console.log(`   - Clés françaises: ${frKeys.length}`);
  console.log(`   - Clés anglaises: ${enKeys.length}\n`);
  
  // Trouver les clés manquantes en anglais
  const missingKeys = frKeys.filter(key => !enKeys.includes(key));
  
  if (missingKeys.length > 0) {
    console.log(`⚠️  Clés manquantes en anglais (${missingKeys.length}):`);
    missingKeys.forEach(key => {
      const frValue = getNestedValue(frTranslations, key);
      console.log(`   - ${key}: "${frValue}"`);
    });
    console.log('');
  } else {
    console.log('✅ Toutes les clés françaises ont une traduction anglaise\n');
  }
  
  // Vérifier les pages avec du texte hardcodé
  console.log('🔍 Recherche de texte français hardcodé dans les pages...\n');
  
  const appDir = path.join(process.cwd(), 'src', 'app');
  const pageFiles = await glob('**/page.tsx', { cwd: appDir, absolute: true });
  const clientFiles = await glob('**/*-client.tsx', { cwd: appDir, absolute: true });
  const componentFiles = await glob('**/*.tsx', { cwd: path.join(process.cwd(), 'src', 'components'), absolute: true });
  
  const allFiles = [...pageFiles, ...clientFiles, ...componentFiles];
  
  const filesWithIssues: Array<{ file: string; issues: string[] }> = [];
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const issues = detectFrenchText(content, file);
      
      if (issues.length > 0) {
        filesWithIssues.push({ file, issues });
      }
    } catch (error) {
      // Ignorer les erreurs de lecture
    }
  }
  
  if (filesWithIssues.length > 0) {
    console.log(`⚠️  Fichiers avec du texte français potentiellement hardcodé (${filesWithIssues.length}):\n`);
    filesWithIssues.forEach(({ file, issues }) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`📄 ${relativePath}`);
      issues.slice(0, 5).forEach(issue => console.log(`   ${issue}`));
      if (issues.length > 5) {
        console.log(`   ... et ${issues.length - 5} autres`);
      }
      console.log('');
    });
  } else {
    console.log('✅ Aucun texte français hardcodé détecté dans les fichiers analysés\n');
  }
  
  // Résumé
  console.log('📋 Résumé:');
  console.log(`   - Clés manquantes en anglais: ${missingKeys.length}`);
  console.log(`   - Fichiers avec texte français: ${filesWithIssues.length}`);
  
  if (missingKeys.length === 0 && filesWithIssues.length === 0) {
    console.log('\n✅ Toutes les pages sont disponibles en anglais !');
    process.exit(0);
  } else {
    console.log('\n⚠️  Des améliorations sont nécessaires pour une couverture complète en anglais.');
    process.exit(1);
  }
}

main().catch(console.error);
