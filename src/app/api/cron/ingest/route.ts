import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';

export async function GET() {
  try {
    const results = await orchestrator.runIngestion();
    return NextResponse.json({ status: 'ok', results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
