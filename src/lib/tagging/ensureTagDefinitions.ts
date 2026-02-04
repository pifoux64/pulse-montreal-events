import { prisma } from '@/lib/prisma';

const FREE_TAG_CATEGORY = 'tag';

/**
 * Normalise une valeur de tag pour l'unicité (category, value).
 */
function normalizeTagValue(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 100) || 'tag';
}

/**
 * Enregistre les tags en base (TagDefinition) pour qu'ils soient disponibles
 * pour les prochaines fois (suggestions, filtres, etc.).
 * Crée ou met à jour une entrée par tag avec category='tag'.
 */
export async function ensureTagDefinitions(tagStrings: string[]): Promise<void> {
  if (!tagStrings?.length) return;

  const seen = new Set<string>();
  for (const raw of tagStrings) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const value = normalizeTagValue(trimmed);
    if (value === 'tag' || seen.has(value)) continue;
    seen.add(value);
    const label = trimmed.slice(0, 255);
    try {
      await prisma.tagDefinition.upsert({
        where: {
          unique_tagdefinition: {
            category: FREE_TAG_CATEGORY,
            value,
          },
        },
        create: {
          category: FREE_TAG_CATEGORY,
          value,
          label,
        },
        update: {
          label,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Ne pas faire échouer la création d'événement si TagDefinition échoue
      console.warn('[ensureTagDefinitions]', value, e);
    }
  }
}
