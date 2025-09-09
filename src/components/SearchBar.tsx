'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, MapPin, Calendar, Tag } from 'lucide-react';
import { Event } from '@/types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  events?: Event[];
}

interface SearchSuggestion {
  type: 'event' | 'location' | 'category' | 'tag';
  text: string;
  icon: React.ReactNode;
  relevance: number;
}

const SearchBar = ({ onSearch, placeholder = "Rechercher un événement...", className = "", events = [] }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Charger les recherches récentes depuis le localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Erreur lors du chargement des recherches récentes:', error);
      }
    }

    // Recherches tendance simulées
    setTrendingSearches([
      'festival jazz',
      'exposition art',
      'sport montréal',
      'activités famille',
      'restaurant gastronomique'
    ]);
  }, []);

  // Sauvegarder les recherches récentes
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Générer les suggestions basées sur la requête
  useEffect(() => {
    if (!query.trim() || !events.length) {
      setSuggestions([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Suggestions d'événements
    events.forEach(event => {
      if (event.title.toLowerCase().includes(queryLower)) {
        newSuggestions.push({
          type: 'event',
          text: event.title,
          icon: <Calendar className="w-4 h-4" />,
          relevance: 10
        });
      }
    });

    // Suggestions de lieux
    const locations = new Set(events.map(e => e.location.name));
    locations.forEach(location => {
      if (location.toLowerCase().includes(queryLower)) {
        newSuggestions.push({
          type: 'location',
          text: location,
          icon: <MapPin className="w-4 h-4" />,
          relevance: 8
        });
      }
    });

    // Suggestions de catégories
    const categories = new Set(events.map(e => e.category));
    categories.forEach(category => {
      if (category.toLowerCase().includes(queryLower)) {
        newSuggestions.push({
          type: 'category',
          text: category,
          icon: <Tag className="w-4 h-4" />,
          relevance: 6
        });
      }
    });

    // Suggestions de tags
    const allTags = events.flatMap(e => e.tags);
    const uniqueTags = new Set(allTags);
    uniqueTags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        newSuggestions.push({
          type: 'tag',
          text: tag,
          icon: <Tag className="w-4 h-4" />,
          relevance: 4
        });
      }
    });

    // Trier par pertinence et limiter le nombre
    newSuggestions.sort((a, b) => b.relevance - a.relevance);
    setSuggestions(newSuggestions.slice(0, 8));
  }, [query, events]);

  // Gérer le clic en dehors pour fermer les suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      onSearch(query);
      setShowSuggestions(false);
      setQuery('');
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    saveRecentSearch(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    setQuery('');
  };

  const handleRecentSearchClick = (search: string) => {
    onSearch(search);
    setShowSuggestions(false);
    setQuery('');
  };

  const handleTrendingSearchClick = (search: string) => {
    onSearch(search);
    setShowSuggestions(false);
    setQuery('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const removeRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions et historique */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Suggestions en temps réel */}
          {suggestions.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors duration-200"
                  >
                    <span className="text-gray-400">{suggestion.icon}</span>
                    <span className="text-gray-700">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recherches récentes */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Recherches récentes</h4>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Effacer tout
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-md group">
                    <button
                      onClick={() => handleRecentSearchClick(search)}
                      className="flex items-center space-x-3 flex-1 text-left"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{search}</span>
                    </button>
                    <button
                      onClick={() => removeRecentSearch(search)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recherches tendance */}
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tendances</h4>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleTrendingSearchClick(search)}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors duration-200"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conseils de recherche */}
          <div className="p-3 bg-gray-50 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Conseils de recherche</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Utilisez des mots-clés comme "jazz", "festival", "gratuit"</p>
              <p>• Ajoutez une ville ou un quartier pour affiner</p>
              <p>• Combinez plusieurs termes pour des résultats plus précis</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

