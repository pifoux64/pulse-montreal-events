/**
 * API: Track l'ajout/suppression d'un favori
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    console.log('[Analytics] favorite', {
      userId: session?.user?.id,
      eventId: body.eventId,
      action: body.action,
      timestamp: body.timestamp,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur POST /api/analytics/favorite:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du tracking' },
      { status: 500 }
    );
  }
}

