/**
 * Configuration du logger Pino pour Pulse Montreal
 * Logger structuré pour le développement et la production
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Configuration pour le développement
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    },
  }),

  // Configuration pour la production
  ...(!isDevelopment && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),

  // Informations de base
  base: {
    env: process.env.NODE_ENV,
    service: 'pulse-montreal',
    version: process.env.npm_package_version || '1.0.0',
  },
});
