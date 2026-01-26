/**
 * Page publique pour un organisateur (par slug ou ID)
 * Route: /organisateur/[param]
 * Gère à la fois les slugs et les IDs pour compatibilité
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import OrganisateurPageClient from './OrganisateurPageClient';

// Fonction pour détecter si le paramètre est un UUID (ID) ou un slug
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function generateMetadata({ params }: { params: Promise<{ param: string }> }): Promise<Metadata> {
  const { param } = await params;
  const isId = isUUID(param);
  
  const organizer = await prisma.organizer.findUnique({
    where: isId ? { id: param } : { slug: param },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  const { getTranslations } = await import('next-intl/server');
  const t = await getTranslations('organizers');
  
  if (!organizer) {
    return {
      title: t('notFound'),
    };
  }

  return {
    title: `${organizer.displayName} - ${t('title')} à Montréal | Pulse`,
    description: `${t('subtitle')} ${organizer.displayName} à Montréal.`,
    openGraph: {
      title: `${organizer.displayName} - ${t('title')}`,
      description: `${t('subtitle')} ${organizer.displayName} à Montréal.`,
      images: organizer.user?.image ? [organizer.user.image] : undefined,
    },
  };
}

export default async function OrganisateurPage({ params }: { params: Promise<{ param: string }> }) {
  const { param } = await params;
  const isId = isUUID(param);
  
  const organizer = await prisma.organizer.findUnique({
    where: isId ? { id: param } : { slug: param },
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
          status: { in: ['SCHEDULED', 'UPDATED'] },
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
