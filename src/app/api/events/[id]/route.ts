/**
 * API Routes pour un événement spécifique - Pulse Montreal
 * GET /api/events/[id] - Détails d'un événement
 * PATCH /api/events/[id] - Modification d'événement (propriétaire uniquement)
 * DELETE /api/events/[id] - Suppression d'événement (propriétaire/admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventCategory, EventLanguage, EventStatus, UserRole } from '@prisma/client';

// Schéma de validation pour la modification d'événement
const UpdateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(10).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  url: z.string().url().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  language: z.nativeEnum(EventLanguage).optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  category: z.nativeEnum(EventCategory).optional(),
  subcategory: z.string().optional(),
  accessibility: z.array(z.string()).optional(),
  ageRestriction: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  musicUrls: z.object({
    spotifyUrl: z.string().optional().or(z.literal('')),
    youtubeUrl: z.string().optional().or(z.literal('')),
    soundcloudUrl: z.string().optional().or(z.literal('')),
    mixcloudUrl: z.string().optional().or(z.literal('')),
  }).optional(),
});

/**
 * GET /api/events/[id] - Récupérer les détails d'un événement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        organizer: {
          include: {
            user: {
              select: {
                name: true,
                email: false, // Ne pas exposer l'email
              },
            },
          },
        },
        features: true,
        eventTags: true, // SPRINT 2: Inclure les tags structurés
        promotions: {
          where: {
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Enregistrer la vue (analytics)
    const session = await getServerSession(authOptions);
    await prisma.eventView.create({
      data: {
        eventId: event.id,
        userId: session?.user?.id || null,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        referrer: request.headers.get('referer'),
      },
    });

    // SPRINT 2: Tracker l'interaction VIEW pour recommandations
    if (session?.user?.id) {
      const { trackInteraction } = await import('@/lib/recommendations/interactionTracker');
      await trackInteraction(session.user.id, event.id, 'VIEW').catch(() => {
        // Ignorer les erreurs de tracking
      });
    }

    return NextResponse.json(event);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de l\'événement' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id] - Modifier un événement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Récupérer l'événement existant
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const isOwner = existingEvent.organizer?.user.id === session.user.id;
    const isAdmin = session.user.role === UserRole.ADMIN;
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData = UpdateEventSchema.parse(body);

    // Convertir les dates string en objets Date
    const parsedData: any = { ...updateData };
    if (parsedData.startAt) {
      parsedData.startAt = new Date(parsedData.startAt);
    }
    if (parsedData.endAt) {
      parsedData.endAt = new Date(parsedData.endAt);
    }

    // Extraire musicUrls du parsedData avant la mise à jour
    const { musicUrls, ...eventUpdateData } = parsedData;

    // Mettre à jour l'événement
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...eventUpdateData,
        updatedAt: new Date(),
      },
      include: {
        venue: true,
        organizer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        features: true,
        eventTags: true, // SPRINT 2: Inclure les tags structurés
        promotions: {
          where: {
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    // Mettre à jour les URLs musicales si fournies
    if (musicUrls) {
      const musicFeatureKeys = ['spotifyUrl', 'youtubeUrl', 'soundcloudUrl', 'mixcloudUrl'];
      
      for (const key of musicFeatureKeys) {
        const url = musicUrls[key as keyof typeof musicUrls];
        const trimmedUrl = url?.trim() || '';
        
        // Vérifier si la feature existe déjà
        const existingFeature = await prisma.eventFeature.findUnique({
          where: {
            unique_event_feature: {
              eventId: id,
              featureKey: key,
            },
          },
        });

        if (trimmedUrl) {
          // Créer ou mettre à jour la feature
          if (existingFeature) {
            await prisma.eventFeature.update({
              where: {
                unique_event_feature: {
                  eventId: id,
                  featureKey: key,
                },
              },
              data: {
                featureValue: trimmedUrl,
              },
            });
          } else {
            await prisma.eventFeature.create({
              data: {
                eventId: id,
                featureKey: key,
                featureValue: trimmedUrl,
              },
            });
          }
        } else if (existingFeature) {
          // Supprimer la feature si l'URL est vide
          await prisma.eventFeature.delete({
            where: {
              unique_event_feature: {
                eventId: id,
                featureKey: key,
              },
            },
          });
        }
      }
    }

    // Récupérer l'événement avec les features mises à jour
    const finalEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        organizer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        features: true,
        eventTags: true,
        promotions: {
          where: {
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    return NextResponse.json(finalEvent);

  } catch (error) {
    console.error('Erreur lors de la modification de l\'événement:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la modification de l\'événement' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id] - Supprimer un événement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Récupérer l'événement existant
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const isOwner = existingEvent.organizer?.user.id === session.user.id;
    const isAdmin = session.user.role === UserRole.ADMIN;
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      );
    }

    // Supprimer l'événement (cascade supprimera automatiquement les relations)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Événement supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de l\'événement' },
      { status: 500 }
    );
  }
}
