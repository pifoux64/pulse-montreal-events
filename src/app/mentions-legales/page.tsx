import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.legalNotice');
  return {
    title: `${t('title')} - Pulse Montreal`,
    description: t('title'),
  };
}

export default async function MentionsLegalesPage() {
  const t = await getTranslations('legal.legalNotice');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-4xl font-bold text-white mb-8">{t('title')}</h1>
        
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-8 border border-white/10 space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. {t('editor')}</h2>
            <p>
              {t('editorDesc')}
            </p>
            <p className="mt-2">
              <strong>Pulse Montreal</strong><br />
              Montréal, Québec, Canada<br />
              Email: contact@pulse-mtl.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. {t('publicationDirector')}</h2>
            <p>
              {t('publicationDirectorDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. {t('hosting')}</h2>
            <p>
              {t('hostingDesc')}
            </p>
            <p className="mt-2">
              <strong>Vercel Inc.</strong><br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              États-Unis
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. {t('intellectualProperty')}</h2>
            <p>
              {t('intellectualPropertyDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. {t('personalData')}</h2>
            <p>
              {t('personalDataDesc')}{' '}
              <Link href="/politique-confidentialite" className="text-sky-400 hover:text-sky-300 underline">
                {t('privacyPolicy')}
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. {t('responsibility')}</h2>
            <p>
              {t('responsibilityDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. {t('externalLinks')}</h2>
            <p>
              {t('externalLinksDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. {t('contact')}</h2>
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
            href="/cgu"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            {t('termsOfService')}
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

