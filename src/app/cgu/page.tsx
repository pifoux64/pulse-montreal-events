import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.termsOfService');
  return {
    title: `${t('title')} - Pulse Montreal`,
    description: t('title'),
  };
}

export default async function CGUPage() {
  const t = await getTranslations('legal.termsOfService');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-4xl font-bold text-white mb-8">{t('title')}</h1>
        
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-8 border border-white/10 space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. {t('object')}</h2>
            <p>
              {t('objectDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. {t('acceptance')}</h2>
            <p>
              {t('acceptanceDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. {t('siteUse')}</h2>
            <p>
              {t('siteUseDesc')}
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>{t('siteUseList1')}</li>
              <li>{t('siteUseList2')}</li>
              <li>{t('siteUseList3')}</li>
              <li>{t('siteUseList4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. {t('userAccount')}</h2>
            <p>
              {t('userAccountDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. {t('publishedContent')}</h2>
            <p>
              {t('publishedContentDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. {t('intellectualProperty')}</h2>
            <p>
              {t('intellectualPropertyDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. {t('liabilityLimitation')}</h2>
            <p>
              {t('liabilityLimitationDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. {t('tosModification')}</h2>
            <p>
              {t('tosModificationDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. {t('applicableLaw')}</h2>
            <p>
              {t('applicableLawDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. {t('contact')}</h2>
            <p>
              {t('contactDesc')}{' '}
              <a href="mailto:contact@pulse-mtl.com" className="text-sky-400 hover:text-sky-300 underline ml-1">
                contact@pulse-mtl.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/mentions-legales"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            {t('legalNotice')}
          </Link>
          <Link
            href="/politique-confidentialite"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            {t('privacyPolicy')}
          </Link>
        </div>
      </main>
    </div>
  );
}

