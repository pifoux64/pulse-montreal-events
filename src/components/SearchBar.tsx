'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Event } from '@/types';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  events?: Event[];
  showSuggestions?: boolean;
  debounceMs?: number;
}

interface SearchSuggestion {
  text: string;
  type: 'event' | 'venue' | 'organizer' | 'genre' | 'tag';
  eventId?: string;
  subtitle?: string;
  relevance: number;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Rechercher des événements, artistes, lieux...',
  events = [],
  showSuggestions = true,
  debounceMs = 200,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounce de la requête
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (onSearch) {
        onSearch(query);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  // Génération des suggestions (événements en priorité, avec sous-titre lieu/date)
  const generateSuggestions = useMemo(() => {
    if (!showSuggestions || !debouncedQuery.trim()) {
      return [];
    }

    const queryLower = debouncedQuery.toLowerCase().trim();
    const suggestionsList: SearchSuggestion[] = [];
    const seenEventIds = new Set<string>();
    const seenText = new Set<string>();

    // Si on a des événements, chercher dedans
    if (events.length > 0) {
      events.forEach((event) => {
        const title = event.title ?? '';
        const desc = (event.description ?? '').toLowerCase();
        const venueName = event.location?.name ?? (event as any).venue?.name ?? '';
        const organizerName = event.organizer?.name ?? '';
        const tags = event.tags ?? [];

        const titleMatch = title.toLowerCase().includes(queryLower);
        const descMatch = queryLower.length >= 2 && desc.includes(queryLower);
        const venueMatch = venueName && venueName.toLowerCase().includes(queryLower);
        const organizerMatch = organizerName && organizerName.toLowerCase().includes(queryLower);
        const tagMatch = tags.some((tag: string) => String(tag).toLowerCase().includes(queryLower));

        if (titleMatch && event.id && !seenEventIds.has(event.id)) {
          seenEventIds.add(event.id);
          const subtitle = [venueName, event.startDate ? new Date(event.startDate).toLocaleDateString('fr-CA', { weekday: 'short', month: 'short', day: 'numeric' }) : ''].filter(Boolean).join(' · ');
          suggestionsList.push({
            text: title,
            type: 'event',
            eventId: event.id,
            subtitle,
            relevance: 10,
          });
        }

        if (venueMatch && venueName && !seenText.has(`venue:${venueName}`)) {
          seenText.add(`venue:${venueName}`);
          suggestionsList.push({
            text: venueName,
            type: 'venue',
            relevance: 7,
          });
        }

        if (organizerMatch && organizerName && !seenText.has(`org:${organizerName}`)) {
          seenText.add(`org:${organizerName}`);
          suggestionsList.push({
            text: organizerName,
            type: 'organizer',
            relevance: 6,
          });
        }

        if (tagMatch) {
          tags.forEach((tag: string) => {
            const t = String(tag);
            if (t.toLowerCase().includes(queryLower) && !seenText.has(`tag:${t}`)) {
              seenText.add(`tag:${t}`);
              suggestionsList.push({
                text: t,
                type: 'tag',
                relevance: 5,
              });
            }
          });
        }
      });
    }

    // Trier par pertinence et limiter (événements en premier)
    const sorted = suggestionsList
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);

    return sorted;
  }, [debouncedQuery, events, showSuggestions]);

  useEffect(() => {
    setSuggestions(generateSuggestions);
  }, [generateSuggestions]);

  // Ouvrir le menu dès qu'on tape au moins 1 caractère
  useEffect(() => {
    if (query.trim().length >= 1 && showSuggestions) {
      setShowSuggestionsList(true);
    } else if (query.trim().length === 0) {
      setShowSuggestionsList(false);
    }
  }, [query, showSuggestions]);

  // Fermer les suggestions en cliquant à l'extérieur (click pour ne pas fermer avant le clic sur une suggestion)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestionsList(false);

    if (suggestion.type === 'event' && suggestion.eventId) {
      router.push(`/evenement/${suggestion.eventId}`);
    } else if (suggestion.type === 'organizer') {
      const event = events.find((e) => e.organizer?.name === suggestion.text);
      if (event?.organizerId) {
        const organizerUrl = event.organizerSlug
          ? `/organisateur/${event.organizerSlug}`
          : `/organisateur/${event.organizerId}`;
        router.push(organizerUrl);
      }
    } else {
      if (onSearch) {
        onSearch(suggestion.text);
      }
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'event':
        return <Clock className="w-4 h-4" />;
      case 'venue':
        return <Search className="w-4 h-4" />;
      case 'organizer':
        return <Search className="w-4 h-4" />;
      case 'tag':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'event':
        return 'Événement';
      case 'venue':
        return 'Lieu';
      case 'organizer':
        return 'Organisateur';
      case 'tag':
        return 'Tag';
      default:
        return '';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsSearching(true);
            setShowSuggestionsList(e.target.value.trim().length >= 1);
            setTimeout(() => setIsSearching(false), 150);
          }}
          onFocus={() => {
            if (query.trim().length >= 1) {
              setShowSuggestionsList(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-base"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowSuggestionsList(false);
              if (onSearch) {
                onSearch('');
              }
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu de suggestions : ouvert dès qu'on tape */}
      {showSuggestionsList && query.trim().length >= 1 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {isSearching && suggestions.length === 0 ? (
              <div className="px-4 py-4 flex items-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                <span className="text-sm">Recherche en cours...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500">
                Aucun événement ou lieu trouvé pour « {query.trim()} »
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.eventId ? `event-${suggestion.eventId}` : `${suggestion.type}-${suggestion.text}-${index}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSuggestionClick(suggestion);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors duration-150 text-left border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-shrink-0 text-emerald-600">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {suggestion.subtitle ?? getSuggestionLabel(suggestion.type)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
