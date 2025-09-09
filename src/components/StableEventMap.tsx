'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Event, MapViewState } from '@/types';

interface StableEventMapProps {
  events: Event[];
  center: [number, number];
  zoom: number;
  onEventClick: (event: Event) => void;
  onLocationClick?: (events: Event[], locationName: string) => void;
  onMapViewChange: (viewState: MapViewState) => void;
  userLocation?: [number, number] | null;
  searchRadius?: number;
}

const StableEventMap = ({
  events,
  center,
  zoom,
  onEventClick,
  onLocationClick,
  onMapViewChange,
  userLocation,
  searchRadius
}: StableEventMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Couleurs fixes pour les catégories
  const CATEGORY_COLORS = {
    'music': '#E11D48',           // Rouge pour musique
    'sports': '#2563EB',          // Bleu pour sports
    'sport': '#2563EB',           // Bleu pour sport
    'arts & theatre': '#059669',  // Vert pour arts & théâtre
    'art & culture': '#059669',   // Vert pour art & culture
    'community': '#D97706',       // Orange pour community
    'miscellaneous': '#9333ea',   // Violet pour miscellaneous
    'education': '#f59e0b',       // Jaune pour education
    'gastronomie': '#C026D3',     // Magenta pour gastronomie
    'famille': '#DC2626',         // Rouge foncé pour famille
    'family': '#DC2626',          // Rouge foncé pour family
    'musique': '#E11D48',         // Fallback français
    'culture': '#D97706',         // Fallback français
    'autre': '#6b7280',           // Fallback français
    'food': '#C026D3',            // Fallback anglais
    'default': '#6b7280'          // Couleur par défaut
  } as const;

  // Fonction stable pour nettoyer tous les marqueurs
  const clearAllMarkers = useCallback(() => {
    console.log('🧹 Nettoyage de', markersRef.current.length, 'marqueurs');
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markersRef.current = [];
  }, []); // Fonction stable

  // Fonction stable pour grouper les événements par lieu
  const groupEventsByLocation = useCallback((events: Event[]) => {
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
  }, []); // Fonction stable

  // Fonction stable pour créer les marqueurs
  const createMarkers = useCallback(async (mapInstance: any, eventGroups: Event[][]) => {
    console.log('📍 Création de', eventGroups.length, 'groupes de marqueurs');
    
    // Nettoyer les anciens marqueurs d'abord
    clearAllMarkers();

    // Importer MapLibre GL
    let maplibregl;
    try {
      maplibregl = await import('maplibre-gl');
    } catch (error) {
      console.error('Erreur import MapLibre GL:', error);
      return;
    }

    eventGroups.forEach((locationEvents, index) => {
      const firstEvent = locationEvents[0];
      const eventCount = locationEvents.length;
      const category = (firstEvent.category || 'default').toLowerCase();
      const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default;
      
      // Debug pour les 5 premiers
      if (index < 5) {
        console.log(`🎨 Marqueur ${index}:`, {
          title: firstEvent.title,
          category: firstEvent.category,
          categoryLower: category,
          color: color,
          eventCount: eventCount
        });
      }

      // Coordonnées
      const lat = firstEvent.location?.coordinates?.lat || (firstEvent as any).lat || 45.5088;
      const lng = firstEvent.location?.coordinates?.lng || (firstEvent as any).lon || -73.5542;

      // Créer l'élément HTML du marqueur
      const markerElement = document.createElement('div');
      markerElement.className = 'stable-event-marker';
      
      // Style inline pour garantir l'application
      markerElement.style.cssText = `
        width: ${eventCount > 1 ? '36px' : '32px'};
        height: ${eventCount > 1 ? '36px' : '32px'};
        background-color: ${color} !important;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 0 15px ${color}60, 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        color: white;
        font-weight: bold;
        font-size: ${eventCount > 1 ? '13px' : '11px'};
        z-index: 1000;
        position: relative;
      `;
      
      // Contenu du marqueur
      markerElement.innerHTML = eventCount > 1 ? eventCount.toString() : '📍';
      
      // Événements hover
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.3)';
        markerElement.style.zIndex = '1001';
      });
      
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = '1000';
      });

      // Événement clic
      markerElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🖱️ Clic sur marqueur:', firstEvent.title, 'événements:', eventCount);
        
        if (eventCount === 1) {
          onEventClickRef.current(firstEvent);
        } else if (onLocationClickRef.current) {
          const locationName = firstEvent.location?.name || (firstEvent as any).venue?.name || 'Lieu inconnu';
          onLocationClickRef.current(locationEvents, locationName);
        }
      });

      // Créer le marqueur MapLibre
      const marker = new maplibregl.default.Marker(markerElement)
        .setLngLat([lng, lat])
        .addTo(mapInstance);

      // Stocker la référence
      markersRef.current.push(marker);
    });

    console.log('✅ Marqueurs créés:', markersRef.current.length);
  }, [clearAllMarkers]); // Dépendances du useCallback

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) {
        return;
      }

      try {
        console.log('🗺️ Initialisation de la carte...');
        
        // Import MapLibre GL
        const maplibregl = await import('maplibre-gl');
        
        if (!isMounted) return;

        // Créer la carte
        const map = new maplibregl.default.Map({
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

        // Événements de la carte
        map.on('load', () => {
          if (!isMounted) return;
          
          console.log('🗺️ Carte chargée');
          
          // Ajouter les contrôles
          map.addControl(new maplibregl.default.NavigationControl(), 'top-right');
          map.addControl(new maplibregl.default.ScaleControl(), 'bottom-left');

          setIsMapReady(true);
        });

        // Gérer les changements de vue avec throttling
        let moveTimeout: NodeJS.Timeout;
        map.on('moveend', () => {
          if (!isMounted) return;
          
          clearTimeout(moveTimeout);
          moveTimeout = setTimeout(() => {
            const mapCenter = map.getCenter();
            const mapZoom = map.getZoom();
            onMapViewChange({
              center: [mapCenter.lat, mapCenter.lng],
              zoom: mapZoom
            });
          }, 200); // Throttle plus agressif
        });

        mapInstanceRef.current = map;
        
      } catch (error) {
        console.error('❌ Erreur initialisation carte:', error);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        clearAllMarkers();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []); // Seulement à l'initialisation

  // Références stables pour les callbacks
  const onEventClickRef = useRef(onEventClick);
  const onLocationClickRef = useRef(onLocationClick);
  
  // Mettre à jour les références quand les props changent
  useEffect(() => {
    onEventClickRef.current = onEventClick;
    onLocationClickRef.current = onLocationClick;
  }, [onEventClick, onLocationClick]);

  // Mise à jour des marqueurs quand les événements changent (STABLE)
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !events || events.length === 0) {
      return;
    }

    // Éviter les re-renders inutiles
    const currentMarkersCount = markersRef.current.length;
    if (currentMarkersCount > 0 && events.length === 0) {
      console.log('🔄 Événements vides, pas de mise à jour');
      return;
    }

    console.log('🔄 Mise à jour marqueurs avec', events.length, 'événements');
    
    const eventGroups = groupEventsByLocation(events);
    createMarkers(mapInstanceRef.current, eventGroups);
    
  }, [events, isMapReady, groupEventsByLocation, createMarkers]); // Fonctions stables incluses

  // Mise à jour de la vue de la carte
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    map.flyTo({
      center: [center[1], center[0]],
      zoom: zoom,
      duration: 1000
    });
  }, [center, zoom, isMapReady]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative bg-gray-100">
      {/* Conteneur de la carte */}
      <div 
        ref={mapRef} 
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Indicateur de chargement */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Debug info */}
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {events.length} événements • {markersRef.current.length} marqueurs
      </div>
    </div>
  );
};

export default StableEventMap;
