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

// Modifier la DATABASE_URL pour le mode serverless
// Pour le pooler Supabase, utiliser pgbouncer=true au lieu de prepare=false
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;
  
  // Si on est en serverless
  if (isServerless) {
    // Si l'URL utilise le pooler Supabase (pooler.supabase.com), ajouter pgbouncer=true
    if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}pgbouncer=true`;
    }
    
    // Si l'URL utilise le port 6543 (Transaction mode), ajouter pgbouncer=true
    if (url.includes(':6543') && !url.includes('pgbouncer=') && !url.includes('prepare=')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}pgbouncer=true`;
    }
    
    // Pour les autres cas (URL directe), essayer prepare=false
    if (!url.includes('prepare=') && !url.includes('pgbouncer=')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}prepare=false`;
    }
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
