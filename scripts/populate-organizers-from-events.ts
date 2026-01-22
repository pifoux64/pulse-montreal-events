/**
 * Script pour créer tous les organisateurs depuis les événements existants
 * 
 * Ce script :
 * 1. Extrait tous les organisateurs uniques depuis les événements (via EventFeature ou source)
 * 2. Crée les organisateurs correspondants
 * 3. Si l'organisateur n'est pas trouvé, crée un organisateur avec le nom de la source (ex: "Ticketmaster")
 * 4. Met à jour les événements pour les relier aux organisateurs créés
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

// Mapping des sources vers des noms d'organisateurs plus lisibles
const sourceToOrganizerName: Record<string, string> = {
  TICKETMASTER: 'Ticketmaster',
  EVENTBRITE: 'Eventbrite',
  BANDSINTOWN: 'Bandsintown',
  QUARTIER_SPECTACLES: 'Quartier des Spectacles',
  TOURISME_MONTREAL: 'Tourisme Montréal',
  LAVITRINE: 'La Vitrine',
  ALLEVENTS: 'AllEvents',
  OPEN_DATA_MONTREAL: 'Données ouvertes Montréal',
  INTERNAL: 'Pulse Montréal',
};

async function main() {
  console.log('🚀 Début de la création des organisateurs depuis les événements...\n');

  try {
    // 1. Récupérer tous les événements avec leurs features et source
    const events = await prisma.event.findMany({
      include: {
        features: true,
        organizer: true, // Si déjà lié
        eventSources: {
          include: {
            source: true,
          },
        },
      },
    });

    console.log(`📊 ${events.length} événements trouvés\n`);

    // 2. Extraire les organisateurs uniques
    const organizerMap = new Map<string, {
      displayName: string;
      website?: string;
      source?: string;
    }>();

    for (const event of events) {
      // Si l'événement a déjà un organisateur, on le skip
      if (event.organizerId) {
        continue;
      }

      let organizerName: string | null = null;
      let organizerWebsite: string | undefined = undefined;
      let sourceName: string | undefined = undefined;

      // Chercher le nom de l'organisateur dans les features
      const organizerFeature = event.features.find(f => 
        f.featureKey === 'organizer' || 
        f.featureKey === 'organizerName' ||
        f.featureKey === 'organizer_name'
      );

      if (organizerFeature) {
        const organizerData = organizerFeature.featureValue as any;
        organizerName = organizerData?.name || organizerData?.displayName || organizerData?.organizerName;
        organizerWebsite = organizerData?.website || organizerData?.url;
      }

      // Si pas trouvé dans les features, utiliser la source
      if (!organizerName) {
        // Chercher dans eventSources
        const primarySource = event.eventSources.find(s => s.isPrimary);
        if (primarySource) {
          sourceName = primarySource.source?.name || primarySource.source || event.source;
        } else {
          sourceName = event.source;
        }

        // Utiliser le mapping ou le nom de la source directement
        organizerName = sourceToOrganizerName[sourceName] || sourceName || 'Organisateur inconnu';
      }

      if (organizerName) {
        const key = organizerName.toLowerCase().trim();
        
        if (!organizerMap.has(key)) {
          organizerMap.set(key, {
            displayName: organizerName,
            website: organizerWebsite,
            source: sourceName || event.source,
          });
        }
      }
    }

    console.log(`👥 ${organizerMap.size} organisateurs uniques trouvés\n`);

    // 3. Créer les organisateurs
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [key, organizerData] of organizerMap) {
      try {
        // Vérifier si l'organisateur existe déjà (par displayName)
        const existing = await prisma.organizer.findFirst({
          where: {
            displayName: {
              equals: organizerData.displayName,
              mode: 'insensitive',
            },
          },
        });

        if (existing) {
          console.log(`⏭️  Organisateur déjà existant: ${organizerData.displayName}`);
          skipped++;
          continue;
        }

        // Créer un utilisateur système pour l'organisateur
        // On crée un utilisateur avec un email système basé sur le nom
        const systemEmail = `${organizerData.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}@system.pulse-mtl.ca`;
        
        // Vérifier si l'utilisateur existe déjà
        let systemUser = await prisma.user.findUnique({
          where: { email: systemEmail },
        });

        if (!systemUser) {
          systemUser = await prisma.user.create({
            data: {
              email: systemEmail,
              name: organizerData.displayName,
              emailVerified: null, // Pas vérifié car système
            },
          });
        }

        // Créer l'organisateur
        const organizer = await prisma.organizer.create({
          data: {
            userId: systemUser.id,
            displayName: organizerData.displayName,
            website: organizerData.website || null,
            verified: false, // Les organisateurs créés automatiquement ne sont pas vérifiés
          },
        });

        console.log(`✅ Organisateur créé: ${organizer.displayName}`);
        created++;

        // 4. Mettre à jour les événements pour les relier à cet organisateur
        const eventsToUpdate = events.filter(e => {
          if (e.organizerId) return false;
          
          let eventOrganizerName: string | null = null;
          
          const organizerFeature = e.features.find(f => 
            f.featureKey === 'organizer' || 
            f.featureKey === 'organizerName' ||
            f.featureKey === 'organizer_name'
          );

          if (organizerFeature) {
            const data = organizerFeature.featureValue as any;
            eventOrganizerName = data?.name || data?.displayName || data?.organizerName;
          }

          // Si pas de nom dans les features, utiliser la source
          if (!eventOrganizerName) {
            const primarySource = e.eventSources.find(s => s.isPrimary);
            const eventSource = primarySource?.source?.name || primarySource?.source || e.source;
            eventOrganizerName = sourceToOrganizerName[eventSource] || eventSource || 'Organisateur inconnu';
          }

          return eventOrganizerName?.toLowerCase().trim() === key;
        });

        if (eventsToUpdate.length > 0) {
          await prisma.event.updateMany({
            where: {
              id: {
                in: eventsToUpdate.map(e => e.id),
              },
            },
            data: {
              organizerId: organizer.id,
            },
          });
          console.log(`   └─ ${eventsToUpdate.length} événement(s) mis à jour`);
          updated += eventsToUpdate.length;
        }

      } catch (error: any) {
        console.error(`❌ Erreur pour ${organizerData.displayName}:`, error.message);
      }
    }

    console.log(`\n✨ Terminé !`);
    console.log(`   - ${created} organisateurs créés`);
    console.log(`   - ${updated} événements mis à jour`);
    console.log(`   - ${skipped} organisateurs déjà existants`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
