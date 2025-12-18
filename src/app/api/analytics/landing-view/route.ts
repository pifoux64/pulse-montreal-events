/**
 * API: Track une vue depuis un lien partagé
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    console.log('[Analytics] landing_view', {
      userId: session?.user?.id,
      path: body.path,
      source: body.source,
      medium: body.medium,
      campaign: body.campaign,
      timestamp: body.timestamp,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur POST /api/analytics/landing-view:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du tracking' },
      { status: 500 }
    );
  }
}

