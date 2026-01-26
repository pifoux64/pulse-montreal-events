/**
 * Script pour ajouter une URL YouTube à un événement
 * Usage: npx tsx scripts/add-youtube-url-to-event.ts <eventId> <youtubeUrl>
 * 
 * Exemple:
 * npx tsx scripts/add-youtube-url-to-event.ts 1a7051f4-997e-40a7-a711-ff1c60bd8bd3 "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eventId = process.argv[2];
  const youtubeUrl = process.argv[3];

  if (!eventId || !youtubeUrl) {
    console.error('Usage: npx tsx scripts/add-youtube-url-to-event.ts <eventId> <youtubeUrl>');
    console.error('Exemple: npx tsx scripts/add-youtube-url-to-event.ts 1a7051f4-997e-40a7-a711-ff1c60bd8bd3 "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    process.exit(1);
  }

  // Vérifier que l'événement existe
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    console.error(`❌ Événement avec l'ID ${eventId} non trouvé`);
    process.exit(1);
  }

  console.log(`✅ Événement trouvé: ${event.title}`);

  // Vérifier si l'URL YouTube existe déjà
  const existingFeature = await prisma.eventFeature.findUnique({
    where: {
      unique_event_feature: {
        eventId,
        featureKey: 'youtubeUrl',
      },
    },
  });

  if (existingFeature) {
    // Mettre à jour l'URL existante
    await prisma.eventFeature.update({
      where: {
        unique_event_feature: {
          eventId,
          featureKey: 'youtubeUrl',
        },
      },
      data: {
        featureValue: youtubeUrl,
      },
    });
    console.log(`✅ URL YouTube mise à jour: ${youtubeUrl}`);
  } else {
    // Créer une nouvelle feature
    await prisma.eventFeature.create({
      data: {
        eventId,
        featureKey: 'youtubeUrl',
        featureValue: youtubeUrl,
      },
    });
    console.log(`✅ URL YouTube ajoutée: ${youtubeUrl}`);
  }

  console.log('\n🎉 Terminé! Rechargez la page de l\'événement pour voir le bloc "Listen before you go".');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
