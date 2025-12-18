/**
 * Utilitaires de partage pour Pulse
 * Sprint V1: Sharing + shareable landing pages
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
  eventId?: string;
  context?: 'event' | 'top5' | 'tonight' | 'weekend';
}

/**
 * Génère le texte de partage pour un événement
 */
export function generateEventShareText(event: {
  title: string;
  venue?: { name: string } | null;
  startAt: Date;
  neighborhood?: string | null;
}): string {
  const now = new Date();
  const eventDate = new Date(event.startAt);
  const isToday = eventDate.toDateString() === now.toDateString();
  const isThisWeekend = isWeekend(eventDate) && isThisWeek(eventDate);

  const timeStr = eventDate.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Montreal',
  });

  const venueStr = event.venue?.name || event.neighborhood || 'Montréal';

  if (isToday) {
    return `Tonight: ${event.title} at ${venueStr} (${timeStr})`;
  } else if (isThisWeekend) {
    return `This weekend: ${event.title} in ${venueStr}`;
  } else {
    const dateStr = eventDate.toLocaleDateString('fr-CA', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Montreal',
    });
    return `${event.title} at ${venueStr} - ${dateStr} ${timeStr}`;
  }
}

/**
 * Vérifie si une date est un week-end
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Dimanche ou Samedi
}

/**
 * Vérifie si une date est cette semaine
 */
function isThisWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Dimanche
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Samedi
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
}

/**
 * Génère les deep links pour WhatsApp, Messenger, SMS
 */
export function generateDeepLinks(url: string, text: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''}`,
    sms: `sms:?body=${encodedText}%20${encodedUrl}`,
  };
}

/**
 * Partage via Web Share API avec fallback
 */
export async function shareWithWebAPI(data: ShareData): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    });
    return true;
  } catch (error: any) {
    // AbortError signifie que l'utilisateur a annulé, ce n'est pas une erreur
    if (error.name === 'AbortError') {
      return false;
    }
    throw error;
  }
}

/**
 * Copie le lien dans le presse-papiers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    return false;
  }
}

/**
 * Génère une URL avec paramètres UTM pour le tracking
 */
export function addUtmParams(
  url: string,
  source: 'share' | 'organizer' | 'top5',
  medium: 'social' | 'link' | 'email' = 'link',
  campaign?: string
): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set('utm_source', source);
  urlObj.searchParams.set('utm_medium', medium);
  if (campaign) {
    urlObj.searchParams.set('utm_campaign', campaign);
  }
  return urlObj.toString();
}

