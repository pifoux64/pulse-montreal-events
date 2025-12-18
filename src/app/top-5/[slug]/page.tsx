import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatEventDate } from '@/lib/utils';
import EventCard from '@/components/EventCard';
import { useFavorites } from '@/hooks/useFavorites';
import Top5EventCardWrapper from '@/components/Top5EventCardWrapper';

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
  const description = post.description ||
    `Découvrez la sélection Pulse des meilleurs événements ${post.theme} à Montréal pour la période du ${post.periodStart.toLocaleDateString('fr-CA')} au ${post.periodEnd.toLocaleDateString('fr-CA')}.`;
  
  const canonical = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/top-5/${post.slug}`;
  const ogImage = post.events[0]?.imageUrl 
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
  const post = await prisma.editorialPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post || post.status === 'ARCHIVED') {
    notFound();
  }

  const events = post.eventsOrder.length
    ? await prisma.event.findMany({
        where: {
          id: {
            in: post.eventsOrder,
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
  const orderedEvents = post.eventsOrder
    .map((id) => eventMap.get(id))
    .filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">
            ← Retour à l'accueil
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <p className="text-slate-300 text-sm mb-4">
          Top 5 {post.theme} à Montréal
        </p>
        <p className="text-slate-400 text-xs mb-6">
          Période du {formatEventDate(post.periodStart)} au {formatEventDate(post.periodEnd)}
        </p>

        {post.description && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-8 text-sm text-slate-100 whitespace-pre-line">
            {post.description}
          </div>
        )}

        {orderedEvents.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucun événement sélectionné pour ce Top 5 pour le moment.</p>
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

