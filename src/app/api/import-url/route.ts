/**
 * API Route pour importer les données d'un événement depuis une URL publique
 * POST /api/import-url
 * 
 * Extrait les données d'un événement à partir des meta tags Open Graph
 * Fonctionne pour n'importe quel site web (Facebook, Eventbrite, sites de salles, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { normalizeUrl } from '@/lib/utils';

interface ImportedEventData {
  title?: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  venueName?: string;
  ticketUrl?: string;
}

// Cache simple en mémoire (pourrait être remplacé par Redis en production)
const urlCache = new Map<string, { data: ImportedEventData; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Valide l'URL et protège contre SSRF
 */
function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Seulement http et https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Seules les URLs HTTP et HTTPS sont autorisées' };
    }
    
    // Bloquer les IPs privées et localhost
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname === '[::1]' ||
      hostname === '::1'
    ) {
      return { valid: false, error: 'Les URLs locales et privées ne sont pas autorisées' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'URL invalide' };
  }
}

/**
 * Parse les meta tags Open Graph et autres meta tags pertinents
 */
function parseOpenGraphTags(html: string): ImportedEventData {
  const $ = cheerio.load(html);
  const data: ImportedEventData = {};

  // Titre - Open Graph puis fallback
  data.title = 
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('title').text().trim() ||
    '';

  // Description - Open Graph puis fallback
  data.description = 
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="twitter:description"]').attr('content')?.trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    '';

  // Image - Open Graph puis fallback
  const ogImage = $('meta[property="og:image"]').attr('content');
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (ogImage) {
    data.imageUrl = ogImage.startsWith('http') ? ogImage : ogImage;
  } else if (twitterImage) {
    data.imageUrl = twitterImage.startsWith('http') ? twitterImage : twitterImage;
  }

  // Dates - Open Graph event tags puis fallback
  const startTime = 
    $('meta[property="event:start_time"]').attr('content') ||
    $('meta[property="article:published_time"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    '';
  
  if (startTime) {
    try {
      const date = new Date(startTime);
      if (!isNaN(date.getTime())) {
        data.startDate = date.toISOString();
      }
    } catch (e) {
      // Ignorer si le parsing échoue
    }
  }

  const endTime = $('meta[property="event:end_time"]').attr('content');
  if (endTime) {
    try {
      const date = new Date(endTime);
      if (!isNaN(date.getTime())) {
        data.endDate = date.toISOString();
      }
    } catch (e) {
      // Ignorer si le parsing échoue
    }
  }

  // Venue/Location - Open Graph puis fallback
  data.venueName = 
    $('meta[property="event:location"]').attr('content')?.trim() ||
    $('meta[property="og:locale"]').attr('content')?.split('_')[1] || // Ville depuis locale
    '';

  // Ticket URL - chercher les liens de billetterie
  const ticketSelectors = [
    'a[href*="ticket"]',
    'a[href*="billet"]',
    'a[href*="eventbrite"]',
    'a[href*="ticketmaster"]',
    'a[href*="lepointdevente"]',
  ];
  
  for (const selector of ticketSelectors) {
    const href = $(selector).first().attr('href');
    if (href && href.startsWith('http')) {
      data.ticketUrl = href;
      break;
    }
  }

  return data;
}

/**
 * POST /api/import-url
 * Importe les données d'un événement depuis une URL publique
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'URL requise',
          suggestion: 'Veuillez fournir une URL valide.',
        },
        { status: 400 }
      );
    }

    // Normaliser l'URL
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json(
        { 
          success: false,
          error: 'URL invalide',
          suggestion: 'Vérifiez que l\'URL est correctement formatée (ex: https://example.com/event).',
        },
        { status: 400 }
      );
    }

    // Valider l'URL (protection SSRF)
    const validation = validateUrl(normalizedUrl);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error || 'URL non autorisée',
          suggestion: 'Seules les URLs publiques HTTP/HTTPS sont autorisées.',
        },
        { status: 400 }
      );
    }

    // Vérifier le cache
    const cached = urlCache.get(normalizedUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    // Fetch HTML avec timeout court
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Si c'est une erreur 403/404, retourner un message clair
        if (response.status === 403 || response.status === 404) {
          return NextResponse.json({
            success: false,
            error: 'Ce site ne permet pas l\'import automatique. Veuillez copier manuellement les informations.',
            suggestion: 'Vous pouvez copier le titre, la description et télécharger l\'image manuellement.',
          }, { status: 200 }); // Retourner 200 pour que le client puisse gérer l'erreur gracieusement
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: `Erreur HTTP ${response.status} lors de la récupération de la page`,
            suggestion: 'Vérifiez que l\'URL est accessible et publique.',
          },
          { status: 200 } // Retourner 200 pour que le client puisse gérer l'erreur gracieusement
        );
      }

      html = await response.text();
    } catch (error: any) {
      // Timeout ou erreur réseau
      if (error.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Timeout lors de la récupération de la page',
          suggestion: 'Le site prend trop de temps à répondre. Veuillez copier manuellement les informations.',
        }, { status: 200 }); // Retourner 200 pour que le client puisse gérer l'erreur gracieusement
      }

      return NextResponse.json({
        success: false,
        error: 'Impossible de récupérer la page',
        suggestion: 'Vérifiez que l\'URL est correcte et accessible. Certains sites bloquent les requêtes automatiques.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }, { status: 200 }); // Retourner 200 pour que le client puisse gérer l'erreur gracieusement
    }

    // Parser les meta tags Open Graph
    const importedData = parseOpenGraphTags(html);
    
    // Ajouter l'URL originale comme ticketUrl si pas trouvé
    if (!importedData.ticketUrl) {
      importedData.ticketUrl = normalizedUrl;
    }

    // Si on n'a aucune donnée utile, retourner une erreur
    if (!importedData.title && !importedData.description && !importedData.imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Aucune donnée d\'événement trouvée sur cette page',
        suggestion: 'Cette page ne contient pas de meta tags Open Graph pour les événements. Veuillez copier manuellement les informations.',
      }, { status: 200 }); // Retourner 200 pour que le client puisse gérer l'erreur gracieusement
    }

    // Mettre en cache
    urlCache.set(normalizedUrl, {
      data: importedData,
      timestamp: Date.now(),
    });

    // Nettoyer le cache ancien (garder seulement les 100 dernières entrées)
    if (urlCache.size > 100) {
      const entries = Array.from(urlCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const toKeep = entries.slice(0, 100);
      urlCache.clear();
      toKeep.forEach(([key, value]) => urlCache.set(key, value));
    }

    return NextResponse.json({
      success: true,
      data: importedData,
      cached: false,
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'import URL:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur lors de l\'import de l\'URL',
        suggestion: 'Vérifiez que l\'URL est correcte et accessible. Certains sites bloquent les requêtes automatiques.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 200 } // Retourner 200 pour que le client puisse gérer l'erreur gracieusement
    );
  }
}
