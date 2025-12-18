/**
 * CRON Job: Envoi de l'email hebdo "Top 5 de la semaine"
 * SPRINT 5: Expansion & email digest
 *
 * POST /api/cron/weekly-digest
 * Protégé par le header Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailViaResend } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

function buildDigestHtml(posts: any[]): string {
  const items = posts
    .map((post) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-mtl.vercel.app';
      const url = `${baseUrl}/top-5/${post.slug}`;
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size:16px; font-weight:600; color:#0f172a; margin-bottom:4px;">${post.title}</div>
            <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">Thème : ${post.theme}</div>
            <a href="${url}" style="font-size:13px; color:#0ea5e9; text-decoration:none;">Voir le Top 5 →</a>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; max-width:600px; margin:0 auto; padding:24px; background:#0f172a; color:#e5e7eb;">
      <h1 style="font-size:24px; margin-bottom:12px;">Les 5 immanquables de la semaine</h1>
      <p style="font-size:14px; color:#9ca3af; margin-bottom:24px;">
        Voici la sélection éditoriale Pulse des meilleurs événements à venir cette semaine à Montréal.
      </p>
      <table style="width:100%; border-collapse:collapse; background:#ffffff; border-radius:12px; padding:16px;">
        <tbody>
          ${items}
        </tbody>
      </table>
      <p style="font-size:12px; color:#6b7280; margin-top:24px;">
        Vous recevez cet email car vous avez activé les notifications par email sur Pulse.
        Pour vous désabonner, modifiez vos préférences dans votre profil.
      </p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { monday, sunday } = getCurrentWeekBounds();

    // Récupérer les Pulse Picks publiés pour la semaine courante
    const posts = await prisma.editorialPost.findMany({
      where: {
        status: 'PUBLISHED',
        periodStart: {
          gte: monday,
        },
        periodEnd: {
          lte: sunday,
        },
      },
      orderBy: {
        theme: 'asc',
      },
    });

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun Pulse Picks publié pour cette semaine, pas d'email envoyé",
      });
    }

    const html = buildDigestHtml(posts);

    // Récupérer les utilisateurs opt-in email
    const users = await prisma.user.findMany({
      where: {
        preferences: {
          notificationsEmail: true,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      if (!user.email) continue;
      const subject = 'Les 5 immanquables de la semaine à Montréal (Pulse)';
      const text =
        'Découvrez la sélection Pulse des meilleurs événements à venir cette semaine à Montréal sur https://pulse-mtl.vercel.app';

      const result = await sendEmailViaResend({
        to: user.email,
        subject,
        html,
        text,
      });

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      posts: posts.length,
      recipients: users.length,
      sent: successCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error("[CRON weekly-digest] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'envoi du digest hebdomadaire" },
      { status: 500 },
    );
  }
}


