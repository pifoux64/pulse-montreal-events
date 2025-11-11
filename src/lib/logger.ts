/**
 * Configuration du logger Pino pour Pulse Montreal
 * Logger structuré pour le développement et la production
 */

import pino from 'pino';
import { createRequire } from 'module';

const isDevelopment = process.env.NODE_ENV === 'development';
const require = createRequire(import.meta.url);

let devTransport: pino.TransportSingleOptions | undefined;

if (isDevelopment) {
  try {
    require.resolve('pino-pretty');
    devTransport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    };
  } catch (error) {
    console.warn('pino-pretty non disponible, utilisation des logs JSON par défaut.');
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: devTransport,
  ...(!isDevelopment && {
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
  base: {
    env: process.env.NODE_ENV,
    service: 'pulse-montreal',
    version: process.env.npm_package_version || '1.0.0',
  },
});
