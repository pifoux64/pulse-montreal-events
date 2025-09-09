/**
 * Configuration i18n pour Pulse Montreal
 * Support du français et de l'anglais
 */

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Langues supportées
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

// Langue par défaut
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ locale }) => {
  // Valider que la locale est supportée
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
