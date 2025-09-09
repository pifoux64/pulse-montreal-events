#!/usr/bin/env tsx
/**
 * Script interactif pour configurer les clés API - Pulse Montreal
 * Guide l'utilisateur étape par étape
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg: string) => console.log(`${colors.bright}${colors.cyan}🎵 ${msg}${colors.reset}\n`),
};

const apiConfigs = [
  {
    name: 'Eventbrite',
    envKey: 'EVENTBRITE_TOKEN',
    priority: 'ÉLEVÉE',
    description: 'Événements publics, concerts, conférences',
    url: 'https://www.eventbrite.com/platform/',
    steps: [
      '1. Créer un compte sur eventbrite.com',
      '2. Aller sur https://www.eventbrite.com/platform/',
      '3. Cliquer sur "Create App"',
      '4. Remplir: App Name = "Pulse Montreal Events"',
      '5. Récupérer le token dans "Your API keys"'
    ],
    quota: '1000 requêtes/heure (gratuit)',
  },
  {
    name: 'Ticketmaster',
    envKey: 'TICKETMASTER_API_KEY',
    priority: 'ÉLEVÉE',
    description: 'Concerts, spectacles, événements sportifs',
    url: 'https://developer.ticketmaster.com/',
    steps: [
      '1. Aller sur https://developer.ticketmaster.com/',
      '2. Cliquer sur "Get Your API Key"',
      '3. Remplir le formulaire avec vos infos',
      '4. Récupérer la "Consumer Key"'
    ],
    quota: '5000 requêtes/jour (gratuit)',
  },
  {
    name: 'Meetup',
    envKey: 'MEETUP_TOKEN',
    priority: 'MOYENNE',
    description: 'Événements communautaires, networking',
    url: 'https://secure.meetup.com/meetup_api/key/',
    steps: [
      '1. Créer un compte sur meetup.com',
      '2. Aller sur https://secure.meetup.com/meetup_api/key/',
      '3. Accepter les conditions',
      '4. Récupérer la clé API'
    ],
    quota: '200 requêtes/heure (gratuit)',
  },
  {
    name: 'Bandsintown',
    envKey: 'BANDSINTOWN_APP_ID',
    priority: 'MOYENNE',
    description: 'Concerts et événements musicaux',
    url: 'https://www.bandsintown.com/api/overview',
    steps: [
      '1. Aller sur https://www.bandsintown.com/api/overview',
      '2. Cliquer sur "Request API Access"',
      '3. Remplir le formulaire (attendre approbation 1-3 jours)',
      '4. Récupérer l\'App ID une fois approuvé'
    ],
    quota: 'Variable (avec approbation)',
  },
  {
    name: 'SeatGeek',
    envKey: 'SEATGEEK_CLIENT_ID',
    priority: 'FAIBLE',
    description: 'Événements sportifs et spectacles',
    url: 'https://seatgeek.com/build',
    steps: [
      '1. Créer un compte sur seatgeek.com',
      '2. Aller sur https://seatgeek.com/build',
      '3. Cliquer sur "Get Started"',
      '4. Créer une application et récupérer le Client ID'
    ],
    quota: '1000 requêtes/jour (gratuit)',
  },
];

async function readInput(question: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function loadEnvFile(): Promise<Record<string, string>> {
  const envPath = join(process.cwd(), '.env.local');
  const env: Record<string, string> = {};

  if (existsSync(envPath)) {
    const content = await fs.readFile(envPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  return env;
}

async function saveEnvFile(env: Record<string, string>): Promise<void> {
  const envPath = join(process.cwd(), '.env.local');
  const lines = [
    '# Configuration Pulse Montreal - Clés API',
    '# Généré automatiquement par scripts/setup-api-keys.ts',
    '',
    '# Base de données',
    `DATABASE_URL="${env.DATABASE_URL || ''}"`,
    '',
    '# NextAuth',
    `NEXTAUTH_SECRET="${env.NEXTAUTH_SECRET || ''}"`,
    `NEXTAUTH_URL="${env.NEXTAUTH_URL || 'http://localhost:3000'}"`,
    '',
    '# Supabase',
    `NEXT_PUBLIC_SUPABASE_URL="${env.NEXT_PUBLIC_SUPABASE_URL || ''}"`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY="${env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}"`,
    '',
    '# APIs externes pour ingestion',
    `EVENTBRITE_TOKEN="${env.EVENTBRITE_TOKEN || ''}"`,
    `TICKETMASTER_API_KEY="${env.TICKETMASTER_API_KEY || ''}"`,
    `MEETUP_TOKEN="${env.MEETUP_TOKEN || ''}"`,
    `BANDSINTOWN_APP_ID="${env.BANDSINTOWN_APP_ID || ''}"`,
    `SEATGEEK_CLIENT_ID="${env.SEATGEEK_CLIENT_ID || ''}"`,
    '',
    '# Services optionnels',
    `GEOCODING_PROVIDER="${env.GEOCODING_PROVIDER || 'NOMINATIM'}"`,
    `CRON_SECRET="${env.CRON_SECRET || ''}"`,
    '',
  ];

  await fs.writeFile(envPath, lines.join('\n'));
}

async function main() {
  console.clear();
  log.title('Configuration des Clés API - Pulse Montreal');

  console.log('Ce script vous guide pour obtenir et configurer toutes les clés API nécessaires.\n');

  // Charger la configuration existante
  const env = await loadEnvFile();
  let hasChanges = false;

  // Configuration des APIs
  for (const api of apiConfigs) {
    console.log(`${colors.bright}${colors.magenta}━━━ ${api.name} (Priorité: ${api.priority}) ━━━${colors.reset}`);
    console.log(`📝 ${api.description}`);
    console.log(`🔗 ${api.url}`);
    console.log(`📊 Quota: ${api.quota}\n`);

    const currentValue = env[api.envKey];
    if (currentValue) {
      log.success(`Clé existante: ${currentValue.substring(0, 8)}...`);
      
      const update = await readInput('Voulez-vous la mettre à jour ? (y/N): ');
      if (update.toLowerCase() !== 'y' && update.toLowerCase() !== 'yes') {
        console.log('');
        continue;
      }
    }

    console.log('\n📋 Étapes à suivre:');
    api.steps.forEach(step => console.log(`   ${step}`));
    console.log('');

    const openBrowser = await readInput('Ouvrir le lien dans le navigateur ? (Y/n): ');
    if (openBrowser.toLowerCase() !== 'n' && openBrowser.toLowerCase() !== 'no') {
      const { exec } = await import('child_process');
      exec(`open "${api.url}"`, (error) => {
        if (error) {
          log.warning(`Impossible d'ouvrir le navigateur. Allez sur: ${api.url}`);
        }
      });
    }

    const apiKey = await readInput(`Entrez votre clé ${api.name} (ou ENTER pour passer): `);
    
    if (apiKey) {
      env[api.envKey] = apiKey;
      hasChanges = true;
      log.success(`Clé ${api.name} configurée !`);
    } else {
      log.warning(`Clé ${api.name} ignorée`);
    }

    console.log('\n');
  }

  // Configuration de base si manquante
  if (!env.NEXTAUTH_SECRET) {
    log.info('Génération d\'un secret NextAuth...');
    env.NEXTAUTH_SECRET = require('crypto').randomBytes(32).toString('hex');
    hasChanges = true;
  }

  if (!env.CRON_SECRET) {
    log.info('Génération d\'un secret CRON...');
    env.CRON_SECRET = require('crypto').randomBytes(16).toString('hex');
    hasChanges = true;
  }

  // Sauvegarder les changements
  if (hasChanges) {
    await saveEnvFile(env);
    log.success('Configuration sauvegardée dans .env.local');
  } else {
    log.info('Aucun changement à sauvegarder');
  }

  // Résumé
  console.log(`\n${colors.bright}${colors.cyan}📊 Résumé de la configuration:${colors.reset}`);
  
  const configuredApis = apiConfigs.filter(api => env[api.envKey]);
  const missingApis = apiConfigs.filter(api => !env[api.envKey]);

  if (configuredApis.length > 0) {
    log.success(`APIs configurées (${configuredApis.length}/${apiConfigs.length}):`);
    configuredApis.forEach(api => {
      console.log(`   ✅ ${api.name} - ${api.description}`);
    });
  }

  if (missingApis.length > 0) {
    log.warning(`APIs manquantes (${missingApis.length}/${apiConfigs.length}):`);
    missingApis.forEach(api => {
      console.log(`   ❌ ${api.name} - ${api.description}`);
    });
  }

  // Prochaines étapes
  console.log(`\n${colors.bright}${colors.green}🚀 Prochaines étapes:${colors.reset}`);
  console.log('1. Vérifier la configuration: npm run checkenv');
  console.log('2. Configurer Supabase si pas encore fait');
  console.log('3. Démarrer l\'application: npm run dev');
  console.log('4. Tester l\'ingestion: POST /api/ingestion');
  
  if (configuredApis.length >= 2) {
    log.success('\n🎉 Vous avez suffisamment d\'APIs pour commencer !');
  } else {
    log.warning('\n💡 Configurez au moins Eventbrite et Ticketmaster pour de meilleurs résultats');
  }
}

main().catch(console.error);
