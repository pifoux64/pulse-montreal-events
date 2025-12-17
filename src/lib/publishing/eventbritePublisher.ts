/**
 * Eventbrite Publisher
 * 
 * Module pour publier des événements sur Eventbrite via l'API v3
 */

import { UniversalEvent } from './universalEventSchema';
import { validateForEventbrite, ValidationResult } from './validators';

export interface EventbriteEventResponse {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
  };
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end?: {
    timezone: string;
    local: string;
    utc: string;
  };
  venue_id?: string;
  online_event: boolean;
  ticket_availability: {
    has_available_tickets: boolean;
    is_free: boolean;
  };
  url: string;
}

export interface EventbriteVenue {
  id: string;
  name: string;
  address: {
    address_1: string;
    city: string;
    postal_code?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface EventbriteOrganizer {
  id: string;
  name: string;
}

/**
 * Récupère l'organisateur Eventbrite de l'utilisateur
 */
export async function getEventbriteOrganizer(accessToken: string): Promise<EventbriteOrganizer> {
  const response = await fetch(
    `https://www.eventbriteapi.com/v3/users/me/?token=${accessToken}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur Eventbrite API: ${error.error_description || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  // Récupérer l'organisateur
  const orgsResponse = await fetch(
    `https://www.eventbriteapi.com/v3/users/me/organizations/?token=${accessToken}`
  );
  
  if (!orgsResponse.ok) {
    throw new Error('Impossible de récupérer les organisateurs Eventbrite');
  }
  
  const orgsData = await orgsResponse.json();
  if (!orgsData.organizations || orgsData.organizations.length === 0) {
    throw new Error('Aucun organisateur Eventbrite trouvé. Veuillez créer un organisateur sur Eventbrite.');
  }
  
  return {
    id: orgsData.organizations[0].id,
    name: orgsData.organizations[0].name,
  };
}

/**
 * Crée ou récupère un lieu Eventbrite
 */
export async function createOrGetVenue(
  event: UniversalEvent,
  organizerId: string,
  accessToken: string
): Promise<string> {
  // Chercher un lieu existant par nom et ville
  const searchResponse = await fetch(
    `https://www.eventbriteapi.com/v3/organizations/${organizerId}/venues/?token=${accessToken}`
  );
  
  if (searchResponse.ok) {
    const venuesData = await searchResponse.json();
    const existingVenue = venuesData.venues?.find((v: EventbriteVenue) => 
      v.name === event.venue.name && 
      v.address.city === event.venue.city
    );
    
    if (existingVenue) {
      return existingVenue.id;
    }
  }
  
  // Créer un nouveau lieu
  const venueData: any = {
    name: event.venue.name,
    address: {
      address_1: event.venue.address || '',
      city: event.venue.city || '',
      country: event.venue.country || 'CA',
    },
  };
  
  if (event.venue.postalCode) {
    venueData.address.postal_code = event.venue.postalCode;
  }
  
  if (event.venue.coordinates) {
    venueData.address.latitude = event.venue.coordinates.lat.toString();
    venueData.address.longitude = event.venue.coordinates.lng.toString();
  }
  
  const createResponse = await fetch(
    `https://www.eventbriteapi.com/v3/organizations/${organizerId}/venues/?token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(venueData),
    }
  );
  
  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`Erreur lors de la création du lieu Eventbrite: ${error.error_description || 'Unknown error'}`);
  }
  
  const newVenue = await createResponse.json();
  return newVenue.id;
}

/**
 * Publie un événement sur Eventbrite
 */
export async function publishEventToEventbrite(
  event: UniversalEvent,
  organizerId: string,
  accessToken: string
): Promise<EventbriteEventResponse> {
  // Valider l'événement
  const validation = validateForEventbrite(event);
  if (!validation.valid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  // Créer ou récupérer le lieu
  const venueId = await createOrGetVenue(event, organizerId, accessToken);
  
  // Préparer les données pour Eventbrite
  const eventbriteEvent: Record<string, any> = {
    event: {
      name: {
        html: event.title,
      },
      description: {
        html: event.longDescription || event.description,
      },
      start: {
        timezone: event.timezone,
        utc: event.startDate.toISOString(),
      },
      venue_id: venueId,
      online_event: false,
      ticket_availability: {
        has_available_tickets: true,
        is_free: event.isFree,
      },
      currency: event.currency || 'CAD',
    },
  };
  
  // Date de fin
  if (event.endDate) {
    eventbriteEvent.event.end = {
      timezone: event.timezone,
      utc: event.endDate.toISOString(),
    };
  }
  
  // Prix (si payant)
  if (!event.isFree && event.priceMin) {
    eventbriteEvent.event.ticket_availability.is_free = false;
    // Note: Eventbrite nécessite la création de tickets séparément via l'API tickets
    // Pour l'instant, on marque juste comme payant
  }
  
  // Publier l'événement
  const response = await fetch(
    `https://www.eventbriteapi.com/v3/organizations/${organizerId}/events/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(eventbriteEvent),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur lors de la publication Eventbrite: ${error.error_description || JSON.stringify(error)}`);
  }
  
  return await response.json();
}

/**
 * Met à jour un événement Eventbrite existant
 */
export async function updateEventbriteEvent(
  eventbriteEventId: string,
  event: UniversalEvent,
  accessToken: string
): Promise<EventbriteEventResponse> {
  // Valider l'événement
  const validation = validateForEventbrite(event);
  if (!validation.valid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  // Préparer les données de mise à jour
  const updates: Record<string, any> = {
    name: {
      html: event.title,
    },
    description: {
      html: event.longDescription || event.description,
    },
    start: {
      timezone: event.timezone,
      utc: event.startDate.toISOString(),
    },
    ticket_availability: {
      has_available_tickets: true,
      is_free: event.isFree,
    },
  };
  
  if (event.endDate) {
    updates.end = {
      timezone: event.timezone,
      utc: event.endDate.toISOString(),
    };
  }
  
  // Mettre à jour l'événement
  const response = await fetch(
    `https://www.eventbriteapi.com/v3/events/${eventbriteEventId}/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ event: updates }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur lors de la mise à jour Eventbrite: ${error.error_description || JSON.stringify(error)}`);
  }
  
  return await response.json();
}

/**
 * Supprime un événement Eventbrite
 */
export async function deleteEventbriteEvent(
  eventbriteEventId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://www.eventbriteapi.com/v3/events/${eventbriteEventId}/`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur lors de la suppression Eventbrite: ${error.error_description || JSON.stringify(error)}`);
  }
}

