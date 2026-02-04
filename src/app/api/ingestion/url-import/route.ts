/**
 * API pour l'import volontaire par URL
 * POST /api/ingestion/url-import
 * 
 * Analyse une URL et retourne des suggestions de champs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeURL, detectPlatform } from '@/lib/ingestion/url-import-service';
import { z } from 'zod';

const urlImportSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = urlImportSchema.parse(body);

    // Analyser l'URL
    const result = await analyzeURL(url);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API URL Import][POST] Erreur:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'URL invalide', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'analyse de l\'URL' },
      { status: 500 }
    );
  }
}

