/**
 * Bandsintown Publisher
 * 
 * Module pour publier des événements sur Bandsintown
 * Note: L'API Bandsintown nécessite un artist_id et une API key
 */

import { UniversalEvent } from './universalEventSchema';
import { validateForBandsintown } from './validators';

export interface BandsintownEventResponse {
  id: string;
  title: string;
  datetime: string;
  venue: {
    name: string;
    city: string;
    region: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  artists: Array<{
    name: string;
  }>;
  url: string;
}

/**
 * Publie un événement sur Bandsintown
 * 
 * Note: Bandsintown nécessite un artist_id. Si l'événement a plusieurs artistes,
 * on peut publier pour chaque artiste ou utiliser le premier artiste du lineup.
 */
export async function publishEventToBandsintown(
  event: UniversalEvent,
  artistId: string, // ID de l'artiste sur Bandsintown
  apiKey: string
): Promise<BandsintownEventResponse> {
  // Valider l'événement
  const validation = validateForBandsintown(event);
  if (!validation.valid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  if (!event.lineup || event.lineup.length === 0) {
    throw new Error('Le lineup (artistes) est requis pour Bandsintown');
  }
  
  // Préparer les données pour Bandsintown
  const bandsintownEvent: Record<string, any> = {
    event: {
      title: event.title,
      datetime: event.startDate.toISOString(),
      venue: {
        name: event.venue.name,
        city: event.venue.city || 'Montreal',
        region: 'QC',
        country: event.venue.country || 'CA',
      },
      artists: event.lineup.map(artist => ({ name: artist })),
      description: event.description,
    },
  };
  
  // Coordonnées GPS (si disponibles)
  if (event.venue.coordinates) {
    bandsintownEvent.event.venue.latitude = event.venue.coordinates.lat;
    bandsintownEvent.event.venue.longitude = event.venue.coordinates.lng;
  }
  
  // URL de billetterie
  if (event.ticketUrl) {
    bandsintownEvent.event.url = event.ticketUrl;
  }
  
  // Date de fin (si disponible)
  if (event.endDate) {
    bandsintownEvent.event.end_datetime = event.endDate.toISOString();
  }
  
  // Publier l'événement
  // Note: L'endpoint exact dépend de l'API Bandsintown disponible
  // Cette implémentation est un exemple basé sur la documentation générale
  const response = await fetch(
    `https://rest.bandsintown.com/artists/${encodeURIComponent(artistId)}/events?app_id=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bandsintownEvent),
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Erreur lors de la publication Bandsintown: ${error.message || JSON.stringify(error)}`);
  }
  
  return await response.json();
}

/**
 * Met à jour un événement Bandsintown existant
 */
export async function updateBandsintownEvent(
  eventId: string,
  event: UniversalEvent,
  artistId: string,
  apiKey: string
): Promise<BandsintownEventResponse> {
  // Valider l'événement
  const validation = validateForBandsintown(event);
  if (!validation.valid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  // Préparer les données de mise à jour
  const updates: Record<string, any> = {
    title: event.title,
    datetime: event.startDate.toISOString(),
    venue: {
      name: event.venue.name,
      city: event.venue.city || 'Montreal',
      region: 'QC',
      country: event.venue.country || 'CA',
    },
    artists: event.lineup?.map(artist => ({ name: artist })) || [],
    description: event.description,
  };
  
  if (event.venue.coordinates) {
    updates.venue.latitude = event.venue.coordinates.lat;
    updates.venue.longitude = event.venue.coordinates.lng;
  }
  
  if (event.ticketUrl) {
    updates.url = event.ticketUrl;
  }
  
  if (event.endDate) {
    updates.end_datetime = event.endDate.toISOString();
  }
  
  // Mettre à jour l'événement
  const response = await fetch(
    `https://rest.bandsintown.com/artists/${encodeURIComponent(artistId)}/events/${eventId}?app_id=${apiKey}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: updates }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Erreur lors de la mise à jour Bandsintown: ${error.message || JSON.stringify(error)}`);
  }
  
  return await response.json();
}

/**
 * Supprime un événement Bandsintown
 */
export async function deleteBandsintownEvent(
  eventId: string,
  artistId: string,
  apiKey: string
): Promise<void> {
  const response = await fetch(
    `https://rest.bandsintown.com/artists/${encodeURIComponent(artistId)}/events/${eventId}?app_id=${apiKey}`,
    {
      method: 'DELETE',
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Erreur lors de la suppression Bandsintown: ${error.message || JSON.stringify(error)}`);
  }
}

