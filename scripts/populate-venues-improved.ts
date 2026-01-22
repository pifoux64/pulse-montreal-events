/**
 * Script amélioré pour créer toutes les salles depuis les événements existants
 * 
 * Ce script :
 * 1. Extrait tous les lieux uniques depuis les événements (via EventFeature, EventSourceLink, ou description)
 * 2. Crée les venues correspondantes avec géocodage
 * 3. Met à jour les événements pour les relier aux venues créées
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

// Fonction pour générer un slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
    .substring(0, 100); // Limiter la longueur
}

// Fonction pour s'assurer que le slug est unique
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.venue.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Fonction pour géocoder une adresse
async function geocodeAddress(address: string, city: string, postalCode: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const query = `${address}, ${city}, ${postalCode}`;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'User-Agent': 'Pulse Montreal Events'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error(`Erreur géocodage pour ${address}:`, error);
  }
  return null;
}

// Fonction pour extraire le nom du lieu depuis la description
function extractVenueNameFromText(text: string): string | null {
  if (!text) return null;
  
  // Patterns communs pour trouver des noms de lieux
  const patterns = [
    /(?:au|à|chez|dans|à la|au)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /(?:venue|lieu|salle|bar|club|théâtre|centre|hall|arena|stadium):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /Le\s+([A-Z][a-z]+)/g,
    /La\s+([A-Z][a-z]+)/g,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Prendre le premier match et nettoyer
      let venueName = matches[0].replace(/^(?:au|à|chez|dans|à la|au|venue|lieu|salle|bar|club|théâtre|centre|hall|arena|stadium):?\s*/gi, '');
      venueName = venueName.trim();
      if (venueName.length > 2 && venueName.length < 100) {
        return venueName;
      }
    }
  }
  
  return null;
}

