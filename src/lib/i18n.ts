/**
 * Configuration i18n pour Pulse Montreal
 * Support du français, anglais et espagnol
 */

import { getRequestConfig } from 'next-intl/server';

// Langues supportées
export const locales = ['fr', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];

// Langue par défaut
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ requestLocale }) => {
  // Si la locale n'est pas fournie par next-intl (sans middleware),
  // utiliser la locale par défaut
  // Le client (AppWrapper) gère déjà la locale côté client via le cookie
  const requested = await requestLocale;
  const validLocale = (requested && locales.includes(requested as Locale)) ? requested : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default,
  };
});
