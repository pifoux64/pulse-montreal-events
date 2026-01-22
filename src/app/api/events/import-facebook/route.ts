/**
 * API Route pour importer un événement Facebook depuis une URL
 * POST /api/events/import-facebook
 * 
 * Extrait les données d'un événement Facebook à partir de son URL
 * et retourne les données formatées pour pré-remplir le formulaire
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface FacebookEventData {
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
 * Extrait l'ID de l'événement depuis l'URL Facebook
 */
function extractEventIdFromUrl(url: string): string | null {
  // Formats d'URL Facebook Events:
  // https://www.facebook.com/events/123456789/
  // https://www.facebook.com/events/123456789/123456789/
  // https://m.facebook.com/events/123456789/
  const match = url.match(/\/events\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parse les données d'un événement Facebook depuis le HTML
 */
function parseFacebookEventHtml(html: string, eventId: string): FacebookEventData {
  const $ = cheerio.load(html);
  const data: FacebookEventData = {};

  // Titre - chercher dans plusieurs endroits possibles
  const titleSelectors = [
    'h1[data-testid="event-permalink-event-name"]',
    'h1[class*="event"]',
    'meta[property="og:title"]',
    'title',
  ];
  for (const selector of titleSelectors) {
    const title = $(selector).first().text().trim() || $(selector).attr('content');
    if (title && title !== 'Facebook') {
      data.title = title;
      break;
    }
  }

  // Description - chercher dans plusieurs endroits
  const descSelectors = [
    'div[data-testid="event-permalink-details"]',
    'div[class*="event"] p',
    'meta[property="og:description"]',
  ];
  for (const selector of descSelectors) {
    const desc = $(selector).first().text().trim() || $(selector).attr('content');
    if (desc && desc.length > 20) {
      data.description = desc;
      break;
    }
  }

  // Image - chercher l'image de couverture
  const imageSelectors = [
    'meta[property="og:image"]',
    'img[class*="cover"]',
    'img[class*="event"]',
  ];
  for (const selector of imageSelectors) {
    const image = $(selector).attr('content') || $(selector).attr('src');
    if (image && image.startsWith('http')) {
      data.imageUrl = image;
      break;
    }
  }

  // Date - chercher dans les meta tags ou le texte
  const dateText = $('div[class*="date"]').first().text() || 
                   $('span[class*="date"]').first().text() ||
                   $('time').first().attr('datetime');
  if (dateText) {
    // Essayer de parser la date
    try {
      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate.getTime())) {
        data.startDate = parsedDate.toISOString();
      }
    } catch (e) {
      // Ignorer si le parsing échoue
    }
  }

  // Lieu - chercher le nom et l'adresse
  const locationText = $('div[class*="location"]').first().text() ||
                       $('span[class*="venue"]').first().text() ||
                       $('div[class*="place"]').first().text();
  if (locationText) {
    // Essayer d'extraire le nom et l'adresse
    const lines = locationText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      data.location = {
        name: lines[0],
        address: lines[1] || '',
        city: 'Montréal', // Par défaut
      };
    }
  }

  // URL de billetterie - chercher les liens
  $('a[href*="ticket"], a[href*="billet"], a[href*="eventbrite"], a[href*="ticketmaster"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('http')) {
      data.ticketUrl = href;
      return false; // Arrêter après le premier
    }
  });

  return data;
}

/**
 * POST /api/events/import-facebook
 * Importe un événement Facebook depuis son URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL Facebook requise' },
        { status: 400 }
      );
    }

    // Vérifier que c'est une URL Facebook Events
    if (!url.includes('facebook.com/events/')) {
      return NextResponse.json(
        { error: 'URL Facebook Events invalide. Format attendu: https://www.facebook.com/events/...' },
        { status: 400 }
      );
    }

    // Extraire l'ID de l'événement
    const eventId = extractEventIdFromUrl(url);
    if (!eventId) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire l\'ID de l\'événement depuis l\'URL' },
        { status: 400 }
      );
    }

    // Essayer d'abord avec l'API Graph de Facebook si on a un token
    // Sinon, faire du scraping HTML
    let eventData: FacebookEventData = {};

    // Option 1: API Graph (si token disponible)
    const facebookToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (facebookToken) {
      try {
        const graphUrl = `https://graph.facebook.com/v18.0/${eventId}?fields=name,description,start_time,end_time,place,cover,ticket_uri&access_token=${facebookToken}`;
        const response = await fetch(graphUrl);
        
        if (response.ok) {
          const fbData = await response.json();
          
          eventData = {
            title: fbData.name,
            description: fbData.description,
            startDate: fbData.start_time,
            endDate: fbData.end_time,
            imageUrl: fbData.cover?.source,
            ticketUrl: fbData.ticket_uri,
            location: fbData.place ? {
              name: fbData.place.name,
              address: fbData.place.location?.street || '',
              city: fbData.place.location?.city || 'Montréal',
              postalCode: fbData.place.location?.zip || '',
            } : undefined,
          };
        }
      } catch (error) {
        console.warn('Erreur API Graph Facebook, fallback sur scraping:', error);
      }
    }

    // Option 2: Scraping HTML (fallback ou si pas de token)
    if (!eventData.title) {
      try {
        // Utiliser la version mobile pour un HTML plus simple
        const mobileUrl = url.replace('www.facebook.com', 'm.facebook.com');
        const response = await fetch(mobileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          },
        });

        if (response.ok) {
          const html = await response.text();
          const scrapedData = parseFacebookEventHtml(html, eventId);
          eventData = { ...eventData, ...scrapedData };
        }
      } catch (error) {
        console.error('Erreur lors du scraping Facebook:', error);
      }
    }

    // Si on n'a toujours pas de titre, retourner une erreur
    if (!eventData.title) {
      return NextResponse.json(
        { 
          error: 'Impossible de récupérer les données de l\'événement Facebook. Vérifiez que l\'événement est public et que l\'URL est correcte.',
          suggestion: 'Assurez-vous que l\'événement Facebook est public et accessible sans connexion.'
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
        ticketUrl: eventData.ticketUrl || '',
        price: eventData.price || {
          amount: 0,
          currency: 'CAD',
          isFree: true,
        },
      },
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'import Facebook:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de l\'import de l\'événement Facebook',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
