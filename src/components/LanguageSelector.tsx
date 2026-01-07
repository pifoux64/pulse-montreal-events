'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { locales, type Locale } from '@/lib/i18n';

const LOCALE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

const LOCALE_FLAGS: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
};

export default function LanguageSelector() {
  const t = useTranslations('language');
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>('fr');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Détecter la locale actuelle depuis le cookie ou le pathname
  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined;
    
    if (cookieLocale && locales.includes(cookieLocale)) {
      setCurrentLocale(cookieLocale);
    } else {
      // Détecter depuis le pathname
      const pathLocale = pathname.split('/')[1] as Locale;
      if (locales.includes(pathLocale)) {
        setCurrentLocale(pathLocale);
      }
    }
  }, [pathname]);

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
    // Note: Pour une vraie implémentation next-intl avec routes [locale],
    // il faudrait rediriger vers /[locale]/pathname
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={t('select')}
        title={t('select')}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALE_FLAGS[currentLocale]}</span>
        <span className="hidden md:inline">{LOCALE_NAMES[currentLocale]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => changeLanguage(locale)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                currentLocale === locale
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{LOCALE_FLAGS[locale]}</span>
              <span className="flex-1">{LOCALE_NAMES[locale]}</span>
              {currentLocale === locale && (
                <Check className="w-4 h-4 text-sky-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

