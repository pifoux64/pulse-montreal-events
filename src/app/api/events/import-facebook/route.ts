/**
 * API Route pour importer un événement Facebook depuis une URL
 * POST /api/events/import-facebook
 * 
 * Extrait les données d'un événement Facebook à partir de son URL
 * et retourne les données formatées pour pré-remplir le formulaire
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { normalizeUrl } from '@/lib/utils';

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
    'h1[id*="event"]',
    'meta[property="og:title"]',
    'title',
  ];
  for (const selector of titleSelectors) {
    const title = $(selector).first().text().trim() || $(selector).attr('content');
    if (title && title !== 'Facebook' && !title.includes('Music event in')) {
      data.title = title;
      break;
    }
  }

  // Description - chercher dans plusieurs endroits, en évitant les meta tags génériques
  // D'abord chercher dans le contenu HTML réel
  const descSelectors = [
    'div[data-testid="event-permalink-details"]',
    'div[data-testid="event-permalink-description"]',
    'div[data-testid="event-permalink-event-description"]',
    'div[class*="event"] div[class*="description"]',
    'div[class*="event"] p[class*="description"]',
    'div[id*="event"] div[id*="description"]',
    'div[class*="event"] p',
    'div[class*="event"] div[dir="auto"]',
    'div[class*="event"] span[dir="auto"]',
    // Chercher dans les scripts JSON-LD
    'script[type="application/ld+json"]',
    // Meta tags en dernier recours, mais filtrer les descriptions génériques
    'meta[property="og:description"]',
  ];
  
  for (const selector of descSelectors) {
    let desc = '';
    if (selector.startsWith('meta')) {
      desc = $(selector).attr('content') || '';
    } else if (selector.includes('script')) {
      // Essayer de parser JSON-LD
      try {
        const scriptContent = $(selector).html();
        if (scriptContent) {
          const jsonLd = JSON.parse(scriptContent);
          if (jsonLd.description) {
            desc = jsonLd.description;
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing JSON
      }
    } else {
      desc = $(selector).first().text().trim();
    }
    
    // Filtrer les descriptions génériques de Facebook
    if (desc && desc.length > 20) {
      // Ignorer les descriptions génériques comme "Music event in Montreal, QC by..."
      if (
        !desc.includes('Music event in') &&
        !desc.includes('people interested') &&
        !desc.includes('people going') &&
        !desc.match(/by \w+ and \d+ others/) &&
        !desc.match(/on \w+day, \w+ \d+ \d{4}/) &&
        !desc.match(/^\d+ people/)
      ) {
        data.description = desc;
        break;
      }
    }
  }

  // Image - chercher l'image de couverture dans plusieurs endroits
  const imageSelectors = [
    // Images de couverture spécifiques
    'img[data-testid="event-cover-photo"]',
    'img[class*="cover"]',
    'img[class*="event-cover"]',
    'img[id*="cover"]',
    // Meta tags Open Graph (mais vérifier que ce n'est pas l'image par défaut)
    'meta[property="og:image"]',
    // Autres images d'événement
    'img[class*="event"]',
    'img[alt*="event"]',
    'img[alt*="cover"]',
  ];
  
  for (const selector of imageSelectors) {
    let image = '';
    if (selector.startsWith('meta')) {
      image = $(selector).attr('content') || '';
    } else {
      image = $(selector).attr('src') || $(selector).attr('data-src') || '';
    }
    
    if (image && image.startsWith('http')) {
      // Ignorer les images par défaut de Facebook (logos, icônes)
      if (
        !image.includes('facebook.com/images/') &&
        !image.includes('static.xx.fbcdn.net/rsrc.php/') &&
        !image.includes('fbstatic-a.akamaihd.net/rsrc.php/') &&
        image.includes('scontent') || image.includes('fbcdn') || image.includes('cdn')
      ) {
        data.imageUrl = image;
        break;
      }
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

    // Normaliser l'URL
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json(
        { error: 'URL invalide' },
        { status: 400 }
      );
    }

    // Vérifier que c'est une URL Facebook Events
    if (!normalizedUrl.includes('facebook.com/events/')) {
      return NextResponse.json(
        { error: 'URL Facebook Events invalide. Format attendu: https://www.facebook.com/events/... ou facebook.com/events/...' },
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
    // Essayer d'abord la version desktop, puis mobile
    if (!eventData.title || !eventData.description || !eventData.imageUrl) {
      const urlsToTry = [
        normalizedUrl, // Version desktop
        normalizedUrl.replace('www.facebook.com', 'm.facebook.com'), // Version mobile
      ];

      for (const urlToTry of urlsToTry) {
        try {
          const response = await fetch(urlToTry, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Cache-Control': 'max-age=0',
            },
            redirect: 'follow',
          });

          if (response.ok) {
            const html = await response.text();
            
            // Vérifier si Facebook a bloqué la requête (redirection vers login, etc.)
            if (html.includes('login') && html.includes('facebook.com/login')) {
              console.warn('Facebook a redirigé vers la page de connexion');
              continue;
            }
            
            // Vérifier si on a reçu du contenu valide
            if (html.length < 1000) {
              console.warn('Réponse HTML trop courte, probablement une erreur');
              continue;
            }
            
            const scrapedData = parseFacebookEventHtml(html, eventId);
            
            // Fusionner les données, en gardant les meilleures valeurs
            if (scrapedData.title && !eventData.title) eventData.title = scrapedData.title;
            if (scrapedData.description && !eventData.description) eventData.description = scrapedData.description;
            if (scrapedData.imageUrl && !eventData.imageUrl) eventData.imageUrl = scrapedData.imageUrl;
            if (scrapedData.startDate && !eventData.startDate) eventData.startDate = scrapedData.startDate;
            if (scrapedData.location && !eventData.location) eventData.location = scrapedData.location;
            if (scrapedData.ticketUrl && !eventData.ticketUrl) eventData.ticketUrl = scrapedData.ticketUrl;
            
            // Si on a trouvé les données essentielles, arrêter
            if (eventData.title && eventData.description && eventData.imageUrl) {
              break;
            }
          } else {
            console.warn(`Erreur HTTP ${response.status} pour ${urlToTry}`);
            // Si c'est une erreur 400, Facebook bloque probablement le scraping
            if (response.status === 400) {
              console.warn('Facebook bloque le scraping (HTTP 400). Utilisez l\'API Graph de Facebook pour de meilleurs résultats.');
            }
          }
        } catch (error: any) {
          console.warn(`Erreur lors du scraping Facebook (${urlToTry}):`, error.message);
        }
      }
    }

    // Si on n'a toujours pas de titre, retourner une erreur avec plus de détails
    if (!eventData.title) {
      console.error('Impossible de récupérer les données Facebook:', {
        eventId,
        normalizedUrl,
        hasToken: !!facebookToken,
        scrapedData: {
          hasTitle: !!eventData.title,
          hasDescription: !!eventData.description,
          hasImage: !!eventData.imageUrl,
        }
      });
      
      // Message d'erreur plus clair selon le cas
      let errorMessage = 'Impossible de récupérer les données de l\'événement Facebook.';
      let suggestion = '';
      
      if (!facebookToken) {
        errorMessage = 'Facebook bloque le scraping automatique. Pour importer des événements Facebook, vous devez utiliser l\'API Graph de Facebook.';
        suggestion = 'Pour activer l\'import depuis Facebook :\n1. Créez une application Facebook sur https://developers.facebook.com/\n2. Obtenez un token d\'accès\n3. Ajoutez FACEBOOK_ACCESS_TOKEN dans votre fichier .env.local\n\nSinon, vous pouvez copier manuellement les informations de l\'événement.';
      } else {
        errorMessage = 'Impossible de récupérer les données de l\'événement Facebook. Vérifiez que l\'événement est public et que l\'URL est correcte.';
        suggestion = 'Assurez-vous que l\'événement Facebook est public et accessible. Le token d\'accès peut être invalide ou expiré.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestion: suggestion,
          details: process.env.NODE_ENV === 'development' ? {
            eventId,
            url: normalizedUrl,
            hasToken: !!facebookToken,
            note: 'Facebook bloque activement le scraping HTML. L\'API Graph est la méthode recommandée.',
          } : undefined
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
