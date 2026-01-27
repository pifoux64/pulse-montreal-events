'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { locales, type Locale } from '@/lib/i18n';

const LOCALE_FLAGS: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
};

const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
};

export default function LanguageSwitcherFlag() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const changeLanguage = async (locale: Locale) => {
    setIsOpen(false);
    
    if (locale === currentLocale) return;

    // Sauvegarder dans le cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;

    // Sauvegarder dans les préférences utilisateur si connecté
    try {
      await fetch('/api/user/preferences/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: locale }),
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error);
    }

    // Recharger la page pour appliquer la nouvelle langue
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 opacity-80 hover:opacity-100"
        aria-label={`Change language (current: ${LOCALE_LABELS[currentLocale]})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={LOCALE_LABELS[currentLocale]}
      >
        <span className="text-lg" role="img" aria-label={LOCALE_LABELS[currentLocale]}>
          {LOCALE_FLAGS[currentLocale]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl py-2 z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => changeLanguage(locale)}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white/10 transition-colors ${
                locale === currentLocale ? 'bg-sky-500/20 text-sky-400' : 'text-slate-200'
              }`}
            >
              <span className="text-xl" role="img" aria-label={LOCALE_LABELS[locale]}>
                {LOCALE_FLAGS[locale]}
              </span>
              <span className="text-sm font-medium">{LOCALE_LABELS[locale]}</span>
              {locale === currentLocale && (
                <span className="ml-auto text-sky-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
