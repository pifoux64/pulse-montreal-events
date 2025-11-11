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
    'miscellaneous': '#0ea5e9',   // Bleu ciel pour miscellaneous
    'education': '#f59e0b',       // Jaune pour education
    'gastronomie': '#14b8a6',     // Turquoise pour gastronomie
    'famille': '#DC2626',         // Rouge foncé pour famille
    'family': '#DC2626',          // Rouge foncé pour family
    'musique': '#E11D48',         // Fallback français
    'culture': '#D97706',         // Fallback français
    'autre': '#6b7280',           // Fallback français
    'food': '#14b8a6',            // Fallback anglais
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

      // Créer l'élément HTML du marqueur avec le logo Pulse
      const markerElement = document.createElement('div');
      markerElement.className = 'pulse-event-marker';
      
      // Convertir la couleur hex en filtre CSS pour colorer le logo
      const getColorFilter = (hexColor: string) => {
        // Conversion approximative des couleurs principales en filtres CSS
        const colorFilters: Record<string, string> = {
          '#E11D48': 'hue-rotate(340deg) saturate(1.5) brightness(0.9)', // Rouge/Rose pour Musique
          '#2563EB': 'hue-rotate(220deg) saturate(1.3) brightness(1.1)', // Bleu pour Sport
          '#059669': 'hue-rotate(140deg) saturate(1.4) brightness(1.0)', // Vert pour Art & Culture
          '#D97706': 'hue-rotate(30deg) saturate(1.5) brightness(1.2)',  // Orange pour Community
          '#0ea5e9': 'hue-rotate(190deg) saturate(1.1) brightness(1.1)', // Bleu ciel pour Miscellaneous
          '#f59e0b': 'hue-rotate(45deg) saturate(1.4) brightness(1.3)',  // Jaune pour Education
          '#14b8a6': 'hue-rotate(160deg) saturate(1.2) brightness(1.05)', // Turquoise pour Gastronomie
          '#DC2626': 'hue-rotate(0deg) saturate(1.5) brightness(1.0)',   // Rouge pour Famille
          '#6b7280': 'grayscale(1) brightness(0.8)',                     // Gris pour Autre
        };
        return colorFilters[hexColor] || 'hue-rotate(0deg) saturate(1.2) brightness(1.1)';
      };
      
      // Style inline pour le conteneur (STABLE - MapLibre gère le centrage)
      markerElement.style.cssText = `
        width: ${eventCount > 1 ? '40px' : '36px'};
        height: ${eventCount > 1 ? '40px' : '36px'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: filter 0.3s ease;
        z-index: 100;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
        pointer-events: auto;
      `;
      
      // Design avec logo Pulse coloré + chiffre si multiple
      if (eventCount > 1) {
        markerElement.innerHTML = `
          <div style="position: relative; width: 100%; height: 100%;">
            <img 
              src="/Pulse_Logo_only_heart.png" 
              alt="Pulse Event" 
              style="
                width: 100%; 
                height: 100%; 
                filter: ${getColorFilter(color)};
                object-fit: contain;
              "
            />
            <div style="
              position: absolute; 
              top: -4px; 
              right: -4px; 
              background: ${color}; 
              color: white; 
              border-radius: 50%; 
              width: 18px; 
              height: 18px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 10px; 
              font-weight: bold;
              border: 2px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            ">
              ${eventCount}
            </div>
          </div>
        `;
      } else {
        markerElement.innerHTML = `
          <img 
            src="/Pulse_Logo_only_heart.png" 
            alt="Pulse Event" 
            style="
              width: 100%; 
              height: 100%; 
              filter: ${getColorFilter(color)};
              object-fit: contain;
            "
          />
        `;
      }
      
      // Événements hover pour le logo Pulse (SANS SCALE - stable)
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.zIndex = '101';
        markerElement.style.filter = `drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 0 20px ${color}80) brightness(1.1)`;
      });
      
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.zIndex = '100';
        markerElement.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.3)) brightness(1)';
      });

      // Événement clic
      markerElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (eventCount === 1) {
          if (onEventClickRef.current) {
            onEventClickRef.current(firstEvent);
          }
        } else if (onLocationClickRef.current) {
          const locationName = firstEvent.location?.name || (firstEvent as any).venue?.name || 'Lieu inconnu';
          onLocationClickRef.current(locationEvents, locationName);
        }
      });

      // Créer le marqueur MapLibre avec élément personnalisé
      const maplibreglLib = (window as any).maplibregl || maplibregl.default || maplibregl;
      
      // IMPORTANT: Utiliser notre élément HTML personnalisé pour garder les couleurs/icônes
      const marker = new maplibreglLib.Marker({
        element: markerElement,  // ← Notre élément personnalisé avec couleurs/icônes
        anchor: 'center'  // ← Assure un centrage correct par MapLibre
      })
        .setLngLat([lng, lat]) // MapLibre utilise [longitude, latitude]
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
