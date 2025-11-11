/**
 * Système avancé de classification musicale pour Pulse Montreal
 * Détection automatique des genres et styles musicaux
 */

// Dictionnaire des genres musicaux avec leurs variantes
export const MUSIC_GENRES = {
  // Rock & Metal
  rock: ['rock', 'rock and roll', 'classic rock', 'indie rock', 'alternative rock', 'progressive rock'],
  metal: ['metal', 'heavy metal', 'death metal', 'black metal', 'metalcore', 'thrash metal'],
  punk: ['punk', 'punk rock', 'hardcore punk', 'pop punk', 'post-punk'],
  
  // Electronic & Dance
  electronic: ['electronic', 'edm', 'techno', 'house', 'trance', 'dubstep', 'ambient', 'nightlife'],
  techno: ['techno', 'minimal techno', 'detroit techno', 'acid techno', 'drumcode', 'afterlife', 'industrial techno'],
  house: ['house', 'deep house', 'tech house', 'progressive house', 'electro house', 'diynamic', 'innervisions'],
  dubstep: ['dubstep', 'brostep', 'melodic dubstep'],
  
  // Hip-Hop & R&B
  hiphop: ['hip-hop', 'hip hop', 'rap', 'trap', 'drill', 'boom bap', 'conscious rap'],
  rnb: ['r&b', 'rnb', 'soul', 'neo-soul', 'contemporary r&b'],
  
  // Pop & Mainstream
  pop: ['pop', 'pop music', 'mainstream pop', 'electropop', 'synthpop', 'indie pop'],
  
  // Jazz & Blues
  jazz: ['jazz', 'smooth jazz', 'bebop', 'swing', 'fusion', 'free jazz', 'contemporary jazz'],
  blues: ['blues', 'electric blues', 'chicago blues', 'delta blues', 'rhythm and blues'],
  
  // World & Folk
  reggae: ['reggae', 'ska', 'dancehall', 'dub', 'roots reggae'],
  latin: ['latin', 'salsa', 'bachata', 'merengue', 'reggaeton', 'latin pop'],
  folk: ['folk', 'indie folk', 'folk rock', 'acoustic', 'singer-songwriter'],
  country: ['country', 'country rock', 'bluegrass', 'americana'],
  
  // Classical & Orchestral
  classical: ['classical', 'orchestra', 'symphony', 'chamber music', 'opera', 'baroque'],
  
  // Alternative & Indie
  alternative: ['alternative', 'alt-rock', 'grunge', 'shoegaze', 'post-rock'],
  indie: ['indie', 'independent', 'lo-fi', 'bedroom pop'],
  
  // Funk & Disco
  funk: ['funk', 'p-funk', 'funk rock', 'neo-funk'],
  disco: ['disco', 'nu-disco', 'disco house'],
  
  // Experimental & Avant-garde
  experimental: ['experimental', 'avant-garde', 'noise', 'industrial', 'drone'],
};

// Émojis pour les genres musicaux
export const GENRE_EMOJIS = {
  rock: '🎸',
  metal: '🤘',
  punk: '💀',
  electronic: '🎛️',
  techno: '🔊',
  house: '🏠',
  dubstep: '🎵',
  hiphop: '🎤',
  rnb: '🎶',
  pop: '⭐',
  jazz: '🎺',
  blues: '🎼',
  reggae: '🌴',
  latin: '💃',
  folk: '🪕',
  country: '🤠',
  classical: '🎻',
  alternative: '🎧',
  indie: '🎨',
  funk: '🕺',
  disco: '✨',
  experimental: '🔬',
};

// Couleurs pour les genres musicaux
export const GENRE_COLORS = {
  rock: '#e74c3c',      // Rouge
  metal: '#2c3e50',     // Noir
  punk: '#0f766e',      // Teal profond
  electronic: '#3498db', // Bleu
  techno: '#1abc9c',    // Turquoise
  house: '#f39c12',     // Orange
  dubstep: '#0ea5e9',   // Bleu ciel
  hiphop: '#34495e',    // Gris foncé
  rnb: '#e67e22',       // Orange foncé
  pop: '#f59e0b',       // Ambre
  jazz: '#795548',      // Marron
  blues: '#607d8b',     // Bleu-gris
  reggae: '#4caf50',    // Vert
  latin: '#ff5722',     // Rouge-orange
  folk: '#8bc34a',      // Vert clair
  country: '#ffc107',   // Jaune
  classical: '#1d4ed8',  // Bleu profond
  alternative: '#455a64', // Gris
  indie: '#ff9800',     // Orange
  funk: '#cddc39',      // Vert-jaune
  disco: '#ffeb3b',     // Jaune vif
  experimental: '#9e9e9e', // Gris
};

/**
 * Détecte automatiquement le genre musical à partir du titre et de la description
 */
export function detectMusicGenre(title: string, description: string = '', existingTags: string[] = []): {
  primaryGenre: string | null;
  allGenres: string[];
  confidence: number;
} {
  const text = `${title} ${description} ${existingTags.join(' ')}`.toLowerCase();
  const detectedGenres: { genre: string; score: number }[] = [];
  
  // Analyser chaque genre
  Object.entries(MUSIC_GENRES).forEach(([genre, keywords]) => {
    let score = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * (keyword === genre ? 2 : 1); // Bonus pour le mot exact du genre
      }
    });
    
    if (score > 0) {
      detectedGenres.push({ genre, score });
    }
  });
  
  // Trier par score
  detectedGenres.sort((a, b) => b.score - a.score);
  
  const primaryGenre = detectedGenres.length > 0 ? detectedGenres[0].genre : null;
  const allGenres = detectedGenres.map(g => g.genre);
  const confidence = detectedGenres.length > 0 ? Math.min(detectedGenres[0].score / 10, 1) : 0;
  
  return {
    primaryGenre,
    allGenres,
    confidence
  };
}

/**
 * Génère des tags enrichis pour un événement musical
 */
export function generateMusicTags(event: {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
}): string[] {
  const enrichedTags = [...(event.tags || [])];
  
  // Si c'est un événement musical, analyser les genres
  if (event.category.toLowerCase().includes('music') || event.category.toLowerCase().includes('musique')) {
    const detection = detectMusicGenre(event.title, event.description, event.tags);
    
    if (detection.primaryGenre) {
      // Ajouter le genre principal
      if (!enrichedTags.includes(detection.primaryGenre)) {
        enrichedTags.unshift(detection.primaryGenre);
      }
      
      // Ajouter les genres secondaires si confiance élevée
      if (detection.confidence > 0.5) {
        detection.allGenres.slice(1, 3).forEach(genre => {
          if (!enrichedTags.includes(genre)) {
            enrichedTags.push(genre);
          }
        });
      }
    }
  }
  
  // Nettoyer et limiter les tags
  return enrichedTags
    .filter(tag => tag && tag.length > 1)
    .slice(0, 6)
    .map(tag => tag.toLowerCase().trim());
}

/**
 * Obtient l'emoji pour un genre musical
 */
export function getGenreEmoji(genre: string): string {
  return GENRE_EMOJIS[genre as keyof typeof GENRE_EMOJIS] || '🎵';
}

/**
 * Obtient la couleur pour un genre musical
 */
export function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre as keyof typeof GENRE_COLORS] || '#95a5a6';
}
