'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Search, MapPin, Calendar, DollarSign, Users, Accessibility } from 'lucide-react';
import { EventFilter, EventCategory } from '@/types';

interface EventFiltersProps {
  filters: EventFilter;
  onFiltersChange: (filters: EventFilter) => void;
  categories: EventCategory[];
  onLocationDetect: () => void;
}

const EventFilters = ({ filters, onFiltersChange, categories, onLocationDetect }: EventFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState<EventFilter>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof EventFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    handleFilterChange('searchQuery', value);
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
      handleFilterChange('location', { ...localFilters.location, radius });
    }
  };

  const clearFilters = () => {
    const clearedFilters: EventFilter = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.subCategories?.length) count += filters.subCategories.length;
    if (filters.dateRange?.start || filters.dateRange?.end) count += 1;
    if (filters.priceRange?.min || filters.priceRange?.max) count += 1;
    if (filters.location?.radius) count += 1;
    if (filters.searchQuery) count += 1;
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={localFilters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
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
              <label className="block text-xs text-light-600 mb-1">Max</label>
              <input
                type="number"
                placeholder="100"
                value={localFilters.priceRange?.max || ''}
                onChange={(e) => handlePriceRangeChange(localFilters.priceRange?.min?.toString() || '', e.target.value)}
                className="form-input"
              />
            </div>
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
                <label className="block text-xs text-gray-600 mb-1">Rayon (km)</label>
                <select
                  value={localFilters.location.radius || 5}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="form-input"
                >
                  <option value={1}>1 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filtres étendus */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
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
                      className="rounded border-gray-300 text-pulse-primary focus:ring-pulse-primary"
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
                      className="rounded border-gray-300 text-pulse-primary focus:ring-pulse-primary"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default EventFilters;
