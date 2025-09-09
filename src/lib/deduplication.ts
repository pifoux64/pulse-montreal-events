/**
 * Système de déduplication d'événements pour Pulse
 * Utilise une stratégie fuzzy basée sur le titre, la date et la géolocalisation
 */

/**
 * Normalise un titre en supprimant les accents et caractères spéciaux
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim();
}

/**
 * Supprime les accents d'une chaîne
 */
export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calcule un bucket géographique arrondi à 3 décimales
 */
export function computeGeoBucket(lat: number, lon: number): string {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLon = Math.round(lon * 1000) / 1000;
  return `${roundedLat},${roundedLon}`;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calcule la similarité entre deux chaînes (0-1, 1 = identique)
 */
export function stringSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calcule la distance géographique entre deux points en kilomètres
 */
export function calculateGeoDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Interface pour un événement à déduplication
 */
export interface DeduplicationEvent {
  id: string;
  title: string;
  startAt: Date;
  venue?: {
    lat: number;
    lon: number;
    name: string;
  } | null;
  source: string;
  sourceId?: string | null;
}

/**
 * Génère une clé de déduplication fuzzy
 */
export function generateFuzzyKey(event: DeduplicationEvent): string {
  const normalizedTitle = normalizeTitle(event.title);
  const dateKey = event.startAt.toISOString().split('T')[0]; // YYYY-MM-DD
  
  let geoKey = 'unknown';
  if (event.venue) {
    geoKey = computeGeoBucket(event.venue.lat, event.venue.lon);
  }
  
  return `${normalizedTitle}|${dateKey}|${geoKey}`;
}

/**
 * Calcule un score de similarité entre deux événements
 */
export function computeSimilarityScore(
  event1: DeduplicationEvent,
  event2: DeduplicationEvent
): number {
  let score = 0;
  let maxScore = 0;

  // Similarité des titres (poids: 40%)
  const titleSimilarity = stringSimilarity(
    normalizeTitle(event1.title),
    normalizeTitle(event2.title)
  );
  score += titleSimilarity * 0.4;
  maxScore += 0.4;

  // Similarité des dates (poids: 30%)
  const timeDiff = Math.abs(event1.startAt.getTime() - event2.startAt.getTime());
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  const dateSimilarity = Math.max(0, 1 - hoursDiff / 24); // Décroît sur 24h
  score += dateSimilarity * 0.3;
  maxScore += 0.3;

  // Similarité des lieux (poids: 30%)
  if (event1.venue && event2.venue) {
    const distance = calculateGeoDistance(
      event1.venue.lat,
      event1.venue.lon,
      event2.venue.lat,
      event2.venue.lon
    );
    
    // Similarité géographique (décroît jusqu'à 5km)
    const geoSimilarity = Math.max(0, 1 - distance / 5);
    
    // Similarité des noms de lieux
    const venueSimilarity = stringSimilarity(
      normalizeTitle(event1.venue.name),
      normalizeTitle(event2.venue.name)
    );
    
    const locationScore = Math.max(geoSimilarity, venueSimilarity);
    score += locationScore * 0.3;
    maxScore += 0.3;
  } else if (!event1.venue && !event2.venue) {
    // Pas de lieu pour les deux = similarité parfaite
    score += 0.3;
    maxScore += 0.3;
  }
  // Si un seul a un lieu, pas de score (pénalité)

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Trouve les doublons potentiels pour un événement
 */
export async function findPotentialDuplicates(
  event: DeduplicationEvent,
  existingEvents: DeduplicationEvent[],
  threshold: number = 0.82
): Promise<Array<{ event: DeduplicationEvent; score: number }>> {
  const fuzzyKey = generateFuzzyKey(event);
  
  // Première passe: filtrer par clé fuzzy similaire
  const candidates = existingEvents.filter(existing => {
    if (existing.id === event.id) return false;
    
    const existingKey = generateFuzzyKey(existing);
    
    // Comparer les parties de la clé
    const [title1, date1, geo1] = fuzzyKey.split('|');
    const [title2, date2, geo2] = existingKey.split('|');
    
    // Même jour et même zone géographique
    return date1 === date2 && (geo1 === geo2 || geo1 === 'unknown' || geo2 === 'unknown');
  });

  // Deuxième passe: calcul du score détaillé
  const duplicates = candidates
    .map(candidate => ({
      event: candidate,
      score: computeSimilarityScore(event, candidate),
    }))
    .filter(result => result.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return duplicates;
}

/**
 * Stratégie de résolution des doublons
 */
export function resolveDuplicate(
  newEvent: DeduplicationEvent,
  existingEvent: DeduplicationEvent
): 'keep_existing' | 'replace' | 'merge' {
  // Priorité aux sources internes
  if (newEvent.source === 'INTERNAL' && existingEvent.source !== 'INTERNAL') {
    return 'replace';
  }
  
  if (existingEvent.source === 'INTERNAL' && newEvent.source !== 'INTERNAL') {
    return 'keep_existing';
  }

  // Priorité aux événements les plus récents (mise à jour)
  if (newEvent.source === existingEvent.source) {
    return 'replace'; // Mise à jour de la même source
  }

  // Par défaut, garder l'existant
  return 'keep_existing';
}

/**
 * Nettoie et normalise les données d'un événement importé
 */
export function cleanEventData(rawEvent: any): Partial<DeduplicationEvent> {
  return {
    title: rawEvent.title?.trim() || '',
    startAt: new Date(rawEvent.startAt || rawEvent.start_date),
    venue: rawEvent.venue ? {
      lat: parseFloat(rawEvent.venue.lat || rawEvent.venue.latitude || 0),
      lon: parseFloat(rawEvent.venue.lon || rawEvent.venue.longitude || 0),
      name: rawEvent.venue.name?.trim() || '',
    } : null,
  };
}
