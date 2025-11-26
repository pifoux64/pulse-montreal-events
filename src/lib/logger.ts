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
// Utilisation d'une fonction pour éviter la résolution au build
if (isDevelopment) {
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
  // Configuration pour la production
  loggerConfig.formatters = {
    level: (label) => ({ level: label }),
  };
  loggerConfig.timestamp = pino.stdTimeFunctions.isoTime;
}

export const logger = pino(loggerConfig);
