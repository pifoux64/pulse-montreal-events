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
  // Valider que la locale est supportée
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
