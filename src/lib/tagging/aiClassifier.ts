import { EVENT_TYPES, GENRES, AMBIANCES, PUBLICS, MUSIC_STYLES, getStylesForGenre } from './taxonomy';

export type AIClassificationInput = {
  title: string;
  description?: string;
  venueName?: string;
};

export type AIClassificationOutput = {
  type: string | null;
  genres: string[];
  styles: string[]; // Styles musicaux (sous-genres)
  ambiance: string[];
  public: string[];
};

/**
 * Retry avec backoff exponentiel pour gérer les rate limits OpenAI
 */
async function classifyWithRetry(
  input: AIClassificationInput,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<AIClassificationOutput> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await classifyEventWithAIInternal(input);
      return result;
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429');
      const isLastAttempt = attempt === maxRetries - 1;

      if (isRateLimit && !isLastAttempt) {
        // Extraire le délai suggéré par OpenAI si disponible
        let delay = initialDelay * Math.pow(2, attempt); // Backoff exponentiel
        
        // Si l'erreur contient un délai suggéré, l'utiliser
        if (error?.retryAfter) {
          delay = error.retryAfter * 1000; // Convertir secondes en ms
        } else if (error?.message) {
          // Parser le message d'erreur OpenAI pour extraire le délai
          const retryMatch = error.message.match(/try again in (\d+)ms/i);
          if (retryMatch) {
            delay = parseInt(retryMatch[1], 10);
          }
        }

        // Limiter le délai max à 60 secondes
        delay = Math.min(delay, 60000);

        console.warn(
          `⚠️ Rate limit OpenAI (429) - Tentative ${attempt + 1}/${maxRetries} - Retry dans ${delay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Si ce n'est pas un rate limit ou c'est la dernière tentative, logger et retourner vide
      if (isLastAttempt) {
        console.error(
          `❌ Erreur OpenAI après ${maxRetries} tentatives:`,
          error?.message || error,
        );
      }
      return { type: null, genres: [], styles: [], ambiance: [], public: [] };
    }
  }

  return { type: null, genres: [], styles: [], ambiance: [], public: [] };
}

/**
 * Fonction interne qui fait l'appel API réel
 */
async function classifyEventWithAIInternal(
  input: AIClassificationInput,
): Promise<AIClassificationOutput> {
  if (!process.env.OPENAI_API_KEY) {
    // Sécurité : si aucune clé n'est configurée, on ne retourne rien
    return { type: null, genres: [], styles: [], ambiance: [], public: [] };
  }

  const systemPrompt = [
    'Tu es un système de classification d’événements pour un agenda culturel.',
    'Tu dois analyser le titre, la description et le nom du lieu,',
    'puis renvoyer une classification STRICTEMENT dans les listes suivantes.',
    '',
    `Types d’événements (type): ${JSON.stringify(EVENT_TYPES)}`,
    `Genres musicaux PRINCIPAUX (genres): ${JSON.stringify(GENRES)}`,
    '',
    'Styles musicaux (styles): Les styles sont des sous-genres qui appartiennent à un genre principal.',
    'Exemples de styles par genre:',
    '- reggae → ["dub", "dancehall", "roots_reggae", "lovers_rock", "rocksteady", "ska", "reggaeton", "dubwise"]',
    '- hip_hop → ["rap", "trap", "drill", "grime", "conscious_hip_hop", "gangsta_rap", "mumble_rap", "old_school_hip_hop"]',
    '- jazz → ["bebop", "fusion", "smooth_jazz", "free_jazz", "latin_jazz", "acid_jazz"]',
    '- rnb → ["neo_soul", "contemporary_rnb", "soul"]',
    '- rock → ["indie_rock", "alternative_rock", "garage_rock", "psych_rock", "post_rock", "hard_rock", "classic_rock", "arena_rock"]',
    '- techno → ["minimal_techno", "industrial_techno", "acid_techno", "detroit_techno", "berlin_techno", "dub_techno"]',
    '- house → ["deep_house", "tech_house", "progressive_house", "disco_house", "vocal_house", "acid_house"]',
    '- drum_and_bass → ["jungle", "liquid_dnb", "neurofunk", "jump_up", "darkstep"]',
    '- electronic → ["ambient", "idm", "glitch", "synthwave", "vaporwave", "chillwave"]',
    '- Et ainsi de suite pour tous les genres principaux.',
    '',
    'IMPORTANT:',
    '- genres doit contenir UNIQUEMENT des genres principaux (ex: "reggae", "jazz", "techno").',
    '- styles doit contenir les styles/sous-genres pertinents (ex: "dub", "fusion", "minimal_techno").',
    '- Si un événement mentionne un style, ajoute-le dans "styles" ET le genre principal parent dans "genres".',
    '- Exemple: "dub" → genres: ["reggae"], styles: ["dub"]',
    '- Exemple: "jazz fusion" → genres: ["jazz"], styles: ["fusion"]',
    '- Exemple: "neo-soul" → genres: ["rnb"] ou ["soul"], styles: ["neo_soul"]',
    '- Si plusieurs genres sont pertinents, renvoie-les tous (ex: ["jazz", "rnb"]).',
    '',
    `Ambiance (ambiance): ${JSON.stringify(AMBIANCES)}`,
    `Public (public): ${JSON.stringify(PUBLICS)}`,
    '',
    'Règles strictes :',
    '- Ne JAMAIS inventer de valeur en dehors de ces listes.',
    '- type peut être null si tu n\'es pas sûr.',
    '- genres doit contenir UNIQUEMENT des genres principaux (pas de styles).',
    '- styles doit contenir les styles/sous-genres pertinents (peut être vide si aucun style spécifique).',
    '- genres, styles, ambiance et public doivent être des tableaux, éventuellement vides.',
    '- Si plusieurs genres principaux sont pertinents, renvoie-les tous (ex: ["pop", "hip_hop"]).',
    '- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.',
    '',
    'Exemples (à imiter STRICTEMENT, sans ajouter de champ ni de texte autour) :',
    '',
    '1) Concert rap/pop :',
    'input:',
    '{',
    '  "title": "Lancement d\'album rap/pop",',
    '  "description": "Lancement officiel d\'un album mélangeant rap et pop. Portes: 20h00, Spectacle: 21h00, Tous âges.",',
    '  "venueName": "Club Soda"',
    '}',
    'output:',
    '{',
    '  "type": "concert",',
    '  "genres": ["pop","hip_hop"],',
    '  "styles": ["rap"],',
    '  "ambiance": ["salle_de_concert"],',
    '  "public": ["tout_public"]',
    '}',
    '',
    '2) Soirée techno en warehouse :',
    'input:',
    '{',
    '  "title": "Rave techno industrielle",',
    '  "description": "All night techno dans un warehouse underground, DJs internationaux, 18+.",',
    '  "venueName": ""',
    '}',
    'output:',
    '{',
    '  "type": "dj_set",',
    '  "genres": ["techno"],',
    '  "styles": ["industrial_techno"],',
    '  "ambiance": ["underground","warehouse"],',
    '  "public": ["18_plus"]',
    '}',
    '',
    '3) Exposition familiale en plein air :',
    'input:',
    '{',
    '  "title": "Expo photo en plein air",',
    '  "description": "Exposition de photographies en extérieur, accessible et adaptée aux familles.",',
    '  "venueName": "Parc La Fontaine"',
    '}',
    'output:',
    '{',
    '  "type": "exposition",',
    '  "genres": ["other"],',
    '  "styles": [],',
    '  "ambiance": ["exterieur"],',
    '  "public": ["famille"]',
    '}',
    '',
    '4) Soirée reggae / dub sound system :',
    'input:',
    '{',
    '  "title": "Dubwise Reggae Sound System",',
    '  "description": "Session reggae et dub avec plusieurs sound systems, ambiance roots, dancehall et bass music toute la nuit.",',
    '  "venueName": "Salle communautaire"',
    '}',
    'output:',
    '{',
    '  "type": "soiree_club",',
    '  "genres": ["reggae"],',
    '  "styles": ["dub", "dancehall"],',
    '  "ambiance": ["underground","salle_de_concert"],',
    '  "public": ["18_plus"]',
    '}',
    'Note: "dub" et "dancehall" sont des STYLES de "reggae", donc genres: ["reggae"] et styles: ["dub", "dancehall"].',
    '',
    '5) Atelier créatif pour enfants :',
    'input:',
    '{',
    '  "title": "Atelier créatif pour enfants – peinture et collage",',
    '  "description": "Atelier artistique pour enfants de 6 à 12 ans, matériel fourni, activité familiale en intérieur.",',
    '  "venueName": "Centre communautaire du Plateau"',
    '}',
    'output:',
    '{',
    '  "type": "atelier",',
    '  "genres": ["other"],',
    '  "styles": [],',
    '  "ambiance": ["intime"],',
    '  "public": ["famille"]',
    '}',
    '',
    '6) Concert jazz fusion / neo-soul :',
    'input:',
    '{',
    '  "title": "Concert jazz contemporain",',
    '  "description": "Concert de jazz fusion et neo-soul avec influences R&B moderne. Musiciens de la scène jazz contemporaine.",',
    '  "venueName": "Newspeak"',
    '}',
    'output:',
    '{',
    '  "type": "concert",',
    '  "genres": ["jazz", "rnb"],',
    '  "styles": ["fusion", "neo_soul"],',
    '  "ambiance": ["salle_de_concert"],',
    '  "public": ["tout_public"]',
    '}',
    '',
    '7) Concert rock alternatif :',
    'input:',
    '{',
    '  "title": "Soirée rock indie",',
    '  "description": "Concert de rock alternatif et indie rock avec plusieurs groupes locaux. Ambiance décontractée.",',
    '  "venueName": "Bar Le Ritz"',
    '}',
    'output:',
    '{',
    '  "type": "concert",',
    '  "genres": ["rock", "indie"],',
    '  "styles": ["indie_rock", "alternative_rock"],',
    '  "ambiance": ["bar"],',
    '  "public": ["18_plus"]',
    '}',
    '',
    '8) Festival de musique électronique :',
    'input:',
    '{',
    '  "title": "Festival électronique en plein air",',
    '  "description": "Festival de musique électronique avec plusieurs scènes, DJs internationaux, techno, house et trance.",',
    '  "venueName": "Parc Jean-Drapeau"',
    '}',
    'output:',
    '{',
    '  "type": "festival",',
    '  "genres": ["techno", "house", "trance"],',
    '  "styles": ["progressive_house", "uplifting_trance"],',
    '  "ambiance": ["exterieur", "festival_site"],',
    '  "public": ["18_plus"]',
    '}',
  ].join('\n');

  const userContent = {
    title: input.title,
    description: input.description ?? '',
    venueName: input.venueName ?? '',
  };
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Classe cet événement en respectant STRICTEMENT la taxonomie et le format demandé.\n\n${JSON.stringify(
              userContent,
            )}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = { status: response.status, message: errorText };
      
      // Essayer de parser le JSON d'erreur si disponible
      try {
        errorData = { ...errorData, ...JSON.parse(errorText) };
      } catch {
        // Ignorer si ce n'est pas du JSON
      }

      // Créer une erreur avec les détails pour le retry
      const error = new Error(errorText) as any;
      error.status = response.status;
      error.message = errorText;
      error.retryAfter = errorData.retry_after || errorData.retryAfter;
      
      throw error;
    }

    const data: any = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(rawContent) as Partial<AIClassificationOutput>;

    // Normalisation minimale ici; le filtrage final est fait dans filterToAllowedTags
    return {
      type: typeof parsed.type === 'string' ? parsed.type : null,
      genres: Array.isArray(parsed.genres) ? parsed.genres.filter((g) => typeof g === 'string') : [],
      styles: Array.isArray(parsed.styles) ? parsed.styles.filter((s) => typeof s === 'string') : [],
      ambiance: Array.isArray(parsed.ambiance)
        ? parsed.ambiance.filter((a) => typeof a === 'string')
        : [],
      public: Array.isArray(parsed.public)
        ? parsed.public.filter((p) => typeof p === 'string')
        : [],
    };
  } catch (error: any) {
    // Re-lancer l'erreur pour que le retry puisse la gérer
    throw error;
  }
}

/**
 * Fonction publique avec retry automatique
 */
export async function classifyEventWithAI(
  input: AIClassificationInput,
): Promise<AIClassificationOutput> {
  return classifyWithRetry(input);
}

