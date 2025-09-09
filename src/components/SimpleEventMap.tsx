'use client';

import { useEffect, useRef, useState } from 'react';
import { Event, MapViewState } from '@/types';
import { MapPin, Calendar, DollarSign, Clock } from 'lucide-react';

interface SimpleEventMapProps {
  events: Event[];
  center: [number, number];
  zoom: number;
  onEventClick: (event: Event) => void;
  onLocationClick?: (events: Event[], locationName: string) => void;
  onMapViewChange: (viewState: MapViewState) => void;
  userLocation?: [number, number] | null;
  searchRadius?: number;
}

const SimpleEventMap = ({
  events,
  center,
  zoom,
  onEventClick,
  onLocationClick,
  onMapViewChange,
  userLocation,
  searchRadius
}: SimpleEventMapProps) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Couleurs pour les marqueurs
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
    'default': '#7C3AED'
  };

  // Grouper les événements par lieu
  const groupEventsByLocation = (events: Event[]) => {
    const groups = new Map<string, Event[]>();
    
    events.forEach(event => {
      const lat = Math.round(event.location.coordinates.lat * 1000) / 1000;
      const lng = Math.round(event.location.coordinates.lng * 1000) / 1000;
      const key = `${event.location.name}-${lat}-${lng}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(event);
    });
    
    return Array.from(groups.values());
  };

  const locationGroups = groupEventsByLocation(events);

  // Initialiser la carte avec MapLibre GL JS directement
  useEffect(() => {
    const initMap = async () => {
      try {
        // Import dynamique de MapLibre GL
        const maplibregl = await import('maplibre-gl');
        
        if (!mapRef.current || mapInstanceRef.current) return;

        // Créer la carte
        const map = new maplibregl.Map({
          container: mapRef.current,
          style: {
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
          },
          center: [center[1], center[0]], // [lng, lat]
          zoom: zoom,
          attributionControl: false
        });

        // Attendre que la carte soit chargée
        map.on('load', () => {
          setMapLoaded(true);
          
          // Ajouter les contrôles
          map.addControl(new maplibregl.NavigationControl(), 'top-right');
          map.addControl(new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
          }), 'top-right');
          map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

          // Ajouter les marqueurs
          locationGroups.forEach((locationEvents, index) => {
            const firstEvent = locationEvents[0];
            const eventCount = locationEvents.length;
            const primaryColor = categoryColors[firstEvent.category.toLowerCase()] || categoryColors.default;

            // Créer l'élément du marqueur
            const markerElement = document.createElement('div');
            markerElement.className = 'custom-marker';
            markerElement.style.cssText = `
              width: ${eventCount > 1 ? '36px' : '32px'};
              height: ${eventCount > 1 ? '36px' : '32px'};
              background-color: ${primaryColor};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              box-shadow: 0 0 20px ${primaryColor}40, 0 4px 15px rgba(0,0,0,0.3);
              transition: transform 0.3s ease;
              color: white;
              font-weight: bold;
              font-size: ${eventCount > 1 ? '14px' : '12px'};
            `;
            
            markerElement.innerHTML = eventCount > 1 ? eventCount.toString() : '📍';
            
            // Ajouter l'effet hover
            markerElement.addEventListener('mouseenter', () => {
              markerElement.style.transform = 'scale(1.25)';
            });
            markerElement.addEventListener('mouseleave', () => {
              markerElement.style.transform = 'scale(1)';
            });

            // Créer le marqueur
            const marker = new maplibregl.Marker(markerElement)
              .setLngLat([firstEvent.location.coordinates.lng, firstEvent.location.coordinates.lat])
              .addTo(map);

            // Ajouter l'événement de clic
            markerElement.addEventListener('click', () => {
              if (eventCount === 1) {
                setSelectedEvent(firstEvent);
                onEventClick(firstEvent);
              } else if (onLocationClick) {
                onLocationClick(locationEvents, firstEvent.location.name);
              }
            });
          });

          // Ajouter marqueur utilisateur si disponible
          if (userLocation) {
            const userMarkerElement = document.createElement('div');
            userMarkerElement.style.cssText = `
              width: 16px;
              height: 16px;
              background-color: #3b82f6;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.7);
              animation: pulse 2s infinite;
            `;

            new maplibregl.Marker(userMarkerElement)
              .setLngLat([userLocation[1], userLocation[0]])
              .addTo(map);
          }
        });

        // Gérer les changements de vue
        map.on('moveend', () => {
          const center = map.getCenter();
          const zoom = map.getZoom();
          onMapViewChange({
            center: [center.lat, center.lng],
            zoom: zoom
          });
        });

        mapInstanceRef.current = map;

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, userLocation]);

  // Mettre à jour les marqueurs quand les événements changent
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    // Cette logique pourrait être étendue pour mettre à jour les marqueurs dynamiquement
    // Pour l'instant, on recharge la carte complète
  }, [events, mapLoaded]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative">
      {/* Conteneur de la carte */}
      <div 
        ref={mapRef} 
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Indicateur de chargement */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Styles CSS pour les animations */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default SimpleEventMap;
