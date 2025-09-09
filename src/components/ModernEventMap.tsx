'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, ScaleControl } from 'react-map-gl/maplibre';
import { Event, MapViewState } from '@/types';
import { MapPin, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ModernEventMapProps {
  events: Event[];
  center: [number, number];
  zoom: number;
  onEventClick: (event: Event) => void;
  onMapViewChange: (viewState: MapViewState) => void;
  userLocation?: [number, number] | null;
  searchRadius?: number;
}

const ModernEventMap = ({
  events,
  center,
  zoom,
  onEventClick,
  onMapViewChange,
  userLocation,
  searchRadius
}: ModernEventMapProps) => {
  const mapRef = useRef<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: zoom,
    bearing: 0,
    pitch: 0
  });

  // Style moderne CARTO Light (gratuit, sans clé API)
  const MAP_STYLE = {
    version: 8,
    sources: {
      'carto-light': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        ],
        tileSize: 256,
        attribution: '© CARTO © OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'carto-tiles',
        type: 'raster',
        source: 'carto-light'
      }
    ]
  };

  // Couleurs modernes pour fond clair
  const categoryColors: Record<string, string> = {
    'musique': '#E11D48',
    'music': '#E11D48',
    'art': '#059669',
    'arts & theatre': '#059669',
    'sport': '#2563EB',
    'sports': '#2563EB',
    'famille': '#DC2626',
    'family': '#DC2626',
    'culture': '#D97706',
    'community': '#D97706',
    'gastronomie': '#C026D3',
    'education': '#C026D3',
    'default': '#7C3AED'
  };

  // Fonction pour créer un marqueur personnalisé
  const createMarkerElement = (event: Event) => {
    const color = categoryColors[event.category.toLowerCase()] || categoryColors.default;
    
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.cssText = `
      width: 32px;
      height: 32px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      position: relative;
    `;
    
    markerElement.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;

    markerElement.addEventListener('mouseenter', () => {
      markerElement.style.transform = 'scale(1.2)';
      markerElement.style.zIndex = '1000';
    });

    markerElement.addEventListener('mouseleave', () => {
      markerElement.style.transform = 'scale(1)';
      markerElement.style.zIndex = '1';
    });

    return markerElement;
  };

  const handleMapMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    onMapViewChange({
      center: [evt.viewState.latitude, evt.viewState.longitude],
      zoom: evt.viewState.zoom,
      bounds: [
        [evt.viewState.latitude - 0.1, evt.viewState.longitude - 0.1],
        [evt.viewState.latitude + 0.1, evt.viewState.longitude + 0.1]
      ]
    });
  }, [onMapViewChange]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPrice = (price: Event['price']) => {
    if (price.isFree) return 'Gratuit';
    return `${price.amount} ${price.currency}`;
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMapMove}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        logoPosition="bottom-left"
      >
        {/* Contrôles de navigation */}
        <NavigationControl position="top-right" />
        
        {/* Contrôle de géolocalisation */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showAccuracyCircle={false}
        />
        
        {/* Échelle */}
        <ScaleControl position="bottom-left" />

        {/* Marqueur de position utilisateur */}
        {userLocation && (
          <Marker
            longitude={userLocation[1]}
            latitude={userLocation[0]}
            anchor="center"
          >
            <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg pulse-animation"></div>
          </Marker>
        )}

        {/* Marqueurs des événements */}
        {events.map((event) => (
          <Marker
            key={event.id}
            longitude={event.location.coordinates.lng}
            latitude={event.location.coordinates.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedEvent(event);
              onEventClick(event);
            }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-2xl cursor-pointer transition-all duration-300 hover:scale-125 flex items-center justify-center relative"
              style={{ 
                backgroundColor: categoryColors[event.category.toLowerCase()] || categoryColors.default,
                zIndex: selectedEvent?.id === event.id ? 1000 : 1,
                boxShadow: `0 0 20px ${categoryColors[event.category.toLowerCase()] || categoryColors.default}40, 0 4px 15px rgba(0,0,0,0.3)`
              }}
            >
              <MapPin className="w-4 h-4 text-white drop-shadow-sm" />
            </div>
          </Marker>
        ))}

        {/* Popup moderne pour l'événement sélectionné */}
        {selectedEvent && (
          <Popup
            longitude={selectedEvent.location.coordinates.lng}
            latitude={selectedEvent.location.coordinates.lat}
            anchor="bottom"
            onClose={() => setSelectedEvent(null)}
            closeButton={true}
            closeOnClick={false}
            className="modern-popup"
          >
            <div className="p-4 min-w-[280px] max-w-[320px] bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <div className="flex items-start space-x-3">
                {selectedEvent.imageUrl && (
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0 ring-2 ring-white/10"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm leading-tight mb-2 line-clamp-2">
                    {selectedEvent.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span>{formatDate(selectedEvent.startDate)}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{formatTime(selectedEvent.startDate)}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                      <span className="truncate">{selectedEvent.location.name}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      <span className="font-medium">{formatPrice(selectedEvent.price)}</span>
                    </div>

                    {selectedEvent.maxCapacity && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-purple-500 flex-shrink-0" />
                        <span>{selectedEvent.currentAttendees}/{selectedEvent.maxCapacity}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => onEventClick(selectedEvent)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Détails
                    </button>
                    {selectedEvent.ticketUrl && (
                      <a
                        href={selectedEvent.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 text-center"
                      >
                        Billets
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Styles CSS pour les animations */}
      <style jsx>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        .modern-popup .maplibregl-popup-content {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
          border: none !important;
          padding: 0 !important;
        }

        .modern-popup .maplibregl-popup-tip {
          border-top-color: white !important;
        }
      `}</style>
    </div>
  );
};

export default ModernEventMap;
