import OpenAI from 'openai';
import { EVENT_TYPES, GENRES, AMBIANCES, PUBLICS, TAG_TAXONOMY } from './taxonomy';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    `Genres musicaux (genres): ${JSON.stringify(GENRES)}`,
    `Ambiance (ambiance): ${JSON.stringify(AMBIANCES)}`,
    `Public (public): ${JSON.stringify(PUBLICS)}`,
    '',
    'Règles strictes :',
    '- Ne JAMAIS inventer de valeur en dehors de ces listes.',
    '- type peut être null si tu n’es pas sûr.',
    '- genres, ambiance et public doivent être des tableaux, éventuellement vides.',
    '- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.',
  ].join('\n');

  const userContent = {
    title: input.title,
    description: input.description ?? '',
    venueName: input.venueName ?? '',
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Classe cet événement en respectant STRICTEMENT la taxonomie et le format demandé.\n\n${JSON.stringify(
            userContent,
          )}`,
        },
      ],
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<AIClassificationOutput>;

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

