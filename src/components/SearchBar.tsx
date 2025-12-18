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
  relevance: number;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Rechercher des événements, artistes, lieux...',
  events = [],
  showSuggestions = true,
  debounceMs = 300,
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

  // Génération des suggestions
  const generateSuggestions = useMemo(() => {
    if (!showSuggestions || !debouncedQuery.trim() || events.length === 0) {
      return [];
    }

    const queryLower = debouncedQuery.toLowerCase().trim();
    const suggestionsList: SearchSuggestion[] = [];

    // Rechercher dans les événements
    events.forEach((event) => {
      const titleMatch = event.title.toLowerCase().includes(queryLower);
      const descMatch = event.description.toLowerCase().includes(queryLower);
      const venueMatch = event.location?.name?.toLowerCase().includes(queryLower);
      const organizerMatch = event.organizer?.name?.toLowerCase().includes(queryLower);
      const tagMatch = event.tags.some(tag => tag.toLowerCase().includes(queryLower));

      if (titleMatch) {
        suggestionsList.push({
          text: event.title,
          type: 'event',
          eventId: event.id,
          relevance: 10,
        });
      }

      if (venueMatch && event.location?.name) {
        suggestionsList.push({
          text: event.location.name,
          type: 'venue',
          relevance: 7,
        });
      }

      if (organizerMatch && event.organizer?.name) {
        suggestionsList.push({
          text: event.organizer.name,
          type: 'organizer',
          relevance: 6,
        });
      }

      if (tagMatch) {
        event.tags.forEach(tag => {
          if (tag.toLowerCase().includes(queryLower)) {
            suggestionsList.push({
              text: tag,
              type: 'tag',
              relevance: 5,
            });
          }
        });
      }
    });

    // Dédupliquer et trier par pertinence
    const uniqueSuggestions = Array.from(
      new Map(suggestionsList.map(s => [s.text, s])).values()
    ).sort((a, b) => b.relevance - a.relevance).slice(0, 8);

    return uniqueSuggestions;
  }, [debouncedQuery, events, showSuggestions]);

  useEffect(() => {
    setSuggestions(generateSuggestions);
    setShowSuggestionsList(generateSuggestions.length > 0 && debouncedQuery.trim().length > 0);
  }, [generateSuggestions, debouncedQuery]);

  // Fermer les suggestions en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestionsList(false);
    
    if (suggestion.type === 'event' && suggestion.eventId) {
      router.push(`/evenement/${suggestion.eventId}`);
    } else if (suggestion.type === 'organizer') {
      // Rechercher l'organisateur et rediriger
      const event = events.find(e => e.organizer?.name === suggestion.text);
      if (event?.organizerId) {
        router.push(`/organisateur/${event.organizerId}`);
      }
    } else {
      // Recherche normale
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
            setTimeout(() => setIsSearching(false), 200);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
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

      {/* Suggestions */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
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
                    {getSuggestionLabel(suggestion.type)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
