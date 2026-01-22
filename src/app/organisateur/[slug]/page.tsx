/**
 * Page publique pour un organisateur (par slug)
 * Route: /organisateur/[slug]
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import OrganisateurPageClient from './OrganisateurPageClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const organizer = await prisma.organizer.findUnique({
    where: { slug: params.slug },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!organizer) {
    return {
      title: 'Organisateur non trouvé',
    };
  }

  return {
    title: `${organizer.displayName} - Organisateur d'événements à Montréal | Pulse`,
    description: `Découvrez les événements organisés par ${organizer.displayName} à Montréal.`,
    openGraph: {
      title: `${organizer.displayName} - Organisateur d'événements`,
      description: `Découvrez les événements organisés par ${organizer.displayName} à Montréal.`,
      images: organizer.user?.image ? [organizer.user.image] : undefined,
    },
  };
}

export default async function OrganisateurPage({ params }: { params: { slug: string } }) {
  const organizer = await prisma.organizer.findUnique({
    where: { slug: params.slug },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
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
        take: 50,
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          imageUrl: true,
          category: true,
          tags: true,
          priceMin: true,
          priceMax: true,
          currency: true,
          venue: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              city: true,
            },
          },
        },
      },
      _count: {
        select: {
          events: true,
          followers: true,
        },
      },
    },
  });

  if (!organizer) {
    notFound();
  }

  return <OrganisateurPageClient organizer={organizer} />;
}
