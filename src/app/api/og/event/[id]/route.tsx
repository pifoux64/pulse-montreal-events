/**
 * Route API pour générer des images OG dynamiques pour les événements
 * Utilise @vercel/og pour générer des images avec texte superposé
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatEventDate } from '@/lib/utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
      },
    });

    if (!event) {
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
              backgroundImage: 'linear-gradient(to bottom, #1e293b, #0f172a)',
            }}
          >
            <div style={{ fontSize: 60, color: '#e2e8f0', marginBottom: 20 }}>
              Événement non trouvé
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const dateStr = formatEventDate(event.startAt);
    const venueName = event.venue?.name || 'Lieu à confirmer';
    const title = event.title.length > 60 ? event.title.substring(0, 57) + '...' : event.title;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: event.imageUrl
              ? `url(${event.imageUrl})`
              : 'linear-gradient(to bottom, #1e293b, #0f172a)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay sombre pour la lisibilité */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            }}
          />

          {/* Contenu */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '60px',
              height: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Badge Pulse */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                Pulse Montréal
              </div>
            </div>

            {/* Titre */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                lineHeight: '1.1',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {title}
            </div>

            {/* Date et lieu */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '28px',
                color: '#e2e8f0',
                textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>📅</span>
                <span>{dateStr}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>📍</span>
                <span>{venueName}</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('Erreur GET /api/og/event/[id]:', error);
    
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
            backgroundImage: 'linear-gradient(to bottom, #1e293b, #0f172a)',
          }}
        >
          <div style={{ fontSize: 60, color: '#e2e8f0', marginBottom: 20 }}>
            Pulse Montréal
          </div>
          <div style={{ fontSize: 40, color: '#94a3b8' }}>
            Découvrez les événements à Montréal
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
