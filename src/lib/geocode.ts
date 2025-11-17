const DEFAULT_LAT = 45.5017;
const DEFAULT_LON = -73.5673;

export interface GeocodeInput {
  address: string;
  city: string;
  postalCode?: string;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
}

export async function geocodeAddress({
  address,
  city,
  postalCode,
}: GeocodeInput): Promise<GeocodeResult | null> {
  try {
    const queryParts = [address, city, 'QC', 'Canada'];
    if (postalCode) {
      queryParts.splice(2, 0, postalCode);
    }
    const query = encodeURIComponent(queryParts.join(', '));
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=ca`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Pulse-Montreal/1.0 (contact@pulse-montreal.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const results = await response.json();

    if (results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lon: parseFloat(results[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur de géocodage:', error);
    return null;
  }
}

export function getDefaultCoordinates(): GeocodeResult {
  return { lat: DEFAULT_LAT, lon: DEFAULT_LON };
}

