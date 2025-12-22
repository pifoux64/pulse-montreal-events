import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import CeSoirPageClient from './CeSoirPageClient';
import { prisma } from '@/lib/prisma';
import { Event } from '@/types';

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: 'Ce soir à Montréal | Pulse',
  description: 'Découvrez les événements de ce soir à Montréal. Concerts, spectacles, festivals et plus encore.',
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/ce-soir`,
    title: 'Ce soir à Montréal | Pulse',
    description: 'Découvrez les événements de ce soir à Montréal',
    siteName: 'Pulse Montréal',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-tonight.png`,
        width: 1200,
        height: 630,
        alt: 'Ce soir à Montréal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ce soir à Montréal | Pulse',
    description: 'Découvrez les événements de ce soir à Montréal',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-tonight.png`],
  },
};

async function getTonightEvents(): Promise<Event[]> {
  const montrealTZ = 'America/Montreal';
  const now = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: montrealTZ }));
  today.setHours(0, 0, 0, 0);
  
  // Ce soir = de maintenant jusqu'à minuit
  const midnight = new Date(today);
  midnight.setDate(midnight.getDate() + 1);

  // Convertir en UTC pour la requête
  const startUTC = new Date(today.toLocaleString('en-US', { timeZone: 'UTC' }));
  const endUTC = new Date(midnight.toLocaleString('en-US', { timeZone: 'UTC' }));

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: {
        gte: startUTC,
        lt: endUTC,
      },
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
      eventTags: true,
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    orderBy: {
      startAt: 'asc',
    },
    take: 50,
  });

  // Transformer en format Event
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || '',
    shortDescription: e.description?.substring(0, 100) + '...' || '',
    startDate: e.startAt,
    endDate: e.endAt,
    location: {
      name: e.venue?.name || 'Lieu à confirmer',
      address: e.venue?.address || '',
      city: e.venue?.city || 'Montréal',
      postalCode: e.venue?.postalCode || '',
      coordinates: {
        lat: e.venue?.lat ?? 45.5088,
        lng: e.venue?.lon ?? -73.5542,
      },
    },
    category: e.category,
    subCategory: e.subcategory || '',
    tags: e.tags,
    price: {
      amount: e.priceMin != null ? e.priceMin / 100 : 0,
      currency: e.currency || 'CAD',
      isFree: e.priceMin === 0 && e.priceMin != null, // Gratuit seulement si explicitement 0
    },
    imageUrl: e.imageUrl,
    ticketUrl: e.url || '#',
    organizerId: e.organizerId || 'default',
    organizer: {
      id: e.organizerId || 'default',
      email: e.organizer?.user?.email || 'api@pulse.com',
      name: e.organizer?.displayName || e.organizer?.user?.name || 'Organisateur',
      role: 'organizer' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    customFilters: [],
    accessibility: e.accessibility,
    status: e.status.toLowerCase() as 'published' | 'draft' | 'cancelled',
    source: e.source,
    externalId: e.externalId || e.id,
    language: e.language.toLowerCase() as 'fr' | 'en',
    minAttendees: e.minAttendees || 0,
    maxAttendees: e.maxAttendees || 0,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
}

export default async function CeSoirPage() {
  const events = await getTonightEvents();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ce soir à Montréal
          </h1>
          <p className="text-lg text-gray-600">
            {events.length} événement{events.length > 1 ? 's' : ''} ce soir
          </p>
        </div>

        <CeSoirPageClient events={events} />
      </main>
    </div>
  );
}

