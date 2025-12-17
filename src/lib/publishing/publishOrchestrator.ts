/**
 * Publication Orchestrator
 * 
 * Service centralisé pour publier un événement sur toutes les plateformes connectées
 */

import { PrismaClient } from '@prisma/client';
import { convertToUniversalEvent, UniversalEvent } from './universalEventSchema';
import { validateForAllPlatforms } from './validators';
import { publishEventToFacebook, updateFacebookEvent, getFacebookPages } from './facebookPublisher';
import { publishEventToEventbrite, updateEventbriteEvent, getEventbriteOrganizer } from './eventbritePublisher';
import { exportToRAFormat, generateRAJSON } from './residentAdvisorExporter';
import { publishEventToBandsintown } from './bandsintownPublisher';
import { Event } from '@/types';

const prisma = new PrismaClient();

export interface PublicationResult {
  platform: string;
  success: boolean;
  platformEventId?: string;
  platformEventUrl?: string;
  error?: string;
  warnings?: string[];
}

export interface PublicationSummary {
  eventId: string;
  organizerId: string;
  results: PublicationResult[];
  totalSuccess: number;
  totalErrors: number;
}

/**
 * Publie un événement sur toutes les plateformes connectées
 */
export async function publishEventEverywhere(
  eventId: string,
  organizerId: string
): Promise<PublicationSummary> {
  // Récupérer l'événement depuis la DB
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        include: {
          user: true,
        },
      },
      venue: true,
      eventTags: true,
      features: true, // SPRINT 4: Récupérer les EventFeature (longDescription, lineup)
    },
  });
  
  if (!event) {
    throw new Error(`Événement ${eventId} introuvable`);
  }
  
  if (event.organizerId !== organizerId) {
    throw new Error('Vous n\'êtes pas autorisé à publier cet événement');
  }
  
  // Récupérer les connexions de plateformes
  const connections = await prisma.platformConnection.findMany({
    where: { organizerId },
  });
  
  if (connections.length === 0) {
    throw new Error('Aucune plateforme connectée. Veuillez connecter au moins une plateforme.');
  }
  
  // Convertir en UniversalEvent
  const universalEvent: UniversalEvent = convertToUniversalEvent(
    event as unknown as Event,
    event.eventTags.map(tag => ({
      id: tag.id,
      category: tag.category as 'type' | 'genre' | 'ambiance' | 'public',
      value: tag.value,
    }))
  );
  
  // Valider pour toutes les plateformes
  const validations = validateForAllPlatforms(universalEvent);
  
  // Publier sur chaque plateforme connectée
  const results: PublicationResult[] = [];
  
  for (const connection of connections) {
    const result: PublicationResult = {
      platform: connection.platform,
      success: false,
    };
    
    try {
      // Vérifier la validation avant de publier
      const validation = validations[connection.platform as keyof typeof validations];
      if (!validation.valid) {
        result.error = `Validation échouée: ${validation.errors.join(', ')}`;
        result.warnings = validation.warnings;
        results.push(result);
        continue;
      }
      
      // Publier selon la plateforme
      switch (connection.platform) {
        case 'facebook': {
          if (!connection.accessToken) {
            throw new Error('Token d\'accès Facebook manquant');
          }
          
          // Récupérer les pages Facebook
          const pages = await getFacebookPages(connection.accessToken);
          if (pages.length === 0) {
            throw new Error('Aucune page Facebook trouvée');
          }
          
          // Utiliser la première page (ou celle stockée dans metadata)
          const pageId = (connection.metadata as any)?.selectedPageId || pages[0].id;
          const pageAccessToken = pages.find(p => p.id === pageId)?.access_token || connection.accessToken;
          
          const fbEvent = await publishEventToFacebook(universalEvent, pageId, pageAccessToken);
          
          result.success = true;
          result.platformEventId = fbEvent.id;
          result.platformEventUrl = `https://www.facebook.com/events/${fbEvent.id}`;
          break;
        }
        
        case 'eventbrite': {
          if (!connection.accessToken) {
            throw new Error('Token d\'accès Eventbrite manquant');
          }
          
          // Récupérer l'organisateur Eventbrite
          const organizer = await getEventbriteOrganizer(connection.accessToken);
          
          const ebEvent = await publishEventToEventbrite(
            universalEvent,
            organizer.id,
            connection.accessToken
          );
          
          result.success = true;
          result.platformEventId = ebEvent.id;
          result.platformEventUrl = ebEvent.url;
          break;
        }
        
        case 'resident_advisor': {
          // RA n'a pas d'API, on génère juste un fichier JSON
          const raFormat = exportToRAFormat(universalEvent);
          const raJson = generateRAJSON([universalEvent]);
          
          // Stocker le JSON dans les métadonnées du log
          result.success = true;
          result.platformEventId = 'export'; // Pas d'ID réel pour RA
          result.warnings = ['RA n\'a pas d\'API publique. Le fichier JSON a été généré pour export manuel.'];
          break;
        }
        
        case 'bandsintown': {
          if (!connection.accessToken) {
            throw new Error('Token d\'accès Bandsintown manquant');
          }
          
          // Bandsintown nécessite un artist_id
          const artistId = (connection.metadata as any)?.artistId;
          if (!artistId) {
            throw new Error('Artist ID Bandsintown manquant dans les métadonnées');
          }
          
          const bitEvent = await publishEventToBandsintown(
            universalEvent,
            artistId,
            connection.accessToken
          );
          
          result.success = true;
          result.platformEventId = bitEvent.id;
          result.platformEventUrl = bitEvent.url;
          break;
        }
        
        default:
          result.error = `Plateforme non supportée: ${connection.platform}`;
      }
    } catch (error: any) {
      result.error = error.message || 'Erreur inconnue';
    }
    
    // Enregistrer le log de publication
    await prisma.publicationLog.create({
      data: {
        eventId,
        organizerId,
        platform: connection.platform,
        status: result.success ? 'success' : 'error',
        platformEventId: result.platformEventId,
        platformEventUrl: result.platformEventUrl,
        errorMessage: result.error,
        metadata: result.warnings ? { warnings: result.warnings } : undefined,
      },
    });
    
    results.push(result);
  }
  
  return {
    eventId,
    organizerId,
    results,
    totalSuccess: results.filter(r => r.success).length,
    totalErrors: results.filter(r => !r.success).length,
  };
}

