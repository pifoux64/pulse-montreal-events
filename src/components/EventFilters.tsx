'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Search, MapPin, Calendar, DollarSign, Users, Accessibility, Globe, Tag, Clock, TrendingUp, ArrowUpDown } from 'lucide-react';
import { EventFilter, EventCategory } from '@/types';
import { EVENT_TYPES, AMBIANCES, PUBLICS } from '@/lib/tagging/taxonomy';

interface EventFiltersProps {
  filters: EventFilter;
  onFiltersChange: (filters: EventFilter) => void;
  categories: EventCategory[];
  onLocationDetect: () => void;
  neighborhoods?: string[]; // Liste des quartiers disponibles
}

type DatePresetKey = 'today' | 'tonight' | 'weekend' | 'thisWeek' | 'thisMonth' | 'nextMonth';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const getTonightRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(17, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(5, 0, 0, 0);

  return { start, end };
};

const getWeekendRange = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche, 6 = samedi
  const saturday = new Date(now);
  const offset = (6 - day + 7) % 7; // Nombre de jours jusqu'au prochain samedi
  saturday.setDate(saturday.getDate() + offset);
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);

  return { start: saturday, end: sunday };
};

const getThisWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(start.getDate() - day); // Dimanche de cette semaine
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Samedi de cette semaine
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

const getThisMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

const getNextMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

const DATE_PRESETS: Record<DatePresetKey, { label: string; compute: () => { start: Date; end: Date } }> = {
  today: {
    label: "Aujourd'hui",
    compute: () => {
      const now = new Date();
      return { start: startOfDay(now), end: endOfDay(now) };
    },
  },
  tonight: {
    label: 'Ce soir',
    compute: getTonightRange,
  },
  weekend: {
    label: 'Week-end',
    compute: getWeekendRange,
  },
  thisWeek: {
    label: 'Cette semaine',
    compute: getThisWeekRange,
  },
  thisMonth: {
    label: 'Ce mois',
    compute: getThisMonthRange,
  },
  nextMonth: {
    label: 'Mois prochain',
    compute: getNextMonthRange,
  },
};

// Sources d'événements disponibles
const EVENT_SOURCES = [
  { id: 'ticketmaster', label: 'Ticketmaster' },
  { id: 'eventbrite', label: 'Eventbrite' },
  { id: 'meetup', label: 'Meetup' },
  { id: 'internal', label: 'Pulse Montréal' },
];

// Options de tri
const SORT_OPTIONS = [
  { value: 'date', label: 'Date (plus proche)', icon: Clock },
  { value: 'price', label: 'Prix (croissant)', icon: DollarSign },
  { value: 'popularity', label: 'Popularité', icon: TrendingUp },
  { value: 'distance', label: 'Distance', icon: MapPin },
];

// Restrictions d'âge
const AGE_RESTRICTIONS = ['Tous', '18+', '21+', '16+', '13+'];

const isSameRange = (rangeA?: { start?: Date; end?: Date }, rangeB?: { start?: Date; end?: Date }) => {
  if (!rangeA?.start || !rangeA?.end || !rangeB?.start || !rangeB?.end) return false;
  const tolerance = 60 * 1000; // 1 minute
  return (
    Math.abs(rangeA.start.getTime() - rangeB.start.getTime()) < tolerance &&
    Math.abs(rangeA.end.getTime() - rangeB.end.getTime()) < tolerance
  );
};

