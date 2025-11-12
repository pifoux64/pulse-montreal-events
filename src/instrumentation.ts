/**
 * Fichier d'instrumentation Sentry pour Next.js
 * Ce fichier est exécuté une fois au démarrage du serveur
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

