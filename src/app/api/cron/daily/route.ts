/**
 * CRON Job quotidien - Plan Hobby Vercel (limite: 2 cron jobs, 1x/jour)
 * 
 * Ce job combine toutes les tâches quotidiennes :
 * - Ingestion des événements (toutes les sources)
 * - Recalcul des profils de goûts utilisateurs
 * - Envoi du digest hebdomadaire (le lundi)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ImportService } from '@/lib/ingestion/import-service';
import { buildUserTasteProfile } from '@/lib/recommendations/tasteProfileBuilder';
import { sendEmailViaResend } from '@/lib/email/resend';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret CRON pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      logger.warn('Tentative d\'accès non autorisé au CRON quotidien');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    logger.info('Début du CRON quotidien');

    const results = {
      ingestion: { success: false, eventsImported: 0, errors: [] },
      tasteProfiles: { success: false, profilesUpdated: 0, errors: [] },
      weeklyDigest: { success: false, emailsSent: 0, errors: [] },
    };

    // 1. Ingestion des événements
    try {
      logger.info('Début de l\'ingestion quotidienne');
      const importService = new ImportService();
      const sources = await prisma.source.findMany({
        where: { isEnabled: true },
        include: { health: true },
      });

      let totalEvents = 0;
      for (const source of sources) {
        try {
          const result = await importService.importSource(source.id);
          totalEvents += result.eventsCreated || 0;
        } catch (error) {
          results.ingestion.errors.push(`Source ${source.id}: ${error}`);
        }
      }

      results.ingestion.success = true;
      results.ingestion.eventsImported = totalEvents;
      logger.info(`Ingestion terminée: ${totalEvents} événements importés`);
    } catch (error) {
      results.ingestion.errors.push(String(error));
      logger.error('Erreur lors de l\'ingestion', error);
    }

    // 2. Recalcul des profils de goûts (tous les jours à 2h)
    try {
      logger.info('Début du recalcul des profils de goûts');
      const activeUsers = await prisma.user.findMany({
        where: {
          accounts: { some: {} }, // Utilisateurs avec au moins un compte
        },
        select: { id: true },
      });

      let profilesUpdated = 0;
      for (const user of activeUsers) {
        try {
          await buildUserTasteProfile(user.id);
          profilesUpdated++;
        } catch (error) {
          results.tasteProfiles.errors.push(`User ${user.id}: ${error}`);
        }
      }

      results.tasteProfiles.success = true;
      results.tasteProfiles.profilesUpdated = profilesUpdated;
      logger.info(`Profils de goûts mis à jour: ${profilesUpdated}`);
    } catch (error) {
      results.tasteProfiles.errors.push(String(error));
      logger.error('Erreur lors du recalcul des profils', error);
    }

    // 3. Digest hebdomadaire (seulement le lundi)
    const now = new Date();
    const isMonday = now.getDay() === 1; // 0 = dimanche, 1 = lundi

    if (isMonday) {
      try {
        logger.info('Début de l\'envoi du digest hebdomadaire');
        
        // Trouver les Pulse Picks publiés cette semaine
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const publishedPosts = await prisma.editorialPost.findMany({
          where: {
            status: 'PUBLISHED',
            publishedAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
          include: {
            events: {
              orderBy: { id: 'asc' },
            },
          },
        });

        if (publishedPosts.length > 0) {
          // Récupérer les utilisateurs opt-in pour les emails
          const users = await prisma.user.findMany({
            where: {
              emailNotifications: true,
              email: { not: null },
            },
            select: {
              email: true,
              name: true,
            },
          });

          let emailsSent = 0;
          for (const user of users) {
            try {
              const emailHtml = `
                <h1>Pulse Picks de la Semaine</h1>
                <p>Bonjour ${user.name || 'utilisateur'} !</p>
                <p>Voici nos sélections de la semaine :</p>
                ${publishedPosts.map(post => `
                  <h2>${post.title}</h2>
                  <p>${post.description}</p>
                  <ul>
                    ${post.events.map(e => `<li>${e.title}</li>`).join('')}
                  </ul>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/top-5/${post.slug}">Voir le Top 5</a>
                `).join('<hr>')}
              `;

              await sendEmailViaResend({
                to: user.email!,
                subject: 'Pulse Picks de la Semaine',
                html: emailHtml,
              });

              emailsSent++;
            } catch (error) {
              results.weeklyDigest.errors.push(`User ${user.email}: ${error}`);
            }
          }

          results.weeklyDigest.success = true;
          results.weeklyDigest.emailsSent = emailsSent;
          logger.info(`Digest hebdomadaire envoyé: ${emailsSent} emails`);
        } else {
          logger.info('Aucun Pulse Picks publié cette semaine');
        }
      } catch (error) {
        results.weeklyDigest.errors.push(String(error));
        logger.error('Erreur lors de l\'envoi du digest', error);
      }
    } else {
      logger.info('Pas de digest hebdomadaire (pas un lundi)');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    logger.error('Erreur dans le CRON quotidien', error);
    return NextResponse.json(
      { error: 'Erreur interne', details: String(error) },
      { status: 500 }
    );
  }
}

