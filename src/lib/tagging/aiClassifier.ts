import { EVENT_TYPES, GENRES, AMBIANCES, PUBLICS } from './taxonomy';

export type AIClassificationInput = {
  title: string;
  description?: string;
  venueName?: string;
};

export type AIClassificationOutput = {
  type: string | null;
  genres: string[];
  ambiance: string[];
  public: string[];
};

export async function classifyEventWithAI(
  input: AIClassificationInput,
): Promise<AIClassificationOutput> {
  if (!process.env.OPENAI_API_KEY) {
    // Sécurité : si aucune clé n'est configurée, on ne retourne rien
    return { type: null, genres: [], ambiance: [], public: [] };
  }

  const systemPrompt = [
    'Tu es un système de classification d’événements pour un agenda culturel.',
    'Tu dois analyser le titre, la description et le nom du lieu,',
    'puis renvoyer une classification STRICTEMENT dans les listes suivantes.',
    '',
    `Types d’événements (type): ${JSON.stringify(EVENT_TYPES)}`,
    `Genres musicaux PRINCIPAUX (genres): ${JSON.stringify(GENRES)}`,
    'IMPORTANT: Les genres doivent être des GENRES PRINCIPAUX uniquement.',
    'Exemples de genres principaux: reggae, hip_hop, pop, techno, rock, jazz, etc.',
    'NE PAS utiliser de styles comme genres (ex: "dub" est un STYLE de "reggae", pas un genre principal).',
    'Si un événement mentionne un style (ex: "dub", "trap", "jungle"), choisis le genre principal parent (ex: "reggae", "hip_hop", "drum_and_bass").',
    '',
    `Ambiance (ambiance): ${JSON.stringify(AMBIANCES)}`,
    `Public (public): ${JSON.stringify(PUBLICS)}`,
    '',
    'Règles strictes :',
    '- Ne JAMAIS inventer de valeur en dehors de ces listes.',
    '- type peut être null si tu n’es pas sûr.',
    '- genres doit contenir UNIQUEMENT des genres principaux (pas de styles).',
    '- genres, ambiance et public doivent être des tableaux, éventuellement vides.',
    '- Si plusieurs genres principaux sont pertinents, renvoie-les tous (ex: ["pop", "hip_hop"]).',
    '- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.',
    '',
    'Exemples (à imiter STRICTEMENT, sans ajouter de champ ni de texte autour) :',
    '',
    '1) Concert rap/pop (type Berlam) :',
    'input:',
    '{',
    '  "title": "Berlam – Lancement de l\'album",',
    '  "description": "Lancement officiel du deuxième album de Berlam. Portes: 20h00, Spectacle: 21h00, Tous âges.",',
    '  "venueName": "Club Soda"',
    '}',
    'output:',
    '{',
    '  "type": "concert",',
    '  "genres": ["pop","hip_hop"],',
    '  "ambiance": ["salle_de_concert"],',
    '  "public": ["tout_public"]',
    '}',
    'Note IMPORTANTE:',
    '- Les "lancements d\'album" de rap francophone montréalais sont généralement un mélange pop + hip_hop.',
    '- Les artistes rap/pop montréalais (Berlam, Loud, etc.) doivent avoir ["pop", "hip_hop"].',
    '- Si un événement mentionne "rap" ou "hip-hop" sans autre précision, mais que c\'est un lancement d\'album ou un concert d\'artiste connu pour mélanger les styles, renvoie ["pop", "hip_hop"].',
    '- Si un événement mélange plusieurs genres principaux, renvoie TOUS les genres pertinents.',
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
    '  "ambiance": ["underground","salle_de_concert"],',
    '  "public": ["18_plus"]',
    '}',
    'Note: "dub" est un STYLE de "reggae", donc on utilise uniquement le genre principal "reggae".',
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
    '  "ambiance": ["intime"],',
    '  "public": ["famille"]',
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
      console.error('Erreur OpenAI API:', response.status, await response.text());
      return { type: null, genres: [], ambiance: [], public: [] };
    }

    const data: any = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(rawContent) as Partial<AIClassificationOutput>;

    // Normalisation minimale ici; le filtrage final est fait dans filterToAllowedTags
    return {
      type: typeof parsed.type === 'string' ? parsed.type : null,
      genres: Array.isArray(parsed.genres) ? parsed.genres.filter((g) => typeof g === 'string') : [],
      ambiance: Array.isArray(parsed.ambiance)
        ? parsed.ambiance.filter((a) => typeof a === 'string')
        : [],
      public: Array.isArray(parsed.public)
        ? parsed.public.filter((p) => typeof p === 'string')
        : [],
    };
  } catch (error) {
    console.error('Erreur classifyEventWithAI:', error);
    return { type: null, genres: [], ambiance: [], public: [] };
  }
}

