import { NextRequest, NextResponse } from 'next/server';
import { generateTop5ByGenre } from '@/lib/editorial/editorialService';

export async function GET(
  request: NextRequest,
  { params }: { params: { genre: string } }
) {
  try {
    const { genre } = params;
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'week') as 'week' | 'weekend';

    const result = await generateTop5ByGenre(genre, period);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Editorial Top5 Genre] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur lors de la génération: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

