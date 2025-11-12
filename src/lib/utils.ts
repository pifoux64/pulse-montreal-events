/**
 * Utilitaires pour la déduplication et le traitement des événements
 */

/**
 * Normalise un titre en supprimant les accents et en convertissant en minuscules
 */
export function normalizeTitle(title: string): string {
  return stripAccents(title.toLowerCase().trim().replace(/\s+/g, ' '));
}

/**
 * Supprime les accents d'une chaîne de caractères
 */
export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calcule un bucket géographique arrondi à 3 décimales
 */
export function computeGeoBucket(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  return `${roundedLat.toFixed(3)},${roundedLng.toFixed(3)}`;
}

/**
 * Calcule un score de similarité entre deux événements (0-1)
 */
export function computeScore(event1: any, event2: any): number {
  let score = 0;
  let factors = 0;

  // Similarité du titre (Levenshtein normalisé)
  const title1 = normalizeTitle(event1.title || '');
  const title2 = normalizeTitle(event2.title || '');
  if (title1 && title2) {
    const titleSimilarity = 1 - (levenshteinDistance(title1, title2) / Math.max(title1.length, title2.length));
    score += titleSimilarity * 0.6; // 60% du score
    factors += 0.6;
  }

  // Similarité du lieu
  if (event1.venue && event2.venue) {
    const venue1 = normalizeTitle(event1.venue.name || '');
    const venue2 = normalizeTitle(event2.venue.name || '');
    if (venue1 && venue2) {
      const venueSimilarity = 1 - (levenshteinDistance(venue1, venue2) / Math.max(venue1.length, venue2.length));
      score += venueSimilarity * 0.3; // 30% du score
      factors += 0.3;
    }

    // Distance géographique
    if (event1.venue.lat && event1.venue.lng && event2.venue.lat && event2.venue.lng) {
      const distance = calculateDistance(
        event1.venue.lat, event1.venue.lng,
        event2.venue.lat, event2.venue.lng
      );
      const locationSimilarity = Math.max(0, 1 - (distance / 5)); // Similaire si < 5km
      score += locationSimilarity * 0.1; // 10% du score
      factors += 0.1;
    }
  }

  return factors > 0 ? score / factors : 0;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calcule la distance entre deux points géographiques (en km)
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (lat1 === lat2 && lng1 === lng2) return 0;

  const R = 6371; // Rayon de la Terre en km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Génère une clé de déduplication fuzzy
 */
export function generateFuzzyKey(event: any): string {
  const normalizedTitle = normalizeTitle(event.title || '');
  const date = new Date(event.startAt || event.date);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  let geoBucket = '';
  if (event.venue?.lat && event.venue?.lng) {
    geoBucket = computeGeoBucket(event.venue.lat, event.venue.lng);
  } else if (event.lat && event.lng) {
    geoBucket = computeGeoBucket(event.lat, event.lng);
  }

  return `${normalizedTitle}-${dateStr}-${geoBucket}`;
}

/**
 * Classe utilitaire pour la classification automatique
 */
export class EventClassifier {
  private static musicGenres = [
    'jazz', 'rock', 'pop', 'classical', 'blues', 'reggae', 'hip-hop', 'rap',
    'electronic', 'techno', 'house', 'disco', 'funk', 'soul', 'r&b',
    'country', 'folk', 'indie', 'alternative', 'punk', 'metal', 'latin',
    'world', 'afrobeat', 'salsa', 'bachata', 'merengue', 'cumbia'
  ];

  private static categories = {
    MUSIC: ['concert', 'music', 'musique', 'band', 'singer', 'dj', 'festival', 'jazz', 'rock', 'pop'],
    THEATRE: ['theatre', 'théâtre', 'play', 'drama', 'comedy', 'comédie', 'spectacle'],
    EXHIBITION: ['exhibition', 'exposition', 'art', 'gallery', 'galerie', 'museum', 'musée'],
    FAMILY: ['family', 'famille', 'children', 'enfants', 'kids', 'jeunesse'],
    SPORT: ['sport', 'hockey', 'football', 'soccer', 'basketball', 'tennis', 'match'],
    NIGHTLIFE: ['nightlife', 'club', 'bar', 'party', 'soirée', 'night'],
    EDUCATION: ['workshop', 'atelier', 'conference', 'conférence', 'seminar', 'course'],
    COMMUNITY: ['community', 'communauté', 'volunteer', 'charity', 'fundraising']
  };

  static classifyEvent(event: any): { category: string; tags: string[] } {
    const text = `${event.title || ''} ${event.description || ''}`.toLowerCase();
    const tags: string[] = [];
    let category = 'OTHER';

    // Classification par catégorie
    for (const [cat, keywords] of Object.entries(this.categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        category = cat;
        break;
      }
    }

    // Extraction des genres musicaux
    this.musicGenres.forEach(genre => {
      if (text.includes(genre)) {
        tags.push(genre);
      }
    });

    // Tags spéciaux
    if (text.includes('free') || text.includes('gratuit')) {
      tags.push('free');
    }
    if (text.includes('outdoor') || text.includes('plein air')) {
      tags.push('outdoor');
    }
    if (text.includes('18+') || text.includes('adult')) {
      tags.push('18plus');
    }
    if (text.includes('accessible') || text.includes('wheelchair')) {
      tags.push('accessible');
    }
    if (text.includes('kids') || text.includes('family')) {
      tags.push('family-friendly');
    }

    return { category, tags };
  }
}

/**
 * Formatte un prix pour l'affichage
 */
export function formatPrice(priceMin?: number, priceMax?: number, currency = 'CAD'): string {
  if (!priceMin && !priceMax) return 'Gratuit';
  if (priceMin === 0) return 'Gratuit';
  if (priceMin === priceMax) return `${priceMin} ${currency}`;
  if (priceMax) return `${priceMin} - ${priceMax} ${currency}`;
  return `À partir de ${priceMin} ${currency}`;
}

/**
 * Formatte une date pour l'affichage
 */
export function formatEventDate(date: string | Date, locale = 'fr-CA'): string {
  const eventDate = new Date(date);
  return eventDate.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Vérifie si un événement est gratuit
 * Un événement est gratuit seulement si priceMin est explicitement 0
 * Si priceMin est null/undefined, on ne sait pas, donc on considère comme payant par défaut
 */
export function isFreeEvent(event: any): boolean {
  return event.priceMin === 0 && (event.priceMax === null || event.priceMax === 0 || event.priceMax === undefined);
}

/**
 * Génère un slug URL à partir d'un titre
 */
export function slugify(text: string): string {
  return normalizeTitle(text)
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
    .trim();
}
