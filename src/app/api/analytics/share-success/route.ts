/**
 * API: Track un partage réussi
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    console.log('[Analytics] share_success', {
      userId: session?.user?.id,
      context: body.context,
      method: body.method,
      eventId: body.eventId,
      top5Slug: body.top5Slug,
      success: body.success,
      timestamp: body.timestamp,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur POST /api/analytics/share-success:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du tracking' },
      { status: 500 }
    );
  }
}

