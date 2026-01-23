import { NextRequest, NextResponse } from 'next/server';
import { generateTop5ByVibe } from '@/lib/editorial/editorialService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vibe: string }> }
) {
  try {
    const { vibe } = await params;
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'week') as 'week' | 'weekend';

    const result = await generateTop5ByVibe(vibe, period);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Editorial Top5 Vibe] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur lors de la génération: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

