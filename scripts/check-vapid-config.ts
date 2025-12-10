/**
 * Script de vérification de la configuration VAPID pour les notifications push
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env.local ou .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_APP_URL || 'mailto:support@pulse.local';

console.log('🔍 Vérification de la configuration VAPID...\n');

const checks = {
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY': {
    present: Boolean(VAPID_PUBLIC_KEY),
    value: VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 20)}...` : '❌ Manquante',
    length: VAPID_PUBLIC_KEY?.length || 0,
  },
  'VAPID_PRIVATE_KEY': {
    present: Boolean(VAPID_PRIVATE_KEY),
    value: VAPID_PRIVATE_KEY ? `${VAPID_PRIVATE_KEY.substring(0, 20)}...` : '❌ Manquante',
    length: VAPID_PRIVATE_KEY?.length || 0,
  },
  'VAPID_SUBJECT': {
    present: Boolean(VAPID_SUBJECT),
    value: VAPID_SUBJECT || '❌ Manquante',
  },
};

let allValid = true;

for (const [key, check] of Object.entries(checks)) {
  const status = check.present ? '✅' : '❌';
  console.log(`${status} ${key}`);
  console.log(`   Valeur: ${check.value}`);
  if ('length' in check) {
    console.log(`   Longueur: ${check.length} caractères`);
  }
  console.log();
  
  if (!check.present) {
    allValid = false;
  }
}

if (allValid) {
  console.log('✅ Configuration VAPID complète ! Les notifications push sont prêtes.');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Redémarrer le serveur Next.js (npm run dev)');
  console.log('   2. Tester les notifications sur /notifications');
  console.log('   3. Vérifier que le service worker est enregistré');
} else {
  console.log('❌ Configuration VAPID incomplète.');
  console.log('\n📝 Pour générer les clés VAPID:');
  console.log('   npm install -g web-push');
  console.log('   web-push generate-vapid-keys');
  console.log('\n📝 Ajoutez-les dans .env.local:');
  console.log('   NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre_cle_publique');
  console.log('   VAPID_PRIVATE_KEY=votre_cle_privee');
  console.log('   VAPID_SUBJECT=mailto:support@pulse-montreal.com');
  process.exit(1);
}

