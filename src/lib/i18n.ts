/**
 * Configuration i18n pour Pulse Montreal
 * Support du français, anglais et espagnol
 */

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Langues supportées
export const locales = ['fr', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];

// Langue par défaut
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ locale }) => {
  // Si la locale n'est pas fournie par le middleware, utiliser la locale par défaut
  let detectedLocale = locale || defaultLocale;

  // Valider que la locale est supportée
  if (!locales.includes(detectedLocale as Locale)) {
    detectedLocale = defaultLocale;
  }

  return {
    messages: (await import(`../../messages/${detectedLocale}.json`)).default,
  };
});
