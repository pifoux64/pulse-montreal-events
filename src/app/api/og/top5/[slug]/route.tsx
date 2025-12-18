/**
 * Route API pour générer des images OG dynamiques pour les Top 5
 * Utilise @vercel/og pour générer une image avec le thème, la semaine, et les covers des top événements
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const post = await prisma.editorialPost.findUnique({
      where: { slug },
    });

    if (!post) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
            }}
          >
            <div style={{ fontSize: 60, color: '#1e293b', marginBottom: 20 }}>
              Top 5 non trouvé
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Récupérer les événements
    const events = post.eventsOrder.length
      ? await prisma.event.findMany({
          where: {
            id: {
              in: post.eventsOrder,
            },
          },
          take: 5,
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        })
      : [];

    // Réordonner les événements selon eventsOrder
    const eventMap = new Map(events.map((e) => [e.id, e]));
    const orderedEvents = (post.eventsOrder || [])
      .map((id) => eventMap.get(id))
      .filter((e) => !!e)
      .slice(0, 5);

    const periodStart = new Date(post.periodStart);
    const periodEnd = new Date(post.periodEnd);
    const periodStr = `${periodStart.toLocaleDateString('fr-CA', {
      month: 'short',
      day: 'numeric',
    })} - ${periodEnd.toLocaleDateString('fr-CA', {
      month: 'short',
      day: 'numeric',
    })}`;

    const title = post.title || `Top 5 ${post.theme}`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
            position: 'relative',
          }}
        >
          {/* Contenu principal */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              height: '100%',
              justifyContent: 'space-between',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Badge Pulse + Trophy */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#1e293b',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  Pulse Montréal
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#1e293b',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  🏆 Top 5
                </div>
              </div>

              {/* Titre */}
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  lineHeight: '1.1',
                }}
              >
                {title}
              </div>

              {/* Période */}
              <div
                style={{
                  fontSize: '24px',
                  color: '#78350f',
                  fontWeight: '600',
                }}
              >
                {periodStr}
              </div>
            </div>

            {/* Miniatures des événements */}
            {orderedEvents.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                {orderedEvents.map((event, index) => (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                    }}
                  >
                    {/* Numéro */}
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#1e293b',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </div>
                    {/* Image miniature */}
                    {event.imageUrl ? (
                      <div
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '12px',
                          backgroundImage: `url(${event.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '3px solid #1e293b',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '12px',
                          backgroundColor: '#1e293b',
                          border: '3px solid #1e293b',
                        }}
                      />
                    )}
                    {/* Titre (tronqué) */}
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#1e293b',
                        fontWeight: '600',
                        textAlign: 'center',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.title.length > 20
                        ? event.title.substring(0, 17) + '...'
                        : event.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('Erreur GET /api/og/top5/[slug]:', error);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
          }}
        >
          <div style={{ fontSize: 60, color: '#1e293b', marginBottom: 20 }}>
            Pulse Picks
          </div>
          <div style={{ fontSize: 40, color: '#78350f' }}>
            Top 5 événements à Montréal
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