const EventFilters = ({ filters, onFiltersChange, categories, onLocationDetect, neighborhoods = [] }: EventFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState<EventFilter>(filters);
  const [activePreset, setActivePreset] = useState<DatePresetKey | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // SPRINT 1: Recherche intelligente (IA)
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const dateRange = localFilters.dateRange;
    if (!dateRange?.start || !dateRange?.end) {
      setActivePreset(null);
      return;
    }

    // Vérifier tous les presets
    for (const [key, preset] of Object.entries(DATE_PRESETS)) {
      if (isSameRange(dateRange, preset.compute())) {
        setActivePreset(key as DatePresetKey);
        return;
      }
    }

    setActivePreset(null);
  }, [localFilters.dateRange?.start, localFilters.dateRange?.end]);

  const handleFilterChange = (key: keyof EventFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    handleFilterChange('searchQuery', value);
    // Réinitialiser les explications IA quand l'utilisateur modifie manuellement
    setAiExplanation(null);
    setAiConfidence(null);
    setAiError(null);
  };

  /**
   * Applique la recherche intelligente (IA) via l'endpoint /api/ai/search-to-filters
   */
  const handleAISearch = async () => {
    const query = (localFilters.searchQuery || '').trim();
    if (!query) return;

    try {
      setAiLoading(true);
      setAiError(null);

      // TODO: plus tard, passer la position réelle de l'utilisateur
      const res = await fetch('/api/ai/search-to-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryText: query,
          timezone: 'America/Montreal',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche intelligente');
      }

      const aiFilters = data.filters as {
        timeScope: 'today' | 'weekend' | 'dateRange' | 'all';
        rangeStart?: string;
        rangeEnd?: string;
        radiusKm?: number;
        categories?: Array<'music' | 'culture' | 'family' | 'sports' | 'exhibition' | 'community' | 'education' | 'nightlife' | 'other'>;
        musicGenres?: string[];
        tags?: string[];
        isFree?: boolean;
        ageRestriction?: 'all' | '18+' | '21+';
        language?: 'fr' | 'en' | 'other';
        confidence: number;
        explanation: string;
      };

      // Construire de nouveaux filtres à partir de la réponse IA
      const newFilters: EventFilter = { ...localFilters };

      // 1) Période
      const now = new Date();
      switch (aiFilters.timeScope) {
        case 'today': {
          const start = startOfDay(now);
          const end = endOfDay(now);
          newFilters.dateRange = { start, end };
          break;
        }
        case 'weekend': {
          const { start, end } = getWeekendRange();
          newFilters.dateRange = { start, end };
          break;
        }
        case 'dateRange': {
          if (aiFilters.rangeStart || aiFilters.rangeEnd) {
            newFilters.dateRange = {
              ...(aiFilters.rangeStart ? { start: new Date(aiFilters.rangeStart) } : {}),
              ...(aiFilters.rangeEnd ? { end: new Date(aiFilters.rangeEnd) } : {}),
            } as EventFilter['dateRange'];
          }
          break;
        }
        case 'all':
        default:
          // Pas de filtre de date spécifique
          break;
      }

      // 2) Gratuit
      if (aiFilters.isFree !== undefined) {
        newFilters.freeOnly = aiFilters.isFree;
      }

      // 3) Langue
      if (aiFilters.language === 'fr') {
        newFilters.language = 'FR';
      } else if (aiFilters.language === 'en') {
        newFilters.language = 'EN';
      }

      // 4) Restriction d'âge
      if (aiFilters.ageRestriction && aiFilters.ageRestriction !== 'all') {
        newFilters.ageRestriction = aiFilters.ageRestriction;
      }

      // 5) Tags (genres musicaux + autres tags)
      const combinedTags = new Set<string>(newFilters.tags || []);
      (aiFilters.musicGenres || []).forEach((g) => combinedTags.add(g));
      (aiFilters.tags || []).forEach((t) => combinedTags.add(t));
      if (combinedTags.size > 0) {
        newFilters.tags = Array.from(combinedTags);
      }

      // 6) Catégories (mapper catégories IA -> catégories d'affichage)
      if (aiFilters.categories && aiFilters.categories.length > 0) {
        const categoryMap: Record<string, string> = {};
        categories.forEach((cat) => {
          // On mappe par id (ex: MUSIC) et par nom en minuscules
          categoryMap[cat.id.toLowerCase()] = cat.name;
          categoryMap[cat.name.toLowerCase()] = cat.name;
        });

        const mappedCategories: string[] = [];
        aiFilters.categories.forEach((catKey) => {
          const key = catKey.toLowerCase();
          const prismaKey =
            key === 'music'
              ? 'music'
              : key === 'family'
              ? 'family'
              : key === 'sports'
              ? 'sport'
              : key;

          const byId = categoryMap[prismaKey.toUpperCase()];
          const byName = categoryMap[prismaKey];
          const match = byId || byName;
          if (match && !mappedCategories.includes(match)) {
            mappedCategories.push(match);
          }
        });

        if (mappedCategories.length > 0) {
          newFilters.categories = mappedCategories;
        }
      }

      // Garder la requête texte telle quelle
      newFilters.searchQuery = query;

      setLocalFilters(newFilters);
      onFiltersChange(newFilters);

      setAiExplanation(aiFilters.explanation || null);
      setAiConfidence(aiFilters.confidence ?? null);
    } catch (error: any) {
      console.error('Erreur recherche IA:', error);
      setAiError(error.message || 'Erreur lors de la recherche intelligente');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string, isChecked: boolean) => {
    const category = categories.find(cat => cat.id === categoryId);
    const categoryName = category?.name || categoryId;
    
    const currentCategories = localFilters.categories || [];
    const newCategories = isChecked
      ? [...currentCategories, categoryName]
      : currentCategories.filter(name => name !== categoryName);
    handleFilterChange('categories', newCategories);
  };

  const handleSubCategoryChange = (subCategoryName: string, isChecked: boolean) => {
    const currentSubCategories = localFilters.subCategories || [];
    const newSubCategories = isChecked
      ? [...currentSubCategories, subCategoryName]
      : currentSubCategories.filter(name => name !== subCategoryName);
    handleFilterChange('subCategories', newSubCategories);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setActivePreset(null);
    handleFilterChange('dateRange', {
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
    });
  };

  const handlePriceRangeChange = (min: string, max: string) => {
    handleFilterChange('priceRange', {
      min: min ? parseFloat(min) : undefined,
      max: max ? parseFloat(max) : undefined,
    });
  };

  const handleRadiusChange = (radius: number) => {
    if (localFilters.location) {
      // Mettre à jour immédiatement pour un feedback en temps réel
      const newLocation = { ...localFilters.location, radius };
      const newFilters = { ...localFilters, location: newLocation };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters: EventFilter = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setActivePreset(null);
  };

  const applyDatePreset = (preset: DatePresetKey) => {
    const range = DATE_PRESETS[preset].compute();
    handleFilterChange('dateRange', range);
    setActivePreset(preset);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.subCategories?.length) count += filters.subCategories.length;
    if (filters.dateRange?.start || filters.dateRange?.end) count += 1;
    if (filters.priceRange?.min || filters.priceRange?.max) count += 1;
    if (filters.location?.radius) count += 1;
    if (filters.searchQuery) count += 1;
    if (filters.neighborhoods?.length) count += filters.neighborhoods.length;
    if (filters.sources?.length) count += filters.sources.length;
    if (filters.language) count += 1;
    if (filters.freeOnly) count += 1;
    if (filters.ageRestriction) count += 1;
    if (filters.tags?.length) count += filters.tags.length;
    if (filters.targetAudience?.length) count += filters.targetAudience.length;
    if (filters.accessibility && Object.values(filters.accessibility).some(v => v)) count += 1;
    return count;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      {/* Header des filtres */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">Filtres</h3>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="p-3 border-b border-gray-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un événement (ex: reggae gratuit ce soir)..."
                value={localFilters.searchQuery || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiEnabled) {
                    e.preventDefault();
                    void handleAISearch();
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setAiEnabled(!aiEnabled);
                setAiExplanation(null);
                setAiConfidence(null);
                setAiError(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                aiEnabled
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              IA
            </button>
            <button
              type="button"
              onClick={() => void handleAISearch()}
              disabled={aiLoading || !localFilters.searchQuery?.trim()}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-indigo-500 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
            >
              {aiLoading ? 'Analyse…' : 'Interpréter'}
            </button>
          </div>
          {(aiExplanation || aiError) && (
            <div className="text-[11px] leading-snug">
              {aiError ? (
                <span className="text-red-600">{aiError}</span>
              ) : (
                <span className="text-gray-500">
                  {aiExplanation}
                  {aiConfidence !== null && (
                    <span className="ml-1 text-gray-400">
                      ({Math.round(aiConfidence * 100)} %)
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
          
          {/* Chips d'interprétation - Filtres appliqués par l'IA */}
          {aiExplanation && !aiError && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {/* Période */}
              {localFilters.dateRange?.start && (
                <button
                  type="button"
                  onClick={() => {
                    const newFilters = { ...localFilters };
                    delete newFilters.dateRange;
                    setLocalFilters(newFilters);
                    onFiltersChange(newFilters);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                  title="Cliquer pour retirer"
                >
                  {activePreset ? DATE_PRESETS[activePreset].label : 'Période'}
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              
              {/* Gratuit */}
              {localFilters.freeOnly && (
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('freeOnly', false);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  title="Cliquer pour retirer"
                >
                  Gratuit
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              
              {/* Langue */}
              {localFilters.language && (
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('language', undefined);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  title="Cliquer pour retirer"
                >
                  {localFilters.language === 'FR' ? 'Français' : localFilters.language === 'EN' ? 'English' : localFilters.language}
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              
              {/* Âge */}
              {localFilters.ageRestriction && localFilters.ageRestriction !== 'Tous' && (
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('ageRestriction', undefined);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
                  title="Cliquer pour retirer"
                >
                  {localFilters.ageRestriction}
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              
              {/* Catégories */}
              {localFilters.categories && localFilters.categories.length > 0 && (
                <>
                  {localFilters.categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const newCategories = localFilters.categories?.filter((c) => c !== cat) || [];
                        handleFilterChange('categories', newCategories.length > 0 ? newCategories : undefined);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                      title="Cliquer pour retirer"
                    >
                      {cat}
                      <X className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </>
              )}
              
              {/* Tags/Genres */}
              {localFilters.tags && localFilters.tags.length > 0 && (
                <>
                  {localFilters.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const newTags = localFilters.tags?.filter((t) => t !== tag) || [];
                        handleFilterChange('tags', newTags.length > 0 ? newTags : undefined);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
                      title="Cliquer pour retirer"
                    >
                      {tag}
                      <X className="w-2.5 h-2.5" />
                    </button>
                  ))}
                  {localFilters.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      +{localFilters.tags.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filtres principaux */}
      {isExpanded && (
      <div className="p-3 space-y-3">
        {/* Catégories */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Catégories</h4>
          <div className="grid grid-cols-1 gap-1">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localFilters.categories?.includes(category.name) || false}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sous-catégories (si des catégories sont sélectionnées) */}
        {localFilters.categories && localFilters.categories.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Sous-catégories</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories
                .filter(cat => localFilters.categories?.includes(cat.name))
                .flatMap(cat => cat.subCategories)
                .map((subCat) => (
                  <label key={subCat.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={localFilters.subCategories?.includes(subCat.name) || false}
                      onChange={(e) => handleSubCategoryChange(subCat.name, e.target.checked)}
                      className="rounded border-gray-300 text-pulse-primary focus:ring-pulse-primary"
                    />
                    <span className="text-sm text-gray-700">{subCat.name}</span>
                  </label>
                ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Période</span>
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(DATE_PRESETS) as DatePresetKey[]).map((presetKey) => (
              <button
                key={presetKey}
                type="button"
                onClick={() => applyDatePreset(presetKey)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  activePreset === presetKey
                    ? 'bg-sky-600 text-white border-sky-600 shadow'
                    : 'border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-600'
                }`}
              >
                {DATE_PRESETS[presetKey].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Début</label>
              <input
                type="date"
                value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateRangeChange(e.target.value, localFilters.dateRange?.end?.toISOString().split('T')[0] || '')}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fin</label>
              <input
                type="date"
                value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateRangeChange(localFilters.dateRange?.start?.toISOString().split('T')[0] || '', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Prix */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Prix</span>
          </h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localFilters.freeOnly || false}
                onChange={(e) => handleFilterChange('freeOnly', e.target.checked)}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">Gratuit uniquement</span>
            </label>
            {!localFilters.freeOnly && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={localFilters.priceRange?.min || ''}
                    onChange={(e) => handlePriceRangeChange(e.target.value, localFilters.priceRange?.max?.toString() || '')}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={localFilters.priceRange?.max || ''}
                    onChange={(e) => handlePriceRangeChange(localFilters.priceRange?.min?.toString() || '', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tri */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4" />
            <span>Trier par</span>
          </h4>
          <select
            value={localFilters.sortBy || 'date'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full form-input"
          >
            {SORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Langue */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Langue</span>
          </h4>
          <div className="space-y-2">
            {[
              { value: 'FR', label: 'Français' },
              { value: 'EN', label: 'Anglais' },
              { value: 'BOTH', label: 'Les deux' },
            ].map((lang) => (
              <label key={lang.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="language"
                  value={lang.value}
                  checked={localFilters.language === lang.value}
                  onChange={(e) => handleFilterChange('language', e.target.value as 'FR' | 'EN' | 'BOTH')}
                  className="border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-700">{lang.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Localisation */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Localisation</span>
          </h4>
          <div className="space-y-3">
            <button
              onClick={onLocationDetect}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Autour de moi</span>
            </button>
            
            {localFilters.location && (
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Rayon: <span className="font-semibold text-sky-600">{localFilters.location.radius || 5} km</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={localFilters.location.radius || 5}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      // Mapper aux valeurs autorisées: 1, 3, 5, 10
                      let mappedValue = 5;
                      if (value <= 2) mappedValue = 1;
                      else if (value <= 4) mappedValue = 3;
                      else if (value <= 7) mappedValue = 5;
                      else mappedValue = 10;
                      handleRadiusChange(mappedValue);
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    style={{
                      background: `linear-gradient(to right, rgb(2 132 199) 0%, rgb(2 132 199) ${((localFilters.location.radius || 5) / 10) * 100}%, rgb(226 232 240) ${((localFilters.location.radius || 5) / 10) * 100}%, rgb(226 232 240) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleRadiusChange(1)}
                      className={`px-2 py-1 rounded ${localFilters.location.radius === 1 ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      1 km
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRadiusChange(3)}
                      className={`px-2 py-1 rounded ${localFilters.location.radius === 3 ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      3 km
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRadiusChange(5)}
                      className={`px-2 py-1 rounded ${localFilters.location.radius === 5 ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      5 km
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRadiusChange(10)}
                      className={`px-2 py-1 rounded ${localFilters.location.radius === 10 ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      10 km
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton pour afficher/masquer les filtres avancés */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 text-sm font-medium text-sky-600 hover:text-sky-700 border-t border-gray-200 flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showAdvanced ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
        </button>

        {/* Filtres avancés */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Quartiers */}
            {neighborhoods.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Quartiers</span>
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {neighborhoods.map((neighborhood) => (
                    <label key={neighborhood} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={localFilters.neighborhoods?.includes(neighborhood) || false}
                        onChange={(e) => {
                          const current = localFilters.neighborhoods || [];
                          const newNeighborhoods = e.target.checked
                            ? [...current, neighborhood]
                            : current.filter(n => n !== neighborhood);
                          handleFilterChange('neighborhoods', newNeighborhoods);
                        }}
                        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-sm text-gray-700">{neighborhood}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Sources</span>
              </h4>
              <div className="space-y-1">
                {EVENT_SOURCES.map((source) => (
                  <label key={source.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={localFilters.sources?.includes(source.id) || false}
                      onChange={(e) => {
                        const current = localFilters.sources || [];
                        const newSources = e.target.checked
                          ? [...current, source.id]
                          : current.filter(s => s !== source.id);
                        handleFilterChange('sources', newSources);
                      }}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-700">{source.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Restriction d'âge */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Restriction d'âge</h4>
              <select
                value={localFilters.ageRestriction || 'Tous'}
                onChange={(e) => handleFilterChange('ageRestriction', e.target.value === 'Tous' ? undefined : e.target.value)}
                className="w-full form-input"
              >
                {AGE_RESTRICTIONS.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            {/* Public cible */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Public cible</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {['Adulte', 'Famille', 'Étudiant', 'Senior', 'Enfant'].map((audience) => (
                  <label key={audience} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={localFilters.targetAudience?.includes(audience) || false}
                      onChange={(e) => {
                        const current = localFilters.targetAudience || [];
                        const newAudience = e.target.checked
                          ? [...current, audience]
                          : current.filter(a => a !== audience);
                        handleFilterChange('targetAudience', newAudience);
                      }}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-700">{audience}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Accessibilité */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Accessibility className="w-4 h-4" />
                <span>Accessibilité</span>
              </h4>
              <div className="space-y-2">
                {[
                  { key: 'wheelchairAccessible', label: 'Accessible en fauteuil roulant' },
                  { key: 'hearingAssistance', label: 'Assistance auditive' },
                  { key: 'visualAssistance', label: 'Assistance visuelle' },
                  { key: 'quietSpace', label: 'Espace calme disponible' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={localFilters.accessibility?.[item.key as keyof typeof localFilters.accessibility] || false}
                      onChange={(e) => {
                        const current = localFilters.accessibility || {};
                        handleFilterChange('accessibility', {
                          ...current,
                          [item.key]: e.target.checked,
                        });
                      }}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SPRINT 2: Filtres par tags structurés */}
            {/* Type d'événement */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Type d'événement</span>
              </h4>
              <select
                value={localFilters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full form-input"
              >
                <option value="">Tous les types</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Ambiance */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Ambiance</span>
              </h4>
              <select
                value={localFilters.ambiance || ''}
                onChange={(e) => handleFilterChange('ambiance', e.target.value || undefined)}
                className="w-full form-input"
              >
                <option value="">Toutes les ambiances</option>
                {AMBIANCES.map((ambiance) => (
                  <option key={ambiance} value={ambiance}>
                    {ambiance.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Public (tags structurés) */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Public (tags structurés)</span>
              </h4>
              <select
                value={localFilters.public || ''}
                onChange={(e) => handleFilterChange('public', e.target.value || undefined)}
                className="w-full form-input"
              >
                <option value="">Tous les publics</option>
                {PUBLICS.map((publicType) => (
                  <option key={publicType} value={publicType}>
                    {publicType === 'tout_public' ? 'Tout public' : 
                     publicType === '18_plus' ? '18+' : 
                     publicType.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default EventFilters;
