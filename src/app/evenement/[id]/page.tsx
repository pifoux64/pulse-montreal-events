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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const event = await fetchEvent(params.id);

    if (!event) {
      return {
        title: 'Événement non trouvé',
        description: 'Cet événement n’existe pas ou a été supprimé.',
      };
    }

    const eventDate = new Date(event.startAt).toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const eventTime = new Date(event.startAt).toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
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
            url: event.imageUrl || '/og-event-default.png',
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
        images: [event.imageUrl || '/og-event-default.png'],
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
    return {
      title: 'Erreur de chargement',
      description: 'Impossible de charger les informations de cet événement.',
    };
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  try {
    const event = await fetchEvent(params.id);

    if (!event) {
      notFound();
    }

    const session = await getServerSession(authOptions);
    const canPostToFeed =
      Boolean(session?.user?.id) && event.organizer?.userId === session.user.id;

    const eventDate = new Date(event.startAt);
    const eventEndDate = event.endAt ? new Date(event.endAt) : null;
    const isPastEvent = eventDate < new Date();
    const isCancelled = event.status === EventStatus.CANCELLED;
    const jsonLd = buildEventJsonLd(event);

    return (
      <div className="min-h-screen pt-24 pb-12">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl mb-8">
              <div className="aspect-[16/9] relative">
              <Image
                src={
                  event.imageUrl
                    ? `/api/image-proxy?url=${encodeURIComponent(event.imageUrl)}`
                    : '/placeholder-event.jpg'
                }
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Event Status Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    isCancelled
                      ? 'bg-red-600 text-white'
                      : isPastEvent
                      ? 'bg-gray-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {isCancelled ? 'Annulé' : isPastEvent ? 'Terminé' : 'À venir'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4">
                <EventDetailActions eventId={event.id} eventTitle={event.title} />
              </div>

              {/* Event Title & Basic Info */}
              <div className="absolute inset-x-0 bottom-0">
                {/* Léger gradient sombre en fond pour les images très claires */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                <div className="relative px-6 pb-6 md:px-10 md:pb-8 max-w-5xl">
                  <div className="inline-flex flex-col gap-2 bg-white/90 text-slate-900 rounded-2xl px-4 py-3 shadow-2xl">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1">
                      {event.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {eventDate.toLocaleDateString('fr-CA', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {eventDate.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                        {eventEndDate && (
                          <>
                            <span className="px-1">-</span>
                            {eventEndDate.toLocaleTimeString('fr-CA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venue?.name ?? 'Montréal'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <EventTabsSection
            infoContent={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Description */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Description</h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="whitespace-pre-line">{event.description}</p>
                    </div>
                  </div>

                  {/* Tags structurés (EventTag) - SPRINT 2 */}
                  {(event.eventTags && event.eventTags.length > 0) || event.tags.length > 0 ? (
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Tags
                      </h2>
                      {event.eventTags && event.eventTags.length > 0 ? (
                        <EventTagsDisplay 
                          eventTags={event.eventTags.map(tag => ({
                            id: tag.id,
                            category: tag.category as 'type' | 'genre' | 'ambiance' | 'public',
                            value: tag.value,
                          }))}
                          showCategoryLabels={true}
                        />
                      ) : (
                        // Fallback : Tags simples (ancien système)
                        <div className="flex flex-wrap gap-2">
                          {event.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Event Details */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Détails</h2>
                    <div className="space-y-4">
                      {/* Price */}
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Prix</div>
                          <div className="text-sm text-gray-600">
                            {event.priceMin == null && event.priceMax == null ? (
                              event.url
                                ? 'Voir les prix sur le site de billetterie'
                                : 'Prix non communiqué'
                            ) : event.priceMin === 0 ? (
                              'Gratuit'
                            ) : event.priceMin != null &&
                              event.priceMax != null &&
                              event.priceMin === event.priceMax ? (
                              `${(event.priceMin / 100).toFixed(2)} ${event.currency}`
                            ) : (
                              `${event.priceMin != null ? (event.priceMin / 100).toFixed(2) : '?'} - ${
                                event.priceMax != null ? (event.priceMax / 100).toFixed(2) : '?'
                              } ${event.currency}`
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Organizer */}
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Organisateur</div>
                          {event.organizer ? (
                            <Link
                              href={`/organisateur/${event.organizer.id}`}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {event.organizer.displayName}
                              {event.organizer.verified && <span className="text-green-600">✓</span>}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-600">Organisateur externe</span>
                          )}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 text-teal-600 mt-0.5 flex items-center justify-center">
                          🌐
                        </div>
                        <div>
                          <div className="font-medium">Langue</div>
                          <div className="text-sm text-gray-600">
                            {event.language === 'FR'
                              ? 'Français'
                              : event.language === 'EN'
                              ? 'Anglais'
                              : 'Français et Anglais'}
                          </div>
                        </div>
                      </div>

                      {/* Accessibility */}
                      {event.accessibility.length > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 text-orange-600 mt-0.5 flex items-center justify-center">
                            ♿
                          </div>
                          <div>
                            <div className="font-medium">Accessibilité</div>
                            <div className="text-sm text-gray-600">
                              {event.accessibility
                                .map((a) =>
                                  a === 'wheelchair'
                                    ? 'Accès fauteuil roulant'
                                    : a === 'hearing_assistance'
                                    ? 'Assistance auditive'
                                    : a,
                                )
                                .join(', ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Lieu
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium">{event.venue?.name ?? 'Lieu à confirmer'}</div>
                        <div className="text-sm text-gray-600">
                          {event.venue ? `${event.venue.address}, ${event.venue.city}` : 'À déterminer'}
                        </div>
                      </div>

                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                        {event.venue ? (
                          <EventDetailMap
                            lat={event.venue.lat}
                            lon={event.venue.lon}
                            title={event.title}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            Carte interactive bientôt disponible
                          </div>
                        )}
                      </div>

                      {event.venue && (
                        <a
                          href={`https://maps.google.com/?q=${event.venue.lat},${event.venue.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir dans Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  {!isPastEvent && !isCancelled && event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl text-center hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Acheter des billets
                    </a>
                  )}
                </div>
              </div>
            }
            feedContent={<EventFeedPanel eventId={event.id} canPost={canPostToFeed} />}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading event:', error);
    notFound();
  }
}
