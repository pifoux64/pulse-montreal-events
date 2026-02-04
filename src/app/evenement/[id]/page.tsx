import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/prisma';

/** Forme du Pulse Insight stocké en JSON en base */
type PulseInsightJson = {
  summary: string;
  vibe: string;
  expectedAudience: string;
  intensity: string;
  musicStyle?: string | null;
  danceLevel?: string | null;
  culturalContext?: string | null;
  tags?: Array<{ category: string; value: string; label: string }>;
};
import { buildEventJsonLd, canonicalUrlForPath } from '@/lib/seo';
import { authOptions } from '@/lib/auth';
import EventPageClient, { type EventPageClientProps } from './EventPageClient';

const SAFE_DESCRIPTION_LENGTH = 160;
export const revalidate = 600; // 10 minutes

async function fetchEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      organizer: true,
      features: true,
      eventTags: true, // SPRINT 2: Inclure les tags structurés
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { getTranslations } = await import('next-intl/server');
  const t = await getTranslations('events');
  
  try {
    const { id } = await params;
    const event = await fetchEvent(id);

    if (!event) {
      return {
        title: t('notFound'),
        description: t('notFoundDescription'),
      };
    }

    const eventDate = new Date(event.startAt).toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
    });

    const eventTime = new Date(event.startAt).toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
    });

    const descriptionSnippet = event.description
      ? `${event.description.substring(0, SAFE_DESCRIPTION_LENGTH)}${event.description.length > SAFE_DESCRIPTION_LENGTH ? '…' : ''} 📅 ${eventDate} à ${eventTime} 📍 ${event.venue?.name ?? 'Montréal'}`
      : `${eventDate} à ${eventTime} • ${event.venue?.name ?? 'Montréal'}`;

    const canonical = canonicalUrlForPath(`/evenement/${event.id}`);

    return {
      title: `${event.title} | Pulse Montréal`,
      description: descriptionSnippet,
      keywords: [
        ...event.tags,
        event.category.toLowerCase(),
        event.subcategory?.toLowerCase() ?? '',
        'montréal',
        'événement',
      ].filter(Boolean),
      alternates: {
        canonical,
      },
      openGraph: {
        type: 'article',
        locale: 'fr_CA',
        url: canonical,
        title: event.title,
        description: event.description?.substring(0, 200) ?? descriptionSnippet,
        siteName: 'Pulse Montréal',
        publishedTime: event.startAt.toISOString(),
        modifiedTime: event.updatedAt.toISOString(),
        section: event.category,
        tags: event.tags,
        images: [
          {
            url: event.imageUrl 
              ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/api/og/event/${event.id}`
              : `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-event-default.png`,
            width: 1200,
            height: 630,
            alt: event.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: descriptionSnippet,
        images: [
          event.imageUrl 
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/api/og/event/${event.id}`
            : `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-event-default.png`
        ],
      },
      other: (() => {
        const other: Record<string, string> = {
          'event:start_time': event.startAt.toISOString(),
        };
        if (event.endAt) {
          other['event:end_time'] = event.endAt.toISOString();
        }
        if (event.venue?.lat) {
          other['event:location:latitude'] = event.venue.lat.toString();
        }
        if (event.venue?.lon) {
          other['event:location:longitude'] = event.venue.lon.toString();
        }
        if (event.venue?.name) {
          other['event:location:venue'] = event.venue.name;
        }
        if (event.venue) {
          other['event:location:address'] = `${event.venue.address}, ${event.venue.city} ${event.venue.postalCode}`;
        }
        if (event.organizer?.displayName) {
          other['event:organizer'] = event.organizer.displayName;
        }
        if (event.priceMin != null) {
          other['event:price:min'] = (event.priceMin / 100).toString();
        }
        if (event.priceMax != null) {
          other['event:price:max'] = (event.priceMax / 100).toString();
        }
        if (event.currency) {
          other['event:price:currency'] = event.currency;
        }
        return other;
      })(),
    };
  } catch (error) {
    console.error('Erreur metadata event:', error);
    const { getTranslations } = await import('next-intl/server');
    const t = await getTranslations('events');
    return {
      title: t('loadingError'),
      description: t('loadingErrorDescription'),
    };
  }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await fetchEvent(id);

    if (!event) {
      notFound();
    }

    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === event.organizer?.userId;
    const isAdmin = session?.user?.role === 'ADMIN';

    // Vérifier si l'événement est publié ou si l'utilisateur est propriétaire/admin
    if (event.status !== EventStatus.SCHEDULED && event.status !== EventStatus.UPDATED && !isOwner && !isAdmin) {
      notFound();
    }

    const jsonLd = buildEventJsonLd(event);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <EventPageClient
          event={{
            id: event.id,
            title: event.title,
            description: event.description,
            startAt: event.startAt,
            endAt: event.endAt,
            imageUrl: event.imageUrl,
            priceMin: event.priceMin,
            priceMax: event.priceMax,
            currency: event.currency,
            url: event.url,
            category: event.category,
            tags: event.tags,
            accessibility: event.accessibility,
            venue: event.venue ? {
              id: event.venue.id,
              name: event.venue.name,
              slug: event.venue.slug,
              address: event.venue.address,
              city: event.venue.city,
              postalCode: event.venue.postalCode,
              lat: event.venue.lat,
              lon: event.venue.lon,
              neighborhood: event.venue.neighborhood,
            } : null,
            organizer: event.organizer ? {
              id: event.organizer.id,
              displayName: event.organizer.displayName,
              slug: event.organizer.slug,
              userId: event.organizer.userId,
            } : null,
            eventTags: event.eventTags,
            features: event.features,
            pulseInsight: ((event as { pulseInsight?: PulseInsightJson | null }).pulseInsight ?? null) as EventPageClientProps['event']['pulseInsight'],
          }}
          isOwner={isOwner}
          isAdmin={isAdmin}
        />
      </>
    );
  } catch (error) {
    console.error('Erreur chargement event:', error);
    notFound();
  }
}
