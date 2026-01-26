'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  
  return (
    <footer className="bg-slate-950/70 backdrop-blur-xl border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('about')}</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-sky-400 transition-colors">
                  {t('features')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-sky-400 transition-colors">
                  {t('pricing')}
                </Link>
              </li>
              <li>
                <Link href="/carte" className="hover:text-sky-400 transition-colors">
                  {t('map')}
                </Link>
              </li>
              <li>
                <Link href="/calendrier" className="hover:text-sky-400 transition-colors">
                  {t('calendar')}
                </Link>
              </li>
              <li>
                <Link href="/publier" className="hover:text-sky-400 transition-colors">
                  {t('publishEvent')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('legal')}</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <Link href="/mentions-legales" className="hover:text-sky-400 transition-colors">
                  {t('legalNotice')}
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="hover:text-sky-400 transition-colors">
                  {t('termsOfService')}
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="hover:text-sky-400 transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('support')}</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <a href="mailto:contact@pulse-mtl.com" className="hover:text-sky-400 transition-colors">
                  {t('contact')}
                </a>
              </li>
              <li>
                <a href="mailto:support@pulse-mtl.com" className="hover:text-sky-400 transition-colors">
                  {t('support')}
                </a>
              </li>
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('followUs')}</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <a href="#" className="hover:text-sky-400 transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-400 transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-400 transition-colors">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Pulse Montreal. {t('allRightsReserved')}.
          </p>
          <p className="text-slate-400 text-sm mt-4 md:mt-0 flex items-center gap-1">
            {t('madeWith')} <Heart className="w-4 h-4 text-red-500 fill-current" /> {t('inMontreal')}
          </p>
        </div>
      </div>
    </footer>
  );
}

