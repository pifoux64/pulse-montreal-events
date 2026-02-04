/**
 * API Route pour importer un événement Eventbrite depuis une URL
 * POST /api/events/import-eventbrite
 * 
 * Extrait les données d'un événement Eventbrite à partir de son URL
 * et retourne les données formatées pour pré-remplir le formulaire
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { normalizeUrl } from '@/lib/utils';

interface EventbriteEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  imageUrl?: string;
  ticketUrl?: string;
  price?: {
    amount?: number;
    currency?: string;
    isFree?: boolean;
  };
}

/**
 * Extrait l'ID de l'événement depuis l'URL Eventbrite
 */
function extractEventIdFromUrl(url: string): string | null {
  // Formats d'URL Eventbrite:
  // https://www.eventbrite.com/e/nom-evenement-tickets-123456789
  // https://www.eventbrite.ca/e/nom-evenement-tickets-123456789
  // https://eventbrite.com/e/nom-evenement-tickets-123456789
  const match = url.match(/tickets-(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parse les données d'un événement Eventbrite depuis le HTML
 */
function parseEventbriteHtml(html: string, eventId: string, eventUrl: string): EventbriteEventData {
  const $ = cheerio.load(html);
  const data: EventbriteEventData = {};

  // Titre - chercher dans plusieurs endroits
  const titleSelectors = [
    'h1[data-testid="event-title"]',
    'h1[class*="event-title"]',
    'h1[class*="listing-title"]',
    'meta[property="og:title"]',
    'title',
  ];
  for (const selector of titleSelectors) {
    const title = $(selector).first().text().trim() || $(selector).attr('content');
    if (title && !title.includes('Eventbrite') && title.length > 3) {
      data.title = title.replace(' | Eventbrite', '').trim();
      break;
    }
  }

  // Description - chercher dans plusieurs endroits
  const descSelectors = [
    'div[data-testid="event-description"]',
    'div[class*="event-description"]',
    'div[class*="listing-description"]',
    'meta[property="og:description"]',
    'div[data-automation="listing-event-description"]',
  ];
  for (const selector of descSelectors) {
    let desc = $(selector).first().text().trim() || $(selector).attr('content');
    // Nettoyer le HTML si présent
    if (desc) {
      desc = desc.replace(/<[^>]*>/g, '').trim();
      if (desc.length > 20) {
        data.description = desc;
        break;
      }
    }
  }

  // Image - chercher l'image de couverture
  const imageSelectors = [
    'meta[property="og:image"]',
    'img[class*="event-image"]',
    'img[class*="listing-image"]',
    'img[data-testid="event-image"]',
  ];
  for (const selector of imageSelectors) {
    const image = $(selector).attr('content') || $(selector).attr('src');
    if (image && image.startsWith('http') && !image.includes('placeholder')) {
      data.imageUrl = image;
      break;
    }
  }

  // Date - chercher dans les meta tags ou le texte
  const dateSelectors = [
    'time[datetime]',
    'div[class*="date"]',
    'span[class*="date"]',
    'div[data-testid="event-date"]',
  ];
  for (const selector of dateSelectors) {
    const datetime = $(selector).first().attr('datetime');
    if (datetime) {
      try {
        const parsedDate = new Date(datetime);
        if (!isNaN(parsedDate.getTime())) {
          data.startDate = parsedDate.toISOString();
          break;
        }
      } catch (e) {
        // Ignorer si le parsing échoue
      }
    }
  }

  // Date de fin
  const endDateSelectors = [
    'time[datetime]',
    'div[class*="end-date"]',
  ];
  // Chercher le deuxième time si présent
  const times = $('time[datetime]');
  if (times.length > 1) {
    const endDatetime = $(times[1]).attr('datetime');
    if (endDatetime) {
      try {
        const parsedDate = new Date(endDatetime);
        if (!isNaN(parsedDate.getTime())) {
          data.endDate = parsedDate.toISOString();
        }
      } catch (e) {
        // Ignorer
      }
    }
  }

  // Lieu - chercher le nom et l'adresse
  const locationSelectors = [
    'div[data-testid="event-location"]',
    'div[class*="event-location"]',
    'div[class*="venue"]',
    'div[class*="location"]',
  ];
  for (const selector of locationSelectors) {
    const locationText = $(selector).first().text().trim();
    if (locationText) {
      const lines = locationText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        data.location = {
          name: lines[0] || '',
          address: lines[1] || '',
          city: lines.find(l => l.includes('Montréal') || l.includes('Montreal')) || 'Montréal',
          postalCode: lines.find(l => /[A-Z]\d[A-Z]\s?\d[A-Z]\d/.test(l)) || '',
        };
        break;
      }
    }
  }

  // Prix - chercher dans les prix
  const priceSelectors = [
    'span[class*="price"]',
    'div[class*="ticket-price"]',
    'span[data-testid="ticket-price"]',
  ];
  for (const selector of priceSelectors) {
    const priceText = $(selector).first().text().trim();
    if (priceText) {
      // Essayer d'extraire le prix
      const priceMatch = priceText.match(/(\d+[.,]\d{2})|(\d+)/);
      if (priceMatch) {
        const priceValue = parseFloat(priceMatch[0].replace(',', '.'));
        if (!isNaN(priceValue)) {
          data.price = {
            amount: priceValue,
            currency: priceText.includes('$') || priceText.includes('CAD') ? 'CAD' : 'USD',
            isFree: priceText.toLowerCase().includes('gratuit') || priceText.toLowerCase().includes('free') || priceValue === 0,
          };
          break;
        }
      }
      // Vérifier si gratuit
      if (priceText.toLowerCase().includes('gratuit') || priceText.toLowerCase().includes('free')) {
        data.price = {
          amount: 0,
          currency: 'CAD',
          isFree: true,
        };
        break;
      }
    }
  }

  // URL de billetterie - utiliser l'URL de l'événement
  data.ticketUrl = eventUrl;

  return data;
}

/**
 * POST /api/events/import-eventbrite
 * Importe un événement Eventbrite depuis son URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL Eventbrite requise' },
        { status: 400 }
      );
    }

    // Normaliser l'URL
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json(
        { error: 'URL invalide' },
        { status: 400 }
      );
    }

    // Vérifier que c'est une URL Eventbrite
    if (!normalizedUrl.includes('eventbrite.com/e/') && !normalizedUrl.includes('eventbrite.ca/e/')) {
      return NextResponse.json(
        { error: 'URL Eventbrite invalide. Format attendu: https://www.eventbrite.com/e/... ou eventbrite.com/e/...' },
        { status: 400 }
      );
    }

    // Extraire l'ID de l'événement
    const eventId = extractEventIdFromUrl(normalizedUrl);
    if (!eventId) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire l\'ID de l\'événement depuis l\'URL' },
        { status: 400 }
      );
    }

    let eventData: EventbriteEventData = {};

    // Option 1: API Eventbrite v3 (si token disponible)
    const eventbriteToken = process.env.EVENTBRITE_TOKEN;
    if (eventbriteToken) {
      try {
        const apiUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/?expand=venue,organizer`;
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${eventbriteToken}`,
          },
        });
        
        if (response.ok) {
          const ebData = await response.json();
          
          eventData = {
            title: ebData.name?.text || ebData.name?.html?.replace(/<[^>]*>/g, ''),
            description: ebData.description?.text || ebData.description?.html?.replace(/<[^>]*>/g, ''),
            startDate: ebData.start?.utc || ebData.start?.local,
            endDate: ebData.end?.utc || ebData.end?.local,
            imageUrl: ebData.logo?.url,
            ticketUrl: ebData.url || normalizedUrl,
            location: ebData.venue ? {
              name: ebData.venue.name || '',
              address: ebData.venue.address?.address_1 || '',
              city: ebData.venue.address?.city || 'Montréal',
              postalCode: ebData.venue.address?.postal_code || '',
            } : undefined,
            price: ebData.ticket_availability?.minimum_ticket_price ? {
              amount: ebData.ticket_availability.minimum_ticket_price.value / 100, // Convertir de cents
              currency: ebData.ticket_availability.minimum_ticket_price.currency || 'CAD',
              isFree: ebData.ticket_availability.minimum_ticket_price.value === 0,
            } : undefined,
          };
        }
      } catch (error) {
        console.warn('Erreur API Eventbrite, fallback sur scraping:', error);
      }
    }

    // Option 2: Scraping HTML (fallback ou si pas de token)
    if (!eventData.title) {
      try {
        const response = await fetch(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (response.ok) {
          const html = await response.text();
          const scrapedData = parseEventbriteHtml(html, eventId, normalizedUrl);
          eventData = { ...eventData, ...scrapedData };
        }
      } catch (error) {
        console.error('Erreur lors du scraping Eventbrite:', error);
      }
    }

    // Si on n'a toujours pas de titre, retourner une erreur
    if (!eventData.title) {
      return NextResponse.json(
        { 
          error: 'Impossible de récupérer les données de l\'événement Eventbrite. Vérifiez que l\'événement est public et que l\'URL est correcte.',
          suggestion: 'Assurez-vous que l\'événement Eventbrite est public et accessible.'
        },
        { status: 404 }
      );
    }

    // Formater les données pour le formulaire
    return NextResponse.json({
      success: true,
      data: {
        title: eventData.title || '',
        description: eventData.description || '',
        startDate: eventData.startDate || '',
        endDate: eventData.endDate || '',
        location: eventData.location || {
          name: '',
          address: '',
          city: 'Montréal',
          postalCode: '',
        },
        imageUrl: eventData.imageUrl || '',
        ticketUrl: eventData.ticketUrl || normalizedUrl,
        price: eventData.price || {
          amount: 0,
          currency: 'CAD',
          isFree: true,
        },
      },
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'import Eventbrite:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de l\'import de l\'événement Eventbrite',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
