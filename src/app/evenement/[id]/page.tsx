import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Clock, DollarSign, Users, Tag, ExternalLink } from 'lucide-react';
import { EventStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/prisma';
import { buildEventJsonLd, canonicalUrlForPath } from '@/lib/seo';
import { authOptions } from '@/lib/auth';
import EventTabsSection from '@/components/EventTabsSection';
import EventDetailMap from '@/components/EventDetailMap';
import EventFeedPanel from '@/components/event-feed/EventFeedPanel';
import EventDetailActions from '@/components/EventDetailActions';
import EventTagsDisplay from '@/components/EventTagsDisplay';
import EventPublishSection from '@/components/EventPublishSection';
import SimilarEvents from '@/components/SimilarEvents';
import InviteFriendButton from '@/components/social/InviteFriendButton';

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
      other: {
        'event:start_time': event.startAt.toISOString(),
        'event:end_time': event.endAt ? event.endAt.toISOString() : undefined,
        'event:location:latitude': event.venue?.lat?.toString() ?? undefined,
        'event:location:longitude': event.venue?.lon?.toString() ?? undefined,
        'event:location:venue': event.venue?.name ?? undefined,
        'event:location:address': event.venue
          ? `${event.venue.address}, ${event.venue.city} ${event.venue.postalCode}`
          : undefined,
        'event:organizer': event.organizer?.displayName,
        'event:price:min': event.priceMin != null ? (event.priceMin / 100).toString() : undefined,
        'event:price:max': event.priceMax != null ? (event.priceMax / 100).toString() : undefined,
        'event:price:currency': event.currency,
      },
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            {/* Header avec image */}
            <div className="relative mb-8 rounded-3xl overflow-hidden">
              {event.imageUrl ? (
                <div className="relative h-96">
                  <Image
                    src={event.imageUrl.startsWith('http') || event.imageUrl.startsWith('/')
                      ? `/api/image-proxy?url=${encodeURIComponent(event.imageUrl)}`
                      : event.imageUrl}
                    alt={event.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                </div>
              ) : (
                <div className="h-96 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                  <Calendar className="w-32 h-32 text-white/50" />
                </div>
              )}
              
              {/* Titre et infos principales */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {new Date(event.startAt).toLocaleDateString('fr-CA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'America/Montreal',
                      })}
                    </span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{event.venue.name}</span>
                    </div>
                  )}
                  {event.priceMin === 0 && event.priceMin !== null && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Gratuit</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mb-8">
              <EventDetailActions event={event} />
            </div>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                {event.description && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 whitespace-pre-line">{event.description}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Tags</h2>
                    <EventTagsDisplay event={event} />
                  </div>
                )}

                {/* Tabs Section */}
                <EventTabsSection event={event} />

                {/* Similar Events */}
                <SimilarEvents eventId={event.id} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Informations pratiques */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-4">Informations pratiques</h2>
                  <div className="space-y-4">
                    {event.venue && (
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">Lieu</span>
                        </div>
                        <Link
                          href={event.venue.slug ? `/salle/${event.venue.slug}` : `/salle/${event.venue.id}`}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          {event.venue.name}
                        </Link>
                        <p className="text-slate-400 text-sm mt-1">
                          {event.venue.address}, {event.venue.city}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Date et heure</span>
                      </div>
                      <p className="text-white">
                        {new Date(event.startAt).toLocaleDateString('fr-CA', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'America/Montreal',
                        })}
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        {new Date(event.startAt).toLocaleTimeString('fr-CA', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Montreal',
                        })}
                        {event.endAt && (
                          <>
                            {' - '}
                            {new Date(event.endAt).toLocaleTimeString('fr-CA', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'America/Montreal',
                            })}
                          </>
                        )}
                      </p>
                    </div>

                    {event.priceMin !== null && (
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm">Prix</span>
                        </div>
                        <p className="text-white">
                          {event.priceMin === 0
                            ? 'Gratuit'
                            : event.priceMax && event.priceMax !== event.priceMin
                            ? `${(event.priceMin / 100).toFixed(2)} $ - ${(event.priceMax / 100).toFixed(2)} $`
                            : `${(event.priceMin / 100).toFixed(2)} $`}
                        </p>
                      </div>
                    )}

                    {event.minAttendees && (
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Participants</span>
                        </div>
                        <p className="text-white">
                          {event.minAttendees}
                          {event.maxAttendees && ` - ${event.maxAttendees}`} personnes
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Carte */}
                {event.venue && event.venue.lat && event.venue.lon && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-4">Localisation</h2>
                    <EventDetailMap
                      lat={event.venue.lat}
                      lng={event.venue.lon}
                      venueName={event.venue.name}
                    />
                  </div>
                )}

                {/* Organisateur */}
                {event.organizer && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-4">Organisateur</h2>
                    <Link
                      href={event.organizer.slug ? `/organisateur/${event.organizer.slug}` : `/organisateur/${event.organizer.id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      {event.organizer.user?.image ? (
                        <Image
                          src={event.organizer.user.image}
                          alt={event.organizer.displayName}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold">{event.organizer.displayName}</p>
                        {event.organizer.verified && (
                          <p className="text-xs text-blue-400">Vérifié</p>
                        )}
                      </div>
                    </Link>
                  </div>
                )}

                {/* Lien externe */}
                {event.url && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>Billets</span>
                    </a>
                  </div>
                )}

                {/* Invite Friend */}
                <InviteFriendButton eventId={event.id} />

                {/* Event Feed Panel */}
                <EventFeedPanel eventId={event.id} />

                {/* Actions admin/organisateur */}
                {(isOwner || isAdmin) && (
                  <EventPublishSection event={event} />
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Erreur chargement event:', error);
    notFound();
  }
}
