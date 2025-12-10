/**
 * Script pour nettoyer les souscriptions push expirées
 * 
 * Les souscriptions peuvent expirer si :
 * - L'utilisateur désinstalle l'application
 * - Le navigateur supprime la souscription
 * - La souscription devient invalide
 * 
 * Ce script tente d'envoyer une notification de test et supprime
 * les souscriptions qui retournent une erreur 410 (Gone) ou 404 (Not Found)
 */

import { prisma } from '../src/lib/prisma';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@pulse-montreal.com';

async function cleanupExpiredSubscriptions() {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('❌ Configuration VAPID manquante');
      console.error('   Définissez NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY et VAPID_SUBJECT');
      process.exit(1);
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    console.log('🔍 Recherche des souscriptions push...');

    const subscriptions = await prisma.notificationSubscription.findMany({
      select: {
        id: true,
        userId: true,
        endpoint: true,
        authKey: true,
        p256dhKey: true,
      },
    });

    if (subscriptions.length === 0) {
      console.log('✅ Aucune souscription trouvée');
      return;
    }

    console.log(`📊 ${subscriptions.length} souscription(s) trouvée(s)`);

    const expiredSubscriptions: string[] = [];
    const invalidSubscriptions: string[] = [];
    let validCount = 0;

    for (const subscription of subscriptions) {
      try {
        // Envoyer une notification de test (silencieuse)
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.authKey ?? undefined,
              p256dh: subscription.p256dhKey ?? undefined,
            },
          },
          JSON.stringify({
            title: 'Test',
            body: 'Test de validité',
            silent: true,
          })
        );

        validCount++;
      } catch (error: any) {
        // Erreur 410 = Gone (souscription expirée)
        if (error.statusCode === 410) {
          expiredSubscriptions.push(subscription.id);
          console.log(`⚠️  Souscription expirée: ${subscription.id.substring(0, 8)}...`);
        }
        // Erreur 404 = Not Found (souscription invalide)
        else if (error.statusCode === 404) {
          invalidSubscriptions.push(subscription.id);
          console.log(`❌ Souscription invalide: ${subscription.id.substring(0, 8)}...`);
        }
        // Autres erreurs (ne pas supprimer)
        else {
          console.warn(`⚠️  Erreur pour souscription ${subscription.id.substring(0, 8)}...:`, error.statusCode || error.message);
        }
      }
    }

    // Supprimer les souscriptions expirées et invalides
    const toDelete = [...expiredSubscriptions, ...invalidSubscriptions];

    if (toDelete.length > 0) {
      const result = await prisma.notificationSubscription.deleteMany({
        where: {
          id: { in: toDelete },
        },
      });

      console.log(`\n✅ ${result.count} souscription(s) supprimée(s)`);
      console.log(`   - Expirées: ${expiredSubscriptions.length}`);
      console.log(`   - Invalides: ${invalidSubscriptions.length}`);
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   - Valides: ${validCount}`);
    console.log(`   - Expirées: ${expiredSubscriptions.length}`);
    console.log(`   - Invalides: ${invalidSubscriptions.length}`);
    console.log(`   - Total: ${subscriptions.length}`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupExpiredSubscriptions();

