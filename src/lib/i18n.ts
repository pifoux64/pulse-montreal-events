/**
 * Configuration i18n pour Pulse Montreal
 * Support du français, anglais et espagnol
 */

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { getLocale } from 'next-intl/server';

// Langues supportées
export const locales = ['fr', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];

// Langue par défaut
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ locale }) => {
  // Essayer d'obtenir la locale depuis next-intl
  let detectedLocale = locale;
  
  // Si la locale n'est pas fournie, essayer de la lire depuis getLocale
  if (!detectedLocale) {
    try {
      detectedLocale = await getLocale();
    } catch (error) {
      // Si getLocale échoue, utiliser la locale par défaut
      detectedLocale = defaultLocale;
    }
  }

  // Si toujours pas de locale, utiliser la locale par défaut
  if (!detectedLocale) {
    detectedLocale = defaultLocale;
  }

  // Valider que la locale est supportée
  if (!locales.includes(detectedLocale as Locale)) {
    detectedLocale = defaultLocale;
  }

  return {
    messages: (await import(`../../messages/${detectedLocale}.json`)).default,
  };
});
