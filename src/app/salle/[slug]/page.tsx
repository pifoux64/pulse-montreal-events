import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Globe, Users, Calendar, ExternalLink, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { prisma } from '@/lib/prisma';
import { buildVenueJsonLd, canonicalUrlForPath } from '@/lib/seo';
import EventDetailMap from '@/components/EventDetailMap';
import VenueEventCard from '@/components/VenueEventCard';
import VenueRequestButton from '@/components/VenueRequestButton';

const SAFE_DESCRIPTION_LENGTH = 160;
export const revalidate = 600; // 10 minutes

async function fetchVenue(slug: string) {
  return prisma.venue.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      events: {
        where: {
          status: 'SCHEDULED',
          startAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          startAt: 'asc',
        },
        include: {
          organizer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const venue = await fetchVenue(params.slug);

  if (!venue) {
    return {
      title: 'Salle non trouvée | Pulse Montréal',
    };
  }

  const descriptionSnippet = venue.description
    ? venue.description.substring(0, SAFE_DESCRIPTION_LENGTH)
    : `Découvrez ${venue.name}, ${venue.address}, ${venue.city}. Événements à venir, informations pratiques.`;

  const canonical = canonicalUrlForPath(`/salle/${venue.slug}`);

  return {
    title: `${venue.name} | Pulse Montréal`,
    description: descriptionSnippet,
    keywords: [
      venue.name,
      venue.neighborhood || '',
      venue.city,
      ...venue.types,
      ...venue.tags,
      'montréal',
      'salle',
      'lieu',
      'événement',
    ].filter(Boolean),
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      locale: 'fr_CA',
      url: canonical,
      title: venue.name,
      description: descriptionSnippet,
      siteName: 'Pulse Montréal',
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-venue-default.png`,
          width: 1200,
          height: 630,
          alt: venue.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: venue.name,
      description: descriptionSnippet,
    },
  };
}

export default async function VenuePage({ params }: { params: { slug: string } }) {
  try {
    const venue = await fetchVenue(params.slug);

    if (!venue) {
      notFound();
    }

    const now = new Date();
    const thisWeekend = new Date(now);
    thisWeekend.setDate(now.getDate() + (6 - now.getDay())); // Dimanche de cette semaine
    thisWeekend.setHours(23, 59, 59, 999);

    const upcomingEvents = venue.events.filter(
      (e) => new Date(e.startAt) >= now
    );
    const weekendEvents = upcomingEvents.filter(
      (e) => new Date(e.startAt) <= thisWeekend
    );

    // Récupérer les événements passés (limité à 10)
    const pastEvents = await prisma.event.findMany({
      where: {
        venueId: venue.id,
        status: 'SCHEDULED',
        startAt: {
          lt: now,
        },
      },
      orderBy: {
        startAt: 'desc',
      },
      take: 10,
      include: {
        organizer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        venue: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    const jsonLd = buildVenueJsonLd(venue);

    return (
      <div className="min-h-screen pt-24 pb-12">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                      {venue.name}
                    </h1>
                    {venue.neighborhood && (
                      <p className="text-lg text-gray-600 mb-4">
                        {venue.neighborhood}, {venue.city}
                      </p>
                    )}
                  </div>
                  {venue.types && venue.types.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {venue.types.map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                {venue.description && (
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {venue.description}
                  </p>
                )}

                {/* Informations pratiques */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="text-gray-900 font-medium">
                        {venue.address}
                        <br />
                        {venue.city}, {venue.postalCode}
                      </p>
                    </div>
                  </div>

                  {venue.capacity && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Capacité</p>
                        <p className="text-gray-900 font-medium">
                          {venue.capacity.toLocaleString('fr-CA')} personnes
                        </p>
                      </div>
                    </div>
                  )}

                  {venue.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <a
                          href={`tel:${venue.phone}`}
                          className="text-gray-900 font-medium hover:text-blue-600"
                        >
                          {venue.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {venue.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Site web</p>
                        <a
                          href={venue.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 font-medium hover:text-blue-600 inline-flex items-center gap-1"
                        >
                          Visiter le site
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Carte */}
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 mb-6">
                  <EventDetailMap
                    lat={venue.lat}
                    lon={venue.lon}
                    title={venue.name}
                  />
                </div>

                <div className="flex gap-3 items-center justify-between">
                  <a
                    href={`https://maps.google.com/?q=${venue.lat},${venue.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir dans Google Maps
                  </a>
                  <VenueRequestButton venueId={venue.id} venueName={venue.slug || venue.name} />
                </div>
              </div>
            </div>
          </div>

          {/* Événements à venir */}
          {upcomingEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Événements à venir
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <VenueEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Ce week-end dans cette salle */}
          {weekendEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ce week-end dans cette salle
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weekendEvents.map((event) => (
                  <VenueEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Événements passés */}
          {pastEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Événements passés
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <VenueEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Message si aucun événement */}
          {upcomingEvents.length === 0 && pastEvents.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Aucun événement enregistré pour cette salle pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Erreur lors de la récupération de la salle:', error);
    notFound();
  }
}