async function main() {
  console.log('🚀 Début de la création des salles depuis les événements...\n');

  try {
    // 1. Récupérer tous les événements avec leurs features et sources
    const events = await prisma.event.findMany({
      include: {
        features: true,
        venue: true, // Si déjà lié
        eventSources: true,
      },
    });

    console.log(`📊 ${events.length} événements trouvés\n`);

    // 2. Extraire les lieux uniques depuis les EventFeature, EventSourceLink, ou description
    const venueMap = new Map<string, {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      lat?: number;
      lon?: number;
      neighborhood?: string;
      eventIds: string[]; // Pour tracker quels événements utilisent ce lieu
    }>();

    for (const event of events) {
      // Si l'événement a déjà une venue, on la skip
      if (event.venueId) {
        continue;
      }

      let venueName: string | null = null;
      let venueData: any = null;

      // 1. Chercher dans les EventFeature
      const venueFeature = event.features.find(f => 
        f.featureKey === 'venue' || 
        f.featureKey === 'location' ||
        f.featureKey === 'venueName'
      );

      if (venueFeature) {
        venueData = venueFeature.featureValue as any;
        venueName = venueData?.name || venueData?.venueName || venueData?.locationName;
      }

      // 2. Si pas trouvé, chercher dans les métadonnées de la source
      if (!venueName) {
        const primarySource = event.eventSources.find(s => s.isPrimary);
        if (primarySource?.metadata) {
          const metadata = primarySource.metadata as any;
          venueName = metadata?.venue?.name || metadata?.location?.name;
          if (venueName && !venueData) {
            venueData = metadata?.venue || metadata?.location || {};
          }
        }
        // Aussi chercher dans sourceUrl ou externalId pour des indices
        if (!venueName && primarySource?.sourceUrl) {
          // Certaines URLs contiennent le nom du lieu
          const urlMatch = primarySource.sourceUrl.match(/\/([^/]+)\/?$/);
          if (urlMatch) {
            const potentialName = decodeURIComponent(urlMatch[1]).replace(/-/g, ' ');
            if (potentialName.length > 3 && potentialName.length < 50) {
              // Vérifier si ça ressemble à un nom de lieu
              if (/^[A-Z]/.test(potentialName) || /le |la |les /i.test(potentialName)) {
                venueName = potentialName;
              }
            }
          }
        }
      }

      // 3. Si pas trouvé, essayer d'extraire depuis la description
      if (!venueName && event.description) {
        venueName = extractVenueNameFromText(event.description);
      }

      // 4. Si pas trouvé, essayer d'extraire depuis le titre
      if (!venueName && event.title) {
        venueName = extractVenueNameFromText(event.title);
      }

      if (venueName) {
        const key = venueName.toLowerCase().trim();
        
        if (!venueMap.has(key)) {
          venueMap.set(key, {
            name: venueName,
            address: venueData?.address || venueData?.locationAddress || '',
            city: venueData?.city || venueData?.locationCity || 'Montréal',
            postalCode: venueData?.postalCode || venueData?.postal_code || venueData?.locationPostalCode || '',
            lat: venueData?.lat || venueData?.coordinates?.lat,
            lon: venueData?.lon || venueData?.coordinates?.lng || venueData?.coordinates?.lon,
            neighborhood: venueData?.neighborhood,
            eventIds: [event.id],
          });
        } else {
          // Ajouter l'événement à la liste
          venueMap.get(key)!.eventIds.push(event.id);
        }
      }
    }

    console.log(`📍 ${venueMap.size} lieux uniques trouvés\n`);

    // 3. Créer les venues
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [key, venueData] of venueMap) {
      try {
        // Vérifier si la venue existe déjà (par nom, insensible à la casse)
        const existing = await prisma.venue.findFirst({
          where: {
            name: {
              equals: venueData.name,
              mode: 'insensitive',
            },
            city: venueData.city,
          },
        });

        if (existing) {
          console.log(`⏭️  Salle déjà existante: ${venueData.name}`);
          
          // Mettre à jour les événements même si la salle existe déjà
          await prisma.event.updateMany({
            where: {
              id: {
                in: venueData.eventIds,
              },
            },
            data: {
              venueId: existing.id,
            },
          });
          updated += venueData.eventIds.length;
          skipped++;
          continue;
        }

        // Géocoder si pas de coordonnées
        let lat = venueData.lat || 45.5088; // Montréal par défaut
        let lon = venueData.lon || -73.5542;

        if (!venueData.lat || !venueData.lon) {
          const coords = await geocodeAddress(
            venueData.address || venueData.name,
            venueData.city,
            venueData.postalCode
          );
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
          }
        }

        // Générer le slug
        const baseSlug = generateSlug(venueData.name);
        const slug = await ensureUniqueSlug(baseSlug);

        // Créer la venue
        const venue = await prisma.venue.create({
          data: {
            name: venueData.name,
            slug,
            address: venueData.address || venueData.name, // Si pas d'adresse, utiliser le nom
            city: venueData.city,
            postalCode: venueData.postalCode || 'H1A 1A1', // Code postal par défaut
            lat,
            lon,
            neighborhood: venueData.neighborhood,
          },
        });

        console.log(`✅ Salle créée: ${venue.name} (${venue.slug})`);

        // Mettre à jour les événements pour les relier à cette venue
        await prisma.event.updateMany({
          where: {
            id: {
              in: venueData.eventIds,
            },
          },
          data: {
            venueId: venue.id,
          },
        });
        console.log(`   └─ ${venueData.eventIds.length} événement(s) mis à jour`);
        created++;
        updated += venueData.eventIds.length;

        // Petit délai pour éviter de surcharger l'API de géocodage
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ Erreur pour ${venueData.name}:`, error.message);
      }
    }

    console.log(`\n✨ Terminé !`);
    console.log(`   - ${created} salles créées`);
    console.log(`   - ${updated} événements mis à jour`);
    console.log(`   - ${skipped} salles déjà existantes`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
