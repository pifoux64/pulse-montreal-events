import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.privacyPolicy');
  return {
    title: `${t('title')} - Pulse Montreal`,
    description: t('title'),
  };
}

export default async function PolitiqueConfidentialitePage() {
  const t = await getTranslations('legal.privacyPolicy');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-4xl font-bold text-white mb-8">{t('title')}</h1>
        
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-8 border border-white/10 space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. {t('introduction')}</h2>
            <p>
              {t('introductionDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. {t('collectedData')}</h2>
            <p>{t('collectedDataDesc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>{t('collectedDataList1')}</li>
              <li>{t('collectedDataList2')}</li>
              <li>{t('collectedDataList3')}</li>
              <li>{t('collectedDataList4')}</li>
            </ul>
          </section>


          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. {t('dataUsage')}</h2>
            <p>{t('dataUsageDesc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>{t('dataUsageList1')}</li>
              <li>{t('dataUsageList2')}</li>
              <li>{t('dataUsageList3')}</li>
              <li>{t('dataUsageList4')}</li>
              <li>{t('dataUsageList5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. {t('dataSharing')}</h2>
            <p>
              {t('dataSharingDesc')}
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>{t('dataSharingList1')}</li>
              <li>{t('dataSharingList2')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. {t('dataRetention')}</h2>
            <p>
              {t('dataRetentionDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. {t('yourRights')}</h2>
            <p>{t('yourRightsDesc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>{t('yourRightsList1')}</li>
              <li>{t('yourRightsList2')}</li>
              <li>{t('yourRightsList3')}</li>
              <li>{t('yourRightsList4')}</li>
              <li>{t('yourRightsList5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. {t('cookies')}</h2>
            <p>
              {t('cookiesDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. {t('security')}</h2>
            <p>
              {t('securityDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. {t('modifications')}</h2>
            <p>
              {t('modificationsDesc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. {t('contact')}</h2>
            <p>
              {t('contactDesc')}{' '}
              <a href="mailto:privacy@pulse-mtl.com" className="text-sky-400 hover:text-sky-300 underline ml-1">
                privacy@pulse-mtl.com
              </a>
            </p>
          </section>

          <section>
            <p className="text-sm text-slate-400">
              {t('lastUpdate')} {new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Montreal' })}
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
            href="/cgu"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            {t('termsOfService')}
          </Link>
        </div>
      </main>
    </div>
  );
}

