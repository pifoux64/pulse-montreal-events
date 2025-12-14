/**
 * Client Prisma configuré pour Pulse
 * Singleton pattern pour éviter les multiples connexions
 * Configuration optimisée pour les environnements serverless (Vercel)
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pour les environnements serverless, désactiver les prepared statements
// pour éviter l'erreur "prepared statement already exists"
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Ajouter ?prepare=false à la DATABASE_URL si ce n'est pas déjà présent
// Cela désactive les prepared statements qui causent des problèmes en serverless
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;
  
  // Si on est en serverless et que prepare=false n'est pas déjà dans l'URL
  if (isServerless && !url.includes('prepare=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}prepare=false`;
  }
  
  return url;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
