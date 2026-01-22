/**
 * API Route pour le géocodage d'adresses
 * GET /api/geocode?address=... - Géocode une adresse
 */

import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Paramètre address requis' },
        { status: 400 }
      );
    }

    // Parser l'adresse (format: "1234 Rue Example, Montréal, H2X 1Y4")
    const parts = address.split(',').map(p => p.trim());
    const addressPart = parts[0] || '';
    const cityPart = parts[1] || 'Montréal';
    const postalCodePart = parts[2] || '';

    const result = await geocodeAddress({
      address: addressPart,
      city: cityPart,
      postalCode: postalCodePart,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Adresse non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur lors du géocodage:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors du géocodage' },
      { status: 500 }
    );
  }
}
