'use client';

import { useState } from 'react';
import { ChevronDown, SortAsc, SortDesc, Calendar, MapPin, DollarSign, Star, Users } from 'lucide-react';

export interface SortOption {
  key: string;
  label: string;
  icon: React.ReactNode;
  direction: 'asc' | 'desc';
}

interface EventSortProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

const EventSort = ({ currentSort, onSortChange, className = "" }: EventSortProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: SortOption[] = [
    {
      key: 'date',
      label: 'Date',
      icon: <Calendar className="w-4 h-4" />,
      direction: 'asc'
    },
    {
      key: 'date-desc',
      label: 'Date (plus récent)',
      icon: <Calendar className="w-4 h-4" />,
      direction: 'desc'
    },
    {
      key: 'title',
      label: 'Titre A-Z',
      icon: <SortAsc className="w-4 h-4" />,
      direction: 'asc'
    },
    {
      key: 'title-desc',
      label: 'Titre Z-A',
      icon: <SortDesc className="w-4 h-4" />,
      direction: 'desc'
    },
    {
      key: 'price',
      label: 'Prix (croissant)',
      icon: <DollarSign className="w-4 h-4" />,
      direction: 'asc'
    },
    {
      key: 'price-desc',
      label: 'Prix (décroissant)',
      icon: <DollarSign className="w-4 h-4" />,
      direction: 'desc'
    },
    {
      key: 'popularity',
      label: 'Popularité',
      icon: <Star className="w-4 h-4" />,
      direction: 'desc'
    },
    {
      key: 'capacity',
      label: 'Capacité',
      icon: <Users className="w-4 h-4" />,
      direction: 'desc'
    },
    {
      key: 'distance',
      label: 'Distance',
      icon: <MapPin className="w-4 h-4" />,
      direction: 'asc'
    }
  ];

  const handleSortChange = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.key === currentSort.key);
    return option ? option.label : 'Trier par';
  };

  const getCurrentSortIcon = () => {
    const option = sortOptions.find(opt => opt.key === currentSort.key);
    return option ? option.icon : <SortAsc className="w-4 h-4" />;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          {getCurrentSortIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getCurrentSortLabel()}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
              Options de tri
            </div>
            
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSortChange(option)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${
                    currentSort.key === option.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`text-gray-400 ${
                    currentSort.key === option.key ? 'text-blue-500' : ''
                  }`}>
                    {option.icon}
                  </div>
                  <span className="text-sm">{option.label}</span>
                  {currentSort.key === option.key && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSort;

