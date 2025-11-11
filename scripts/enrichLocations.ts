import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NeighborhoodPolygon {
  name: string;
  slug: string;
  geojson: any;
}

const NEIGHBORHOODS_FILE = path.join(process.cwd(), 'data', 'neighborhoods.geojson');
const MONTREAL_COORDINATES = { lat: 45.5088, lon: -73.5542 };
const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';

async function loadNeighborhoods(): Promise<NeighborhoodPolygon[]> {
  try {
    const file = await fs.readFile(NEIGHBORHOODS_FILE, 'utf-8');
    const geojson = JSON.parse(file);
    if (!geojson?.features) return [];

    return geojson.features.map((feature: any) => ({
      name: feature.properties?.name || feature.properties?.NOM || 'Inconnu',
      slug: (feature.properties?.slug || feature.properties?.NOM || 'inconnu')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
      geojson: feature.geometry,
    }));
  } catch (error) {
    console.warn('Impossible de charger neighborhoods.geojson', error);
    return [];
  }
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function isInsidePolygon(point: [number, number], polygon: any): boolean {
  const [lon, lat] = point;
  const { coordinates, type } = polygon;

  const testRing = (ring: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  if (type === 'Polygon') {
    return testRing(coordinates[0]);
  }

  if (type === 'MultiPolygon') {
    return coordinates.some((ring: any) => testRing(ring[0]));
  }

  return false;
}

function haversineDistance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${GEOCODE_URL}?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=CA`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Pulse-Montreal/1.0 (contact@pulse-montreal.com)',
      },
    });

    if (!response.ok) {
      console.warn('Geocode error HTTP', response.status, address);
      return null;
    }

    const results = await response.json();
    if (!results?.length) return null;

    return {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
    };
  } catch (error) {
    console.warn('Geocode error', error);
    return null;
  }
}

async function determineNeighborhood(
  neighborhoods: NeighborhoodPolygon[],
  lat: number,
  lon: number
): Promise<string | null> {
  const point: [number, number] = [lon, lat];
  const match = neighborhoods.find((n) => isInsidePolygon(point, n.geojson));
  return match?.slug || null;
}

async function enrichLocations() {
  const neighborhoods = await loadNeighborhoods();
  if (!neighborhoods.length) {
    console.warn('Aucun quartier chargé, le champ neighborhood restera null.');
  }

  const events = await prisma.event.findMany({
    include: { venue: true },
  });

  let updatedCount = 0;

  for (const event of events) {
    let lat = event.venue?.lat;
    let lon = event.venue?.lon;
    let neighborhood = event.venue?.neighborhood || null;

    const needsGeocode = typeof lat !== 'number' || typeof lon !== 'number';

    if (needsGeocode && event.venue) {
      const addressParts = [event.venue.address, event.venue.city, event.venue.postalCode]
        .filter(Boolean)
        .join(', ');

      if (addressParts) {
        const coords = await geocode(addressParts);
        if (coords) {
          lat = coords.lat;
          lon = coords.lon;
        }
      }
    }

    if (lat && lon && (!neighborhood || neighborhood === 'inconnu')) {
      const candidate = await determineNeighborhood(neighborhoods, lat, lon);
      if (candidate) {
        neighborhood = candidate;
      }
    }

    if (lat && lon && event.venue && (lat !== event.venue.lat || lon !== event.venue.lon || neighborhood !== event.venue.neighborhood)) {
      await prisma.venue.update({
        where: { id: event.venue.id },
        data: {
          lat,
          lon,
          neighborhood,
        },
      });
      updatedCount++;
    }
  }

  console.log(`Enrichissement terminé. ${updatedCount} lieux mis à jour.`);
}

enrichLocations()
  .catch((error) => {
    console.error('Erreur enrichissement localisation', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
