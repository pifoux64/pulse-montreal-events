'use client';

import { useState, useEffect, useRef } from 'react';
import { Tag, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface TagSuggestion {
  value: string;
  label: string;
}

interface TagSearchInputProps {
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function TagSearchInput({
  selectedTags,
  onAddTag,
  placeholder,
  className = '',
  error,
}: TagSearchInputProps) {
  const t = useTranslations('publish');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche des tags existants
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: searchQuery,
          limit: '15',
        });
        const response = await fetch(`/api/tags?${params.toString()}`);
        if (!response.ok) throw new Error('Erreur recherche tags');
        const data = await response.json();
        setSuggestions(data.items || []);
        setShowDropdown((data.items?.length ?? 0) > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Recherche tags:', err);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        inputRef.current && !inputRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onAddTag(trimmed);
      setSearchQuery('');
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: TagSuggestion) => {
    addTag(item.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          return;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          } else {
            addTag(searchQuery);
          }
          return;
        case 'Escape':
          setShowDropdown(false);
          return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(searchQuery);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-start gap-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(e.target.value.length >= 1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder ?? t('addTag')}
          className={`w-full px-3 py-2 pr-10 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
          {suggestions.map((item, index) => {
            const alreadyAdded = selectedTags.includes(item.label);
            return (
              <button
                key={item.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!alreadyAdded) handleSelectSuggestion(item);
                }}
                disabled={alreadyAdded}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-2 ${
                  alreadyAdded
                    ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'hover:bg-blue-50'
                } ${index === selectedIndex && !alreadyAdded ? 'bg-blue-50' : ''} ${
                  index > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {alreadyAdded && (
                  <span className="ml-auto text-xs text-gray-400">(ajouté)</span>
                )}
              </button>
            );
          })}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => addTag(searchQuery)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap"
      >
        {t('add')}
      </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
