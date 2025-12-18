/**
 * Système de tracking pour Pulse
 * Sprint V1: Instrumentation
 */

export type ShareContext = 'event' | 'top5' | 'tonight' | 'weekend';
export type ShareMethod = 'web_share' | 'whatsapp' | 'messenger' | 'sms' | 'copy' | 'facebook' | 'twitter' | 'linkedin';

export interface ShareEvent {
  context: ShareContext;
  method: ShareMethod;
  eventId?: string;
  top5Slug?: string;
  success: boolean;
  userId?: string;
}

export interface FavoriteEvent {
  eventId: string;
  action: 'add' | 'remove';
  userId?: string;
}

export interface LandingViewEvent {
  path: string;
  source?: string;
  medium?: string;
  campaign?: string;
  userId?: string;
}

/**
 * Track un clic sur partage
 */
export async function trackShareClick(
  context: ShareContext,
  eventId?: string,
  top5Slug?: string
): Promise<void> {
  try {
    await fetch('/api/analytics/share-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        eventId,
        top5Slug,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Erreur tracking share_click:', error);
    // Ne pas bloquer l'utilisateur en cas d'erreur
  }
}

/**
 * Track un partage réussi
 */
export async function trackShareSuccess(
  event: ShareEvent
): Promise<void> {
  try {
    await fetch('/api/analytics/share-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Erreur tracking share_success:', error);
  }
}

/**
 * Track l'ajout/suppression d'un favori
 */
export async function trackFavorite(event: FavoriteEvent): Promise<void> {
  try {
    await fetch('/api/analytics/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Erreur tracking favorite:', error);
  }
}

/**
 * Track une vue depuis un lien partagé
 */
export async function trackLandingView(event: LandingViewEvent): Promise<void> {
  try {
    await fetch('/api/analytics/landing-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Erreur tracking landing_view:', error);
  }
}

