/**
 * Composant pour afficher les tags structurés (EventTag) d'un événement
 * Affiche les tags par catégorie : type, genres, ambiance, public
 */

'use client';

import { getGenreEmoji, getGenreColor } from '@/lib/musicTags';

export interface EventTag {
  id: string;
  category: 'type' | 'genre' | 'ambiance' | 'public';
  value: string;
}

interface EventTagsDisplayProps {
  eventTags: EventTag[];
  showCategoryLabels?: boolean;
  maxTagsPerCategory?: number;
  className?: string;
}

/**
 * Traduit les valeurs de tags en français pour l'affichage
 */
function translateTagValue(category: string, value: string): string {
  const translations: Record<string, Record<string, string>> = {
    type: {
      concert: 'Concert',
      dj_set: 'DJ Set',
      soiree_club: 'Soirée Club',
      festival: 'Festival',
      exposition: 'Exposition',
      projection: 'Projection',
      atelier: 'Atelier',
      conference: 'Conférence',
      evenement_famille: 'Événement Famille',
    },
    public: {
      tout_public: 'Tout public',
      '18_plus': '18+',
      famille: 'Famille',
    },
    ambiance: {
      salle_de_concert: 'Salle de concert',
      warehouse: 'Warehouse',
      exterieur: 'Extérieur',
      intime: 'Intime',
      underground: 'Underground',
      bar: 'Bar',
      club: 'Club',
    },
  };

  return translations[category]?.[value] || value.replace(/_/g, ' ');
}

/**
 * Obtient la couleur pour un tag selon sa catégorie
 */
function getTagColor(category: string, value: string): string {
  if (category === 'genre') {
    return getGenreColor(value) || '#6B7280';
  }

  const colors: Record<string, Record<string, string>> = {
    type: {
      concert: '#EF4444',
      dj_set: '#8B5CF6',
      soiree_club: '#EC4899',
      festival: '#F59E0B',
      exposition: '#3B82F6',
      projection: '#10B981',
      atelier: '#06B6D4',
      conference: '#6366F1',
      evenement_famille: '#14B8A6',
    },
    public: {
      tout_public: '#10B981',
      '18_plus': '#EF4444',
      famille: '#3B82F6',
    },
    ambiance: {
      salle_de_concert: '#8B5CF6',
      warehouse: '#6366F1',
      exterieur: '#10B981',
      intime: '#EC4899',
      underground: '#1F2937',
      bar: '#F59E0B',
      club: '#EC4899',
    },
  };

  return colors[category]?.[value] || '#6B7280';
}

/**
 * Obtient l'emoji pour un tag selon sa catégorie
 */
function getTagEmoji(category: string, value: string): string {
  if (category === 'genre') {
    return getGenreEmoji(value) || '🎵';
  }

  const emojis: Record<string, Record<string, string>> = {
    type: {
      concert: '🎤',
      dj_set: '🎧',
      soiree_club: '🕺',
      festival: '🎪',
      exposition: '🖼️',
      projection: '🎬',
      atelier: '🎨',
      conference: '💬',
      evenement_famille: '👨‍👩‍👧‍👦',
    },
    public: {
      tout_public: '👥',
      '18_plus': '🔞',
      famille: '👨‍👩‍👧‍👦',
    },
    ambiance: {
      salle_de_concert: '🎭',
      warehouse: '🏭',
      exterieur: '🌳',
      intime: '🕯️',
      underground: '⚡',
      bar: '🍻',
      club: '🎉',
    },
  };

  return emojis[category]?.[value] || '🏷️';
}

export default function EventTagsDisplay({
  eventTags,
  showCategoryLabels = false,
  maxTagsPerCategory,
  className = '',
}: EventTagsDisplayProps) {
  if (!eventTags || eventTags.length === 0) {
    return null;
  }

  // Grouper les tags par catégorie
  const tagsByCategory = eventTags.reduce(
    (acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    },
    {} as Record<string, EventTag[]>
  );

  // Ordre d'affichage des catégories
  const categoryOrder: Array<{ key: string; label: string }> = [
    { key: 'type', label: 'Type' },
    { key: 'genre', label: 'Genre' },
    { key: 'ambiance', label: 'Ambiance' },
    { key: 'public', label: 'Public' },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {categoryOrder.map(({ key, label }) => {
        const tags = tagsByCategory[key] || [];
        if (tags.length === 0) return null;

        const displayTags = maxTagsPerCategory
          ? tags.slice(0, maxTagsPerCategory)
          : tags;

        return (
          <div key={key} className="flex flex-wrap gap-1.5 items-center">
            {showCategoryLabels && (
              <span className="text-xs font-medium text-slate-300 mr-1">
                {label}:
              </span>
            )}
            {displayTags.map((tag) => {
              const color = getTagColor(tag.category, tag.value);
              const emoji = getTagEmoji(tag.category, tag.value);
              const label = translateTagValue(tag.category, tag.value);

              return (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  <span className="mr-1">{emoji}</span>
                  {label}
                </span>
              );
            })}
            {maxTagsPerCategory && tags.length > maxTagsPerCategory && (
              <span className="text-xs text-slate-300">
                +{tags.length - maxTagsPerCategory}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

