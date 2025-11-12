/**
 * Configuration NextAuth pour Pulse
 * Support des magic links et Google OAuth avec système de rôles
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

// Construire la liste des providers de manière conditionnelle
const providers = [];

// Ajouter Google OAuth si configuré
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Ajouter Email provider si configuré
if (
  process.env.EMAIL_SERVER_HOST &&
  process.env.EMAIL_SERVER_PORT &&
  process.env.EMAIL_SERVER_USER &&
  process.env.EMAIL_SERVER_PASSWORD
) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@pulse-montreal.com',
    })
  );
}

// Si aucun provider n'est configuré, afficher un avertissement
if (providers.length === 0) {
  console.warn('⚠️ Aucun provider NextAuth configuré.');
  console.warn('   Pour activer la connexion par email, configurez:');
  console.warn('   - EMAIL_SERVER_HOST');
  console.warn('   - EMAIL_SERVER_PORT');
  console.warn('   - EMAIL_SERVER_USER');
  console.warn('   - EMAIL_SERVER_PASSWORD');
  console.warn('   Pour activer Google OAuth, configurez:');
  console.warn('   - GOOGLE_CLIENT_ID');
  console.warn('   - GOOGLE_CLIENT_SECRET');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: providers.length > 0 ? providers : [],
  
  callbacks: {
    async session({ session, user }) {
      // Récupérer les infos utilisateur depuis la DB
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              verified: true,
            },
          },
        },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
        session.user.organizer = dbUser.organizer;
      }

      return session;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
  
  events: {
    createUser: async ({ user }) => {
      // Créer les préférences par défaut pour le nouvel utilisateur
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          language: 'fr',
          timezone: 'America/Montreal',
          defaultRadius: 10,
        },
      });
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  
  session: {
    strategy: 'database',
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Middleware pour vérifier les rôles utilisateur
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (userRole?: UserRole) => {
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new Error('Accès non autorisé');
    }
  };
};

/**
 * Vérifier si l'utilisateur est un organisateur vérifié
 */
export const requireVerifiedOrganizer = (organizer?: { verified: boolean }) => {
  if (!organizer?.verified) {
    throw new Error('Organisateur non vérifié');
  }
};
