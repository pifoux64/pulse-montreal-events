import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Globe, Users, Calendar, ExternalLink, Building2, Star, TrendingUp, Sparkles, Clock, Mail, Award } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { prisma } from '@/lib/prisma';
import { buildVenueJsonLd, canonicalUrlForPath } from '@/lib/seo';
import { VenueImage } from '@/components/VenueImage';
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
          status: {
            in: ['SCHEDULED', 'UPDATED'], // Inclure SCHEDULED et UPDATED
          },
          startAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          startAt: 'asc',
        },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              city: true,
              postalCode: true,
              lat: true,
              lon: true,
            },
          },
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { getTranslations } = await import('next-intl/server');
  const t = await getTranslations('venues');
  
  const venue = await fetchVenue(slug);

  if (!venue) {
    return {
      title: `${t('notFound')} | Pulse Montréal`,
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

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const venue = await fetchVenue(slug);

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

    // Récupérer les événements passés (limité à 20 pour avoir plus d'historique)
    const pastEvents = await prisma.event.findMany({
      where: {
        venueId: venue.id,
        status: {
          in: ['SCHEDULED', 'UPDATED'], // Inclure SCHEDULED et UPDATED
        },
        startAt: {
          lt: now,
        },
      },
      orderBy: {
        startAt: 'desc',
      },
      take: 20,
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

    // Calculer les statistiques des événements passés
    const pastEventsStats = {
      total: pastEvents.length,
      categories: pastEvents.reduce((acc, event) => {
        const cat = event.category || 'OTHER';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tags: pastEvents.reduce((acc, event) => {
        if (event.tags && Array.isArray(event.tags)) {
          event.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
        }
        return acc;
      }, {} as Record<string, number>),
    };

    const jsonLd = buildVenueJsonLd(venue);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Hero Section Premium avec gradient animé */}
        <div className="relative pt-24 pb-16 overflow-hidden">
          {/* Background animé */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header Premium */}
              <div className="relative p-8 sm:p-12">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      {venue.neighborhood && (
                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                          <span className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {venue.neighborhood}
                          </span>
                        </div>
                      )}
                      {venue._count.events > 10 && (
                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                          <span className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Populaire
                          </span>
                        </div>
                      )}
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-purple-200">
                      {venue.name}
                    </h1>
                    <p className="text-xl text-slate-300 mb-6">
                      {venue.city}, Québec
                    </p>
                  </div>
                  
                  {/* Types badges */}
                  {venue.types && venue.types.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {venue.types.map((type) => (
                        <span
                          key={type}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-semibold backdrop-blur-sm"
                        >
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image de la salle */}
                {venue.imageUrl && (
                  <div className="mb-8 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                    <VenueImage
                      src={venue.imageUrl}
                      alt={venue.name}
                      width={1200}
                      height={600}
                      className="w-full h-[400px] object-cover"
                      priority
                      unoptimized={false}
                    />
                  </div>
                )}

                {/* Description enrichie */}
                {venue.description && (
                  <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className="text-slate-200 leading-relaxed text-lg">
                      {venue.description}
                    </p>
                  </div>
                )}

                {/* Tags / Styles d'événements */}
                {venue.tags && venue.tags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      Styles d'événements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {venue.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-200 rounded-xl text-sm font-medium backdrop-blur-sm hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats et informations pratiques - Design premium */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {/* Événements */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/30">
                        <Calendar className="h-5 w-5 text-blue-300" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Événements</p>
                        <p className="text-2xl font-bold text-white">
                          {venue._count.events}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Capacité */}
                  {venue.capacity && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/30">
                          <Users className="h-5 w-5 text-purple-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Capacité</p>
                          <p className="text-2xl font-bold text-white">
                            {venue.capacity.toLocaleString('fr-CA')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adresse */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/30 mt-0.5">
                        <MapPin className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Adresse</p>
                        <p className="text-sm text-white font-medium leading-tight">
                          {venue.address}
                          <br />
                          <span className="text-slate-300">{venue.city}, {venue.postalCode}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  {(venue.phone || venue.website || venue.contactEmail) && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/30 mt-0.5">
                          <Phone className="h-5 w-5 text-amber-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Contact</p>
                          <div className="space-y-1.5">
                            {venue.phone && (
                              <a
                                href={`tel:${venue.phone}`}
                                className="block text-sm text-white font-medium hover:text-amber-300 transition-colors"
                              >
                                {venue.phone}
                              </a>
                            )}
                            {venue.website && (
                              <a
                                href={venue.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-white font-medium hover:text-amber-300 transition-colors"
                              >
                                <Globe className="h-3 w-3" />
                                Site web
                              </a>
                            )}
                            {venue.contactEmail && (
                              <a
                                href={`mailto:${venue.contactEmail}`}
                                className="flex items-center gap-1 text-sm text-white font-medium hover:text-amber-300 transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                                Email
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Carte améliorée */}
                <div className="mb-8">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/20 shadow-2xl">
                    <EventDetailMap
                      lat={venue.lat}
                      lon={venue.lon}
                      title={venue.name}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
                    <a
                      href={`https://maps.google.com/?q=${venue.lat},${venue.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-blue-300 transition-all text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir dans Google Maps
                    </a>
                    <VenueRequestButton venueId={venue.id} venueName={venue.slug || venue.name} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Événements à venir - Section premium */}
          {upcomingEvents.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
                      Événements à venir
                    </h2>
                    <p className="text-slate-400">
                      {upcomingEvents.length} événement{upcomingEvents.length > 1 ? 's' : ''} programmé{upcomingEvents.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="w-full min-w-0">
                    <VenueEventCard event={event} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ce week-end dans cette salle */}
          {weekendEvents.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
                    Ce week-end
                  </h2>
                  <p className="text-slate-400">
                    {weekendEvents.length} événement{weekendEvents.length > 1 ? 's' : ''} à ne pas manquer
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {weekendEvents.map((event) => (
                  <div key={event.id} className="w-full min-w-0">
                    <VenueEventCard event={event} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Événements passés avec statistiques */}
          {pastEvents.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30">
                    <Clock className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
                      Événements passés
                    </h2>
                    <p className="text-slate-400">
                      Historique des {pastEvents.length} derniers événements organisés dans cette salle
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistiques des événements passés */}
              {Object.keys(pastEventsStats.categories).length > 0 && (
                <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    Types d'événements organisés
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(pastEventsStats.categories)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([category, count]) => (
                        <div
                          key={category}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-600/20 to-slate-700/20 border border-slate-500/30"
                        >
                          <span className="text-sm font-semibold text-white">{category.replace(/_/g, ' ')}</span>
                          <span className="ml-2 text-xs text-slate-400">({count})</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <div key={event.id} className="w-full min-w-0">
                    <VenueEventCard event={event} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message si aucun événement */}
          {upcomingEvents.length === 0 && pastEvents.length === 0 && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 inline-block mb-6">
                <Building2 className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Aucun événement pour le moment
              </h3>
              <p className="text-slate-400 text-lg mb-6">
                Cette salle n'a pas encore d'événements programmés.
              </p>
              <VenueRequestButton venueId={venue.id} venueName={venue.slug || venue.name} />
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
