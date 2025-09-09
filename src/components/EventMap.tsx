'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Event, MapViewState } from '@/types';
import { MapPin, Calendar, DollarSign, Users, Star } from 'lucide-react';

interface EventMapProps {
  events: Event[];
  center: [number, number];
  zoom: number;
  onEventClick: (event: Event) => void;
  onMapViewChange: (viewState: MapViewState) => void;
  userLocation?: [number, number];
  searchRadius?: number;
}

// Configuration des icônes Leaflet
const createCustomIcon = (color: string) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const EventMap = ({ 
  events, 
  center, 
  zoom, 
  onEventClick, 
  onMapViewChange,
  userLocation,
  searchRadius 
}: EventMapProps) => {
  const mapRef = useRef<any>(null);
  const [map, setMap] = useState<any>(null);

  // Couleurs par catégorie
  const categoryColors: Record<string, string> = {
    'musique': '#e74c3c',
    'art': '#9b59b6',
    'sport': '#3498db',
    'famille': '#f39c12',
    'culture': '#1abc9c',
    'gastronomie': '#e67e22',
    'default': '#95a5a6'
  };

  useEffect(() => {
    if (map) {
      map.on('moveend', () => {
        const bounds = map.getBounds();
        const center = map.getCenter();
        onMapViewChange({
          center: [center.lat, center.lng],
          zoom: map.getZoom(),
          bounds: [
            [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
            [bounds.getNorthEast().lat, bounds.getNorthEast().lng]
          ]
        });
      });
    }
  }, [map, onMapViewChange]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPrice = (price: Event['price']) => {
    if (price.isFree) return 'Gratuit';
    return `${price.amount} ${price.currency}`;
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        ref={mapRef}
        whenCreated={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Cercle de recherche si un rayon est défini */}
        {userLocation && searchRadius && (
          <Circle
            center={userLocation}
            radius={searchRadius * 1000} // Conversion en mètres
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2
            }}
          />
        )}

        {/* Marqueur de la position de l'utilisateur */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={new Icon({
              iconUrl: `data:image/svg+xml;base64,${btoa(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `)}`,
              iconSize: [24, 24],
              iconAnchor: [12, 24],
            })}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-blue-600">Votre position</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marqueurs des événements */}
        {events.map((event) => {
          const color = categoryColors[event.category.toLowerCase()] || categoryColors.default;
          const icon = createCustomIcon(color);
          
          return (
            <Marker
              key={event.id}
              position={[event.location.coordinates.lat, event.location.coordinates.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onEventClick(event)
              }}
            >
              <Popup>
                <div className="min-w-[250px] p-2">
                  <div className="flex items-start space-x-3">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{formatPrice(event.price)}</span>
                        </div>
                        
                        {event.maxCapacity && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{event.currentAttendees}/{event.maxCapacity} participants</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => onEventClick(event)}
                        className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default EventMap;
