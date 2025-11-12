/**
 * Route de test pour vérifier que Sentry fonctionne
 * GET /api/test-error - Génère une erreur de test
 */

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // Générer une erreur de test
    throw new Error('Test error for Sentry - This is intentional');
  } catch (error) {
    // Capturer l'erreur avec Sentry
    Sentry.captureException(error);
    
    return NextResponse.json(
      { 
        message: 'Erreur de test générée et envoyée à Sentry',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

