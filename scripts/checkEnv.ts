#!/usr/bin/env tsx
/**
 * Script de vérification des variables d'environnement pour Pulse
 * Vérifie que toutes les clés nécessaires sont présentes
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const path = join(process.cwd(), file);
  if (existsSync(path)) {
    config({ path });
    console.log(`✅ Chargé: ${file}`);
    break;
  }
}

// Variables requises par catégorie
const requiredVars = {
  'Base de données': [
    'DATABASE_URL',
  ],
  'NextAuth': [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ],
  'Supabase': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
};

const optionalVars = {
  'OAuth Providers': [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ],
  'APIs externes': [
    'EVENTBRITE_TOKEN',
    'TICKETMASTER_API_KEY',
    'MEETUP_TOKEN',
    'BANDSINTOWN_APP_ID',
    'SEATGEEK_CLIENT_ID',
  ],
  'Services optionnels': [
    'SENTRY_DSN',
    'UPLOADTHING_SECRET',
    'OPENAI_API_KEY',
    'STRIPE_PUBLIC_KEY',
    'STRIPE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
};

let hasErrors = false;
let warnings = 0;

console.log('\n🔍 Vérification des variables d\'environnement Pulse\n');

// Vérifier les variables requises
for (const [category, vars] of Object.entries(requiredVars)) {
  console.log(`\n📋 ${category}:`);
  
  for (const varName of vars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`  ❌ ${varName} - MANQUANT (requis)`);
      hasErrors = true;
    } else {
      // Masquer les valeurs sensibles
      const displayValue = value.length > 20 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : '***';
      console.log(`  ✅ ${varName} - ${displayValue}`);
    }
  }
}

// Vérifier les variables optionnelles
for (const [category, vars] of Object.entries(optionalVars)) {
  console.log(`\n📋 ${category} (optionnel):`);
  
  for (const varName of vars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`  ⚠️  ${varName} - non configuré`);
      warnings++;
    } else {
      const displayValue = value.length > 20 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : '***';
      console.log(`  ✅ ${varName} - ${displayValue}`);
    }
  }
}

// Vérifications spécifiques
console.log('\n🔧 Vérifications spécifiques:');

// Vérifier la structure de DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    console.log('  ✅ DATABASE_URL - Format PostgreSQL valide');
  } else {
    console.log('  ❌ DATABASE_URL - Format PostgreSQL invalide');
    hasErrors = true;
  }
} else {
  console.log('  ❌ DATABASE_URL - Manquant');
  hasErrors = true;
}

// Vérifier NEXTAUTH_URL
const authUrl = process.env.NEXTAUTH_URL;
if (authUrl) {
  try {
    new URL(authUrl);
    console.log('  ✅ NEXTAUTH_URL - URL valide');
  } catch {
    console.log('  ❌ NEXTAUTH_URL - URL invalide');
    hasErrors = true;
  }
}

// Résumé
console.log('\n📊 Résumé:');
if (hasErrors) {
  console.log('  ❌ Des variables requises sont manquantes');
  console.log('  💡 Copiez .env.example vers .env.local et configurez les valeurs');
  process.exit(1);
} else {
  console.log('  ✅ Toutes les variables requises sont présentes');
  if (warnings > 0) {
    console.log(`  ⚠️  ${warnings} variable(s) optionnelle(s) non configurée(s)`);
    console.log('  💡 Configurez-les pour activer toutes les fonctionnalités');
  }
  console.log('\n🚀 Prêt à démarrer Pulse !');
}
