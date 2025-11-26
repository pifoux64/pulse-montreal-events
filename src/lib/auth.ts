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

const enforceOrganizerVerification =
  process.env.ENFORCE_ORGANIZER_VERIFICATION === 'true';

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
      try {
        // Récupérer les infos utilisateur depuis la DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
          },
        });

        session.user.id = dbUser?.id ?? user.id;
        session.user.role = dbUser?.role ?? user.role;

        // Récupérer le profil organisateur si la table existe
        try {
          const organizer = await prisma.organizer.findUnique({
            where: { userId: session.user.id },
            select: {
              id: true,
              displayName: true,
              verified: true,
            },
          });
          session.user.organizer = organizer ?? null;
        } catch (organizerError: any) {
          if (
            organizerError?.code !== 'P2021' &&
            !organizerError?.message?.includes('does not exist')
          ) {
            console.warn(
              'Erreur lors de la récupération du profil organisateur:',
              organizerError
            );
          }
          session.user.organizer = null;
        }
      } catch (error) {
        // Si les tables n'existent pas encore, on continue avec les infos de base
        console.warn('Erreur lors de la récupération des infos utilisateur:', error);
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.organizer = null;
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
      try {
        // Créer les préférences par défaut pour le nouvel utilisateur
        await prisma.userPreferences.create({
          data: {
            userId: user.id,
            language: 'fr',
            timezone: 'America/Montreal',
            defaultRadius: 10,
          },
        });
      } catch (error) {
        // Si la table n'existe pas encore, on ignore l'erreur
        console.warn('Impossible de créer les préférences utilisateur (table peut-être absente):', error);
      }
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
  if (!enforceOrganizerVerification) {
    return;
  }

  if (!organizer?.verified) {
    throw new Error('Organisateur non vérifié');
  }
};
