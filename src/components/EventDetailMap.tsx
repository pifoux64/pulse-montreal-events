'use client';

import { useEffect, useRef } from 'react';

interface EventDetailMapProps {
  lat: number;
  lon: number;
  title: string;
}

// Carte légère pour la page d'événement (MapLibre + tuiles OpenStreetMap)
export default function EventDetailMap({ lat, lon, title }: EventDetailMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: any;

    const init = async () => {
      if (!containerRef.current) return;

      const maplibregl = await import('maplibre-gl');

      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            openstreetmap: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'openstreetmap',
            },
          ],
        },
        center: [lon, lat],
        zoom: 14,
        attributionControl: false,
      });

      new maplibregl.Marker()
        .setLngLat([lon, lat])
        .setPopup(new maplibregl.Popup().setText(title))
        .addTo(map);
    };

    init().catch((err) => {
      console.error('EventDetailMap error:', err);
    });

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [lat, lon, title]);

  return <div ref={containerRef} className="w-full h-full" />;
}






















