'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  
  // Debug: afficher le nombre d'événements reçus
  console.log('SimpleEventMap reçoit:', events.length, 'événements');

  // Couleurs pour les marqueurs - MAPPÉES SELON LES VRAIES CATÉGORIES API
  const categoryColors: Record<string, string> = {
    // Catégories principales de l'API
    'music': '#E11D48',           // Rouge pour musique (266 événements)
    'sports': '#2563EB',          // Bleu pour sports (140 événements)
    'sport': '#2563EB',           // Bleu pour sport (variante)
    'arts & theatre': '#059669',  // Vert pour arts & théâtre (28 événements)
    'art & culture': '#059669',   // Vert pour art & culture (variante)
    'community': '#D97706',       // Orange pour community (17 événements)
    'miscellaneous': '#9333ea',   // Violet pour miscellaneous (52 événements)
    'education': '#f59e0b',       // Jaune pour education
    'gastronomie': '#C026D3',     // Magenta pour gastronomie
    'famille': '#DC2626',         // Rouge foncé pour famille
    'family': '#DC2626',          // Rouge foncé pour family
    
    // Fallbacks français
    'musique': '#E11D48',
    'culture': '#D97706',
    'autre': '#6b7280',
    'food': '#C026D3',
    
    // Défaut
    'default': '#6b7280'
  };

  // Grouper les événements par lieu
  const groupEventsByLocation = (events: Event[]) => {
    const groups = new Map<string, Event[]>();
    
    events.forEach(event => {
      // Support pour les deux structures de données
      const lat = event.location?.coordinates?.lat || (event as any).lat || 45.5088;
      const lng = event.location?.coordinates?.lng || (event as any).lon || -73.5542;
      const locationName = event.location?.name || (event as any).venue?.name || 'Lieu inconnu';
      
      const latRounded = Math.round(lat * 1000) / 1000;
      const lngRounded = Math.round(lng * 1000) / 1000;
      const key = `${locationName}-${latRounded}-${lngRounded}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(event);
    });
    
    return Array.from(groups.values());
  };

  // Grouper les événements de manière stable
  const locationGroups = useMemo(() => groupEventsByLocation(events), [events]);
  
  // Référence pour les marqueurs actuels
  const markersRef = useRef<any[]>([]);

  // Fonction de nettoyage des marqueurs
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    markersRef.current = [];
  }, []);

  // Stabiliser onMapViewChange pour éviter les re-renders
  const stableOnMapViewChange = useCallback((viewState: MapViewState) => {
    // Throttle les appels pour éviter trop de mises à jour
    onMapViewChange(viewState);
  }, [onMapViewChange]);

  // Initialiser la carte avec MapLibre GL JS directement
  useEffect(() => {
    const initMap = async () => {
      try {
        // Import dynamique de MapLibre GL
        const maplibregl = await import('maplibre-gl');
        
        // Rendre MapLibre disponible globalement pour les autres useEffect
        (window as any).maplibregl = maplibregl;
        
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
            const category = firstEvent.category?.toLowerCase() || 'default';
            const primaryColor = categoryColors[category] || categoryColors.default;
            
            // Debug: afficher les catégories pour le débogage
            if (index < 5) {
              console.log(`Événement ${index}:`, {
                title: firstEvent.title,
                category: firstEvent.category,
                categoryLower: category,
                color: primaryColor
              });
            }

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

            // Créer le marqueur avec support pour les deux structures
            const lat = firstEvent.location?.coordinates?.lat || (firstEvent as any).lat || 45.5088;
            const lng = firstEvent.location?.coordinates?.lng || (firstEvent as any).lon || -73.5542;
            
            const marker = new maplibregl.Marker(markerElement)
              .setLngLat([lng, lat])
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

        // Gérer les changements de vue avec throttling
        let moveTimeout: NodeJS.Timeout;
        map.on('moveend', () => {
          clearTimeout(moveTimeout);
          moveTimeout = setTimeout(() => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            stableOnMapViewChange({
              center: [center.lat, center.lng],
              zoom: zoom
            });
          }, 100); // Throttle à 100ms
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
        clearMarkers();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Seulement à l'initialisation

  // Mettre à jour la vue de la carte quand center/zoom changent
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    map.flyTo({
      center: [center[1], center[0]], // [lng, lat]
      zoom: zoom,
      duration: 1000
    });
  }, [center, zoom]);

  // Mettre à jour les marqueurs quand les événements changent
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || locationGroups.length === 0) return;

    const map = mapInstanceRef.current;
    
    // Nettoyer les anciens marqueurs
    clearMarkers();

    // Ajouter les nouveaux marqueurs
    locationGroups.forEach((locationEvents, index) => {
      const firstEvent = locationEvents[0];
      const eventCount = locationEvents.length;
      const category = firstEvent.category?.toLowerCase() || 'default';
      const primaryColor = categoryColors[category] || categoryColors.default;
      
      // Debug: afficher les catégories pour le débogage
      if (index < 10) {
        console.log(`🎨 Pin ${index}:`, {
          title: firstEvent.title,
          category: firstEvent.category,
          categoryLower: category,
          color: primaryColor,
          eventCount: eventCount,
          availableColors: Object.keys(categoryColors)
        });
      }

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
        z-index: 1000;
      `;
      
      markerElement.innerHTML = eventCount > 1 ? eventCount.toString() : '📍';
      
      // Ajouter les effets hover
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.25)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Créer le marqueur avec support pour les deux structures
      const lat = firstEvent.location?.coordinates?.lat || (firstEvent as any).lat || 45.5088;
      const lng = firstEvent.location?.coordinates?.lng || (firstEvent as any).lon || -73.5542;
      
      // Utiliser l'import MapLibre depuis l'instance de la carte
      const maplibregl = (window as any).maplibregl;
      if (!maplibregl) {
        console.error('MapLibre GL non disponible');
        return;
      }
      
      const marker = new maplibregl.Marker(markerElement)
        .setLngLat([lng, lat])
        .addTo(map);

      // Stocker la référence du marqueur
      markersRef.current.push(marker);

      // Ajouter l'événement de clic
      markerElement.addEventListener('click', () => {
        console.log('Clic sur marqueur:', firstEvent.title);
        if (eventCount === 1) {
          setSelectedEvent(firstEvent);
          onEventClick(firstEvent);
        } else if (onLocationClick) {
          const locationName = firstEvent.location?.name || (firstEvent as any).venue?.name || 'Lieu inconnu';
          onLocationClick(locationEvents, locationName);
        }
      });
    });
  }, [mapLoaded, locationGroups, clearMarkers, onEventClick, onLocationClick]);

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
