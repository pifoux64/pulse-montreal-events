/**
 * Universal Event Schema
 * 
 * Schéma unifié contenant tous les champs nécessaires pour publier
 * un événement sur toutes les plateformes (Facebook, Eventbrite, RA, Bandsintown)
 */

import { Event } from '@/types';

export type EventTag = {
  id: string;
  category: 'type' | 'genre' | 'ambiance' | 'public';
  value: string;
};

export interface UniversalEvent {
  // Métadonnées de base
  title: string;
  description: string;
  longDescription?: string; // Description longue pour Facebook/Eventbrite
  coverImageUrl?: string;
  
  // Dates
  startDate: Date;
  endDate?: Date;
  timezone: string;
  
  // Lieu
  venue: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Catégorisation
  category?: string;
  subCategory?: string;
  genres?: string[]; // Genres musicaux depuis EventTag
  styles?: string[]; // Styles musicaux depuis EventTag
  eventType?: string; // Type d'événement (concert, dj_set, festival, etc.)
  ambiances?: string[]; // Ambiances (salle_de_concert, warehouse, etc.)
  
  // Billetterie
  ticketUrl?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  isFree: boolean;
  
  // Restrictions
  ageRestriction?: string; // "18+", "21+", etc.
  targetAudience?: string[]; // "tout_public", "18_plus", "famille", etc.
  
  // Métadonnées spécifiques
  lineup?: string[]; // Liste d'artistes (pour RA, Bandsintown)
  tags?: string[]; // Tags musicaux détaillés (pour RA)
  
  // Métadonnées Pulse
  organizerId: string;
  organizerName?: string;
  source: string; // "INTERNAL" pour les événements créés sur Pulse
}

/**
 * Convertit un événement Pulse (Event) en UniversalEvent
 */
export function convertToUniversalEvent(event: Event, eventTags?: EventTag[]): UniversalEvent {
  // Extraire les genres et styles depuis les EventTag
  const genres: string[] = [];
  const styles: string[] = [];
  const eventTypes: string[] = [];
  const ambiances: string[] = [];
  
  if (eventTags) {
    eventTags.forEach(tag => {
      switch (tag.category) {
        case 'genre':
          genres.push(tag.value);
          break;
        case 'style':
          styles.push(tag.value);
          break;
        case 'type':
          eventTypes.push(tag.value);
          break;
        case 'ambiance':
          ambiances.push(tag.value);
          break;
      }
    });
  }
  
  return {
    title: event.title,
    description: event.description || event.shortDescription || '',
    coverImageUrl: event.imageUrl || undefined,
    startDate: event.startDate,
    endDate: event.endDate || undefined,
    timezone: 'America/Montreal', // Par défaut Montréal
    venue: {
      name: event.location.name,
      address: event.location.address,
      city: event.location.city,
      postalCode: event.location.postalCode,
      country: 'Canada',
      coordinates: event.location.coordinates ? {
        lat: event.location.coordinates.lat,
        lng: event.location.coordinates.lng,
      } : undefined,
    },
    category: event.category,
    subCategory: event.subCategory,
    genres,
    styles,
    eventType: eventTypes[0],
    ambiances,
    ticketUrl: event.ticketUrl,
    priceMin: event.price.amount > 0 ? event.price.amount * 100 : undefined, // Convertir en cents
    priceMax: event.price.amount > 0 ? event.price.amount * 100 : undefined,
    currency: event.price.currency || 'CAD',
    isFree: event.price.isFree,
    targetAudience: event.tags?.filter(tag => 
      ['tout_public', '18_plus', 'famille'].includes(tag.toLowerCase())
    ),
    organizerId: event.organizerId,
    organizerName: event.organizer?.name,
    source: event.source || 'INTERNAL',
  };
}

/**
 * Valide qu'un UniversalEvent contient tous les champs requis pour une plateforme
 */
export function validateForPlatform(
  event: UniversalEvent,
  platform: 'facebook' | 'eventbrite' | 'resident_advisor' | 'bandsintown'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Champs requis pour toutes les plateformes
  if (!event.title) errors.push('Le titre est requis');
  if (!event.description) errors.push('La description est requise');
  if (!event.startDate) errors.push('La date de début est requise');
  if (!event.venue.name) errors.push('Le nom du lieu est requis');
  
  // Validations spécifiques par plateforme
  switch (platform) {
    case 'facebook':
      if (!event.venue.coordinates) {
        errors.push('Les coordonnées GPS sont requises pour Facebook');
      }
      break;
      
    case 'eventbrite':
      if (!event.venue.address) {
        errors.push('L\'adresse complète est requise pour Eventbrite');
      }
      if (!event.venue.city) {
        errors.push('La ville est requise pour Eventbrite');
      }
      break;
      
    case 'resident_advisor':
      if (!event.lineup || event.lineup.length === 0) {
        errors.push('Le lineup (artistes) est requis pour Resident Advisor');
      }
      if (!event.genres || event.genres.length === 0) {
        errors.push('Au moins un genre musical est requis pour Resident Advisor');
      }
      break;
      
    case 'bandsintown':
      if (!event.lineup || event.lineup.length === 0) {
        errors.push('Le lineup (artistes) est requis pour Bandsintown');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

