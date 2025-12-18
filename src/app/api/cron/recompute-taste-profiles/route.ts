/**
 * CRON Job: Recompute taste profiles for active users
 * SPRINT 2: Personalization & Recommendations
 * 
 * Runs nightly to rebuild UserTasteProfile from interactions
 * GET /api/cron/recompute-taste-profiles?secret=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildUserTasteProfile, saveUserTasteProfile } from '@/lib/recommendations/tasteProfileBuilder';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret CRON (comme les autres jobs)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer tous les utilisateurs actifs (ayant des interactions dans les 90 derniers jours)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activeUsers = await prisma.user.findMany({
      where: {
        eventInteractions: {
          some: {
            createdAt: {
              gte: ninetyDaysAgo,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    console.log(`[CRON] Recomputation de ${activeUsers.length} profils de goûts`);

    let successCount = 0;
    let errorCount = 0;

    // Traiter chaque utilisateur
    for (const user of activeUsers) {
      try {
        const profile = await buildUserTasteProfile(user.id);
        await saveUserTasteProfile(user.id, profile);
        successCount++;
      } catch (error: any) {
        console.error(`[CRON] Erreur pour user ${user.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: activeUsers.length,
      successCount,
      errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Erreur recompute-taste-profiles:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors de la recomputation',
      },
      { status: 500 }
    );
  }
}

