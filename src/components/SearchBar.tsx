'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Event } from '@/types';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  /** Requête initiale (ex. depuis l'URL ?q=...) pour afficher et synchroniser la recherche */
  initialQuery?: string;
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

/** Événement brut renvoyé par GET /api/events */
interface ApiEventItem {
  id: string;
  title?: string | null;
  startAt?: string | null;
  venue?: { name?: string | null } | null;
  organizer?: { displayName?: string | null; user?: { name?: string | null } } | null;
  tags?: string[] | null;
}

export default function SearchBar({
  initialQuery = '',
  onSearch,
  placeholder = 'Rechercher des événements, artistes, lieux...',
  events = [],
  showSuggestions = true,
  debounceMs = 200,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Synchroniser la requête depuis l'extérieur (ex. URL ?q=...)
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== query) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, [initialQuery]);

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

  // Appel API pour les suggestions d'événements dès qu'on tape (résultats en direct)
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!showSuggestions || q.length < 1) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setSuggestions([]);
    const controller = new AbortController();
    setIsLoadingSuggestions(true);

    const params = new URLSearchParams({
      q: q,
      pageSize: '15',
      futureOnly: 'true',
    });
    fetch(`/api/events?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Erreur recherche');
        return res.json();
      })
      .then((data: { items?: ApiEventItem[] }) => {
        const items = data.items ?? [];
        const seenVenues = new Set<string>();
        const seenOrgs = new Set<string>();
        const list: SearchSuggestion[] = [];

        items.forEach((ev) => {
          const title = ev.title ?? '';
          const venueName = ev.venue?.name ?? '';
          const orgName = ev.organizer?.displayName ?? ev.organizer?.user?.name ?? '';
          const dateStr = ev.startAt
            ? new Date(ev.startAt).toLocaleDateString('fr-CA', { weekday: 'short', month: 'short', day: 'numeric' })
            : '';
          const subtitle = [venueName, dateStr].filter(Boolean).join(' · ');

          list.push({
            text: title,
            type: 'event',
            eventId: ev.id,
            subtitle,
            relevance: 10,
          });
          if (venueName && !seenVenues.has(venueName)) {
            seenVenues.add(venueName);
            list.push({ text: venueName, type: 'venue', relevance: 7 });
          }
          if (orgName && !seenOrgs.has(orgName)) {
            seenOrgs.add(orgName);
            list.push({ text: orgName, type: 'organizer', relevance: 6 });
          }
        });

        setSuggestions(list.slice(0, 12));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setSuggestions([]);
      })
      .finally(() => {
        setIsLoadingSuggestions(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, showSuggestions]);

  // Fallback: suggestions depuis les events du parent (si pas de requête ou avant réponse API)
  const generateSuggestionsFromEvents = useMemo(() => {
    if (!showSuggestions || !debouncedQuery.trim() || events.length === 0) return [];
    const queryLower = debouncedQuery.toLowerCase().trim();
    const suggestionsList: SearchSuggestion[] = [];
    const seenEventIds = new Set<string>();
    events.forEach((event) => {
      const title = event.title ?? '';
      const venueName = event.location?.name ?? (event as any).venue?.name ?? '';
      const titleMatch = title.toLowerCase().includes(queryLower);
      if (titleMatch && event.id && !seenEventIds.has(event.id)) {
        seenEventIds.add(event.id);
        const subtitle = [venueName, event.startDate ? new Date(event.startDate).toLocaleDateString('fr-CA', { weekday: 'short', month: 'short', day: 'numeric' }) : ''].filter(Boolean).join(' · ');
        suggestionsList.push({ text: title, type: 'event', eventId: event.id, subtitle, relevance: 10 });
      }
    });
    return suggestionsList.slice(0, 10);
  }, [debouncedQuery, events, showSuggestions]);

  // Afficher les suggestions API en priorité; sinon le fallback
  useEffect(() => {
    if (suggestions.length > 0) return;
    setSuggestions(generateSuggestionsFromEvents);
  }, [suggestions.length, generateSuggestionsFromEvents]);

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
      return;
    }
    if (suggestion.type === 'organizer') {
      const event = events.find((e) => e.organizer?.name === suggestion.text);
      if (event?.organizerId) {
        const organizerUrl = event.organizerSlug
          ? `/organisateur/${event.organizerSlug}`
          : `/organisateur/${event.organizerId}`;
        router.push(organizerUrl);
        return;
      }
    }
    if (onSearch) {
      onSearch(suggestion.text);
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
            {(isSearching || isLoadingSuggestions) && suggestions.length === 0 ? (
              <div className="px-4 py-4 flex items-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                <span className="text-sm">Recherche d'événements...</span>
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
