'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  neighborhood?: string | null;
  lat?: number | null;
  lon?: number | null;
}

interface VenueSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onVenueSelect?: (venue: Venue) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function VenueSearchInput({
  value,
  onChange,
  onVenueSelect,
  placeholder,
  className = '',
  error,
}: VenueSearchInputProps) {
  const t = useTranslations('publish');
  const [searchQuery, setSearchQuery] = useState(value);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchroniser searchQuery avec value
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Recherche des venues
  useEffect(() => {
    // Nettoyer le timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Si la recherche est vide ou trop courte, ne pas chercher
    if (!searchQuery || searchQuery.length < 2) {
      setVenues([]);
      setShowDropdown(false);
      return;
    }

    // Délai de debounce (300ms)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: searchQuery,
          pageSize: '10', // Limiter à 10 résultats pour l'autocomplétion
        });

        const response = await fetch(`/api/venues?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la recherche');
        }

        const data = await response.json();
        setVenues(data.items || []);
        setShowDropdown(data.items && data.items.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Erreur recherche venues:', error);
        setVenues([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fermer le dropdown si on clique en dehors (utilisation de click pour éviter de fermer avant la sélection)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setShowDropdown(newValue.length >= 2);
  };

  const handleVenueSelect = (venue: Venue) => {
    setSearchQuery(venue.name);
    onChange(venue.name);
    setShowDropdown(false);
    setVenues([]);
    
    if (onVenueSelect) {
      onVenueSelect(venue);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange('');
    setShowDropdown(false);
    setVenues([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || venues.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < venues.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < venues.length) {
          handleVenueSelect(venues[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (venues.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder || t('venueNamePlaceholder')}
          className={`w-full px-3 py-2 pr-10 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        
        {/* Icône de chargement ou bouton clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}
          {!isLoading && searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown des résultats */}
      {showDropdown && venues.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {venues.map((venue, index) => (
            <button
              key={venue.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVenueSelect(venue);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {venue.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {venue.address}
                    {venue.neighborhood && ` • ${venue.neighborhood}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {venue.city} {venue.postalCode}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
