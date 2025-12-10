/**
 * Configuration du logger Pino pour Pulse Montreal
 * Logger structuré pour le développement et la production
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Configuration du logger
// En production, on utilise les logs JSON structurés (pas de transport)
// En développement, on utilise pino-pretty si disponible
const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  base: {
    env: process.env.NODE_ENV,
    service: 'pulse-montreal',
    version: process.env.npm_package_version || '1.0.0',
  },
};

// Configuration du transport uniquement en développement
// Désactivé par défaut pour éviter les erreurs "worker has exited"
// Utilisation d'une fonction pour éviter la résolution au build
if (isDevelopment && process.env.USE_PINO_PRETTY === 'true') {
  // Configuration du transport avec gestion d'erreur au runtime
  // Si pino-pretty n'est pas disponible, Pino utilisera les logs JSON par défaut
  try {
    loggerConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    };
  } catch {
    // Si pino-pretty n'est pas disponible, on continue sans transport
    // Les logs seront en JSON par défaut
  }
} else {
  // Configuration pour la production ou développement sans pino-pretty
  loggerConfig.formatters = {
    level: (label) => ({ level: label }),
  };
  loggerConfig.timestamp = pino.stdTimeFunctions.isoTime;
}

// Créer un logger wrapper qui gère les erreurs de worker
const baseLogger = pino(loggerConfig);

// Wrapper pour gérer les erreurs de worker
const safeLogger = {
  info: (...args: any[]) => {
    try {
      baseLogger.info(...args);
    } catch (error: any) {
      if (error?.message?.includes('worker has exited')) {
        // Ignorer silencieusement les erreurs de worker
        console.log(...args);
      } else {
        console.log('[Logger Error]', ...args);
      }
    }
  },
  error: (...args: any[]) => {
    try {
      baseLogger.error(...args);
    } catch (error: any) {
      if (error?.message?.includes('worker has exited')) {
        // Ignorer silencieusement les erreurs de worker
        console.error(...args);
      } else {
        console.error('[Logger Error]', ...args);
      }
    }
  },
  warn: (...args: any[]) => {
    try {
      baseLogger.warn(...args);
    } catch (error: any) {
      if (error?.message?.includes('worker has exited')) {
        console.warn(...args);
      } else {
        console.warn('[Logger Error]', ...args);
      }
    }
  },
  debug: (...args: any[]) => {
    try {
      baseLogger.debug(...args);
    } catch (error: any) {
      if (error?.message?.includes('worker has exited')) {
        console.debug(...args);
      } else {
        console.debug('[Logger Error]', ...args);
      }
    }
  },
};

export const logger = safeLogger as typeof baseLogger;
