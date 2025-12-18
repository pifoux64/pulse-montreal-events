import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navigation from '@/components/Navigation';
import { Calendar, Trophy, ArrowRight } from 'lucide-react';

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: 'Pulse Picks | Top 5 Événements à Montréal',
  description: 'Découvrez les sélections Pulse des meilleurs événements à Montréal. Top 5 hebdomadaires par thème.',
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/picks`,
    title: 'Pulse Picks | Top 5 Événements à Montréal',
    description: 'Découvrez les sélections Pulse des meilleurs événements à Montréal',
    siteName: 'Pulse Montréal',
  },
};

export default async function PicksPage() {
  const posts = await prisma.editorialPost.findMany({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: [
      { publishedAt: 'desc' },
      { periodStart: 'desc' },
    ],
    take: 50,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pulse Picks
          </h1>
          <p className="text-lg text-slate-400">
            Les sélections Pulse des meilleurs événements à Montréal
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400">
              Aucun Pulse Picks publié pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/top-5/${post.slug}`}
                className="group p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <Trophy className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Top 5
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors mb-1">
                      {post.title || `Top 5 ${post.theme}`}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {post.theme}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors flex-shrink-0" />
                </div>

                {post.description && (
                  <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                    {post.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(post.periodStart).toLocaleDateString('fr-CA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' - '}
                    {new Date(post.periodEnd).toLocaleDateString('fr-CA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {post.eventsOrder.length > 0 && (
                  <div className="mt-4 text-xs text-slate-500">
                    {post.eventsOrder.length} événement{post.eventsOrder.length > 1 ? 's' : ''}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

