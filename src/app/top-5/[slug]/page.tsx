import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { formatEventDate } from '@/lib/utils';
import Top5EventCardWrapper from '@/components/Top5EventCardWrapper';
import Top5PageClient from './Top5PageClient';

export const dynamic = 'force-dynamic';

interface Top5PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: Top5PageProps): Promise<Metadata> {
  const post = await prisma.editorialPost.findUnique({
    where: { slug: params.slug },
    include: {
      events: {
        take: 1,
        select: {
          imageUrl: true,
        },
      },
    },
  });

  if (!post) {
    return {
      title: 'Top 5 non trouvé | Pulse Montréal',
    };
  }

  const title = post.title || `Top 5 ${post.theme} à Montréal`;
  const periodStartStr = post.periodStart ? new Date(post.periodStart).toLocaleDateString('fr-CA') : '';
  const periodEndStr = post.periodEnd ? new Date(post.periodEnd).toLocaleDateString('fr-CA') : '';
  const description = post.description ||
    (periodStartStr && periodEndStr
      ? `Découvrez la sélection Pulse des meilleurs événements ${post.theme} à Montréal pour la période du ${periodStartStr} au ${periodEndStr}.`
      : `Découvrez la sélection Pulse des meilleurs événements ${post.theme} à Montréal.`);
  
  const canonical = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/top-5/${post.slug}`;
  // Récupérer l'image du premier événement si disponible
  const firstEventImage = post.events && post.events.length > 0 ? post.events[0]?.imageUrl : null;
  const ogImage = firstEventImage
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/api/og/top5/${post.slug}`
    : `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-top5-default.png`;

  return {
    title: `${title} | Pulse Montréal`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      locale: 'fr_CA',
      url: canonical,
      title,
      description,
      siteName: 'Pulse Montréal',
      publishedTime: post.publishedAt?.toISOString(),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Top5Page({ params }: Top5PageProps) {
  const t = await getTranslations('top5');
  const post = await prisma.editorialPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post || post.status === 'ARCHIVED') {
    notFound();
  }

  // Vérifier que eventsOrder existe et n'est pas vide
  const eventsOrder = post.eventsOrder || [];
  const events = eventsOrder.length > 0
    ? await prisma.event.findMany({
        where: {
          id: {
            in: eventsOrder,
          },
        },
        include: {
          venue: true,
          eventTags: true,
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      })
    : [];

  // Réordonner les événements selon eventsOrder
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const orderedEvents = eventsOrder
    .map((id) => eventMap.get(id))
    .filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">
            {t('backToHome')}
          </Link>
        </div>

        <Top5PageClient
          post={{
            id: post.id,
            slug: post.slug,
            title: post.title || `Top 5 ${post.theme}`,
            theme: post.theme,
            description: post.description,
            periodStart: post.periodStart ? post.periodStart.toISOString() : new Date().toISOString(),
            periodEnd: post.periodEnd ? post.periodEnd.toISOString() : new Date().toISOString(),
          }}
          eventIds={eventsOrder}
        />

        {orderedEvents.length === 0 ? (
          <p className="text-slate-400 text-sm">{t('noEventsSelected')}</p>
        ) : (
          <div className="space-y-4">
            {orderedEvents.map((event, index) => (
              <div key={event.id} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-2">
                  {index + 1}
                </div>
                <Top5EventCardWrapper event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

