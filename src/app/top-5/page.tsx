import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Trophy, Calendar, ArrowRight, Brain } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { getTranslations } from 'next-intl/server';

// Marquer la page comme dynamique pour éviter les erreurs de build
export const dynamic = 'force-dynamic';

export default async function Top5ListPage() {
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const posts = await prisma.editorialPost.findMany({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: {
      periodStart: 'desc',
    },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-10 pt-32">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                {t('pulsePicks')}
                <span className="text-sm px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  IA
                </span>
              </h1>
              <p className="text-slate-400 mt-1">{t('top5AI')}</p>
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">{t('noTop5Published')}</p>
            <p className="text-slate-500 text-sm mt-2">
              {t('top5GeneratedWeekly')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/top-5/${post.slug}`}
                className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-amber-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-slate-400 mb-3">
                      {post.description || t('discoverBestEvents', { theme: post.theme })}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-sm font-bold">
                    {t('top5')}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  {post.periodStart && post.periodEnd ? (
                    <div className="flex items-center gap-2">
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
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-slate-500">Date non disponible</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300">
                    {tCommon('view')}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-slate-500">
                    {t('eventCount', { count: (post.eventsOrder || []).length })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