/**
 * Met à jour un événement sur toutes les plateformes où il a été publié
 */
export async function updateEventEverywhere(
  eventId: string,
  organizerId: string
): Promise<PublicationSummary> {
  // Récupérer les logs de publication précédents
  const previousPublications = await prisma.publicationLog.findMany({
    where: {
      eventId,
      organizerId,
      status: 'success',
    },
    include: {
      organizer: {
        include: {
          platformConnections: true,
        },
      },
    },
  });
  
  if (previousPublications.length === 0) {
    throw new Error('Aucune publication précédente trouvée pour cet événement');
  }
  
  // Récupérer l'événement mis à jour
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        include: {
          user: true,
        },
      },
      venue: true,
      eventTags: true,
      features: true, // SPRINT 4: Récupérer les EventFeature
    },
  });
  
  if (!event) {
    throw new Error(`Événement ${eventId} introuvable`);
  }
  
  // Extraire longDescription et lineup depuis EventFeature
  const longDescriptionFeature = event.features.find(f => f.featureKey === 'longDescription');
  const lineupFeature = event.features.find(f => f.featureKey === 'lineup');
  const longDescription = longDescriptionFeature?.featureValue as string | undefined;
  const lineup = lineupFeature?.featureValue as string[] | undefined;
  
  // Convertir en UniversalEvent
  const universalEvent: UniversalEvent = convertToUniversalEvent(
    event as unknown as Event,
    event.eventTags.map(tag => ({
      id: tag.id,
      category: tag.category as 'type' | 'genre' | 'ambiance' | 'public',
      value: tag.value,
    }))
  );
  
  // SPRINT 4: Ajouter longDescription et lineup
  if (longDescription) {
    universalEvent.longDescription = longDescription;
  }
  if (lineup && lineup.length > 0) {
    universalEvent.lineup = lineup;
  }
  
  const results: PublicationResult[] = [];
  
  for (const publication of previousPublications) {
    const connection = publication.organizer.platformConnections.find(
      c => c.platform === publication.platform
    );
    
    if (!connection) {
      continue;
    }
    
    const result: PublicationResult = {
      platform: publication.platform,
      success: false,
    };
    
    try {
      switch (publication.platform) {
        case 'facebook': {
          if (!connection.accessToken || !publication.platformEventId) {
            throw new Error('Données de connexion manquantes');
          }
          
          await updateFacebookEvent(
            publication.platformEventId,
            universalEvent,
            connection.accessToken
          );
          
          result.success = true;
          result.platformEventId = publication.platformEventId;
          break;
        }
        
        case 'eventbrite': {
          if (!connection.accessToken || !publication.platformEventId) {
            throw new Error('Données de connexion manquantes');
          }
          
          await updateEventbriteEvent(
            publication.platformEventId,
            universalEvent,
            connection.accessToken
          );
          
          result.success = true;
          result.platformEventId = publication.platformEventId;
          break;
        }
        
        default:
          result.error = `Mise à jour non supportée pour ${publication.platform}`;
      }
    } catch (error: any) {
      result.error = error.message || 'Erreur inconnue';
    }
    
    // Mettre à jour le log
    await prisma.publicationLog.update({
      where: { id: publication.id },
      data: {
        status: result.success ? 'success' : 'error',
        errorMessage: result.error,
        updatedAt: new Date(),
      },
    });
    
    results.push(result);
  }
  
  return {
    eventId,
    organizerId,
    results,
    totalSuccess: results.filter(r => r.success).length,
    totalErrors: results.filter(r => !r.success).length,
  };
}

