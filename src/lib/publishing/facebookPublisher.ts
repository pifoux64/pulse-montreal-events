/**
 * Facebook Publisher
 * 
 * Module pour publier des événements sur Facebook via l'API Graph
 */

import { UniversalEvent } from './universalEventSchema';
import { validateForFacebook, ValidationResult } from './validators';

export interface FacebookEventResponse {
  id: string;
  name: string;
  start_time: string;
  end_time?: string;
  place?: {
    name: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  cover?: {
    source: string;
  };
  ticket_uri?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

/**
 * Récupère les pages Facebook de l'utilisateur
 */
export async function getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur Facebook API: ${error.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  return data.data.map((page: any) => ({
    id: page.id,
    name: page.name,
    access_token: page.access_token,
  }));
}

/**
 * Publie un événement sur Facebook
 */
export async function publishEventToFacebook(
  event: UniversalEvent,
  pageId: string,
  pageAccessToken: string
): Promise<FacebookEventResponse> {
  // Valider l'événement
  const validation = validateForFacebook(event);
  if (!validation.valid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  // Préparer les données pour Facebook
  const facebookEvent: Record<string, any> = {
    name: event.title,
    description: event.longDescription || event.description,
    start_time: event.startDate.toISOString(),
  };
  
  // Date de fin (optionnelle)
  if (event.endDate) {
    facebookEvent.end_time = event.endDate.toISOString();
  }
  
  // Lieu avec coordonnées GPS
  if (event.venue.coordinates) {
    facebookEvent.place = {
      name: event.venue.name,
      location: {
        latitude: event.venue.coordinates.lat,
        longitude: event.venue.coordinates.lng,
      },
    };
  } else {
    // Si pas de coordonnées, utiliser juste le nom
    facebookEvent.place = {
      name: event.venue.name,
    };
  }
  
  // Image de couverture
  if (event.coverImageUrl) {
    facebookEvent.cover = {
      url: event.coverImageUrl,
    };
  }
  
  // Lien de billetterie
  if (event.ticketUrl) {
    facebookEvent.ticket_uri = event.ticketUrl;
  }
  
  // Publier l'événement
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/events?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facebookEvent),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur lors de la publication Facebook: ${error.error?.message || 'Unknown error'}`);
  }
  
  return await response.json();
}

/**
 * Met à jour un événement Facebook existant
 */
export async function updateFacebookEvent(
  facebookEventId: string,
  event: UniversalEvent,
  pageAccessToken: string
): Promise<FacebookEventResponse> {
  // Valider l'événement
  const validation = validateForFacebook(event);
  if (!validation.valid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  // Préparer les données de mise à jour
  const updates: Record<string, any> = {
    name: event.title,
    description: event.longDescription || event.description,
    start_time: event.startDate.toISOString(),
  };
  
  if (event.endDate) {
    updates.end_time = event.endDate.toISOString();
  }
  
  if (event.coverImageUrl) {
    updates.cover = {
      url: event.coverImageUrl,
    };
  }
  
  if (event.ticketUrl) {
    updates.ticket_uri = event.ticketUrl;
  }
  
  // Mettre à jour l'événement
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${facebookEventId}?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur lors de la mise à jour Facebook: ${error.error?.message || 'Unknown error'}`);
  }
  
  return await response.json();
}

/**
 * Supprime un événement Facebook
 */
export async function deleteFacebookEvent(
  facebookEventId: string,
  pageAccessToken: string
): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${facebookEventId}?access_token=${pageAccessToken}`,
    {
      method: 'DELETE',
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur lors de la suppression Facebook: ${error.error?.message || 'Unknown error'}`);
  }
}

/**
 * Rafraîchit un access token Facebook
 */
export async function refreshFacebookToken(
  appId: string,
  appSecret: string,
  currentToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur lors du rafraîchissement du token: ${error.error?.message || 'Unknown error'}`);
  }
  
  return await response.json();
}

