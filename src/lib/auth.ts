/**
 * Configuration NextAuth pour Pulse
 * Support des magic links et Google OAuth avec système de rôles
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { createTransport } from 'nodemailer';
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
  const emailFrom = process.env.EMAIL_FROM || 'noreply@pulse-montreal.com';
  const isSandboxDomain = emailFrom.includes('@resend.dev');
  
  if (isSandboxDomain) {
    console.warn('⚠️ Utilisation du Sandbox Domain de Resend.');
    console.warn('   Les emails ne peuvent être envoyés qu\'aux adresses dans la whitelist.');
    console.warn('   Pour la production, configure un domaine vérifié.');
  }
  
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
      from: emailFrom,
      // Améliorer le logging des erreurs d'envoi
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        try {
          // Utiliser le transport SMTP par défaut de NextAuth
          const { host, port, auth } = provider.server;
          const transport = createTransport({
            host,
            port,
            auth,
            secure: false, // STARTTLS
            // Options de timeout pour éviter "Greeting never received"
            connectionTimeout: 10000, // 10 secondes pour établir la connexion
            greetingTimeout: 10000, // 10 secondes pour recevoir le greeting
            socketTimeout: 10000, // 10 secondes pour les opérations socket
            // Options de retry
            pool: false, // Désactiver le pool pour éviter les connexions persistantes qui timeout
            // Options de debug (désactivé en production)
            debug: process.env.NODE_ENV === 'development',
            logger: process.env.NODE_ENV === 'development',
          });

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca';
          const textVersion = `Bonjour,

Vous avez demandé à vous connecter à votre compte Pulse Montréal.

Cliquez sur ce lien pour vous connecter :
${url}

Ce lien expire dans 24 heures.

Si vous n'avez pas demandé cette connexion, ignorez cet email.

---
Pulse Montréal - Votre guide des événements à Montréal
${appUrl}

Si cet email est dans vos indésirables, merci de le marquer comme "Non spam" pour garantir la réception de nos futurs emails.`;

          const htmlVersion = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #10b981; font-size: 24px; margin-bottom: 16px;">Connexion à Pulse Montréal</h1>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                Bonjour,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                Vous avez demandé à vous connecter à votre compte Pulse Montréal.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Cliquez sur le bouton ci-dessous pour vous connecter :
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Se connecter
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
                Ou copiez ce lien dans votre navigateur :
              </p>
              <p style="color: #6b7280; font-size: 12px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
                ${url}
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                Ce lien expire dans 24 heures.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
                Si vous n'avez pas demandé cette connexion, ignorez cet email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin-bottom: 8px;">
                <strong>Pulse Montréal</strong> - Votre guide des événements à Montréal<br>
                <a href="${appUrl}" style="color: #10b981; text-decoration: none;">${appUrl}</a>
              </p>
              
              <p style="color: #9ca3af; font-size: 11px; line-height: 1.6; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                💡 <strong>Astuce</strong> : Si cet email est dans vos indésirables, merci de le marquer comme "Non spam" pour garantir la réception de nos futurs emails.
              </p>
            </div>
          `;

          const result = await transport.sendMail({
            to: email,
            from: provider.from,
            subject: 'Connexion à Pulse Montréal',
            text: textVersion,
            html: htmlVersion,
          });

          console.log(`✅ Email de connexion envoyé à ${email}`, {
            messageId: result.messageId,
            response: result.response,
          });
        } catch (error: any) {
          console.error(`❌ Erreur lors de l'envoi de l'email à ${email}:`, {
            error: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
          });
          
          // Si c'est une erreur de whitelist/sandbox, donner un message plus clair
          if (
            error.response?.includes('not allowed') ||
            error.response?.includes('sandbox') ||
            error.response?.includes('recipient')
          ) {
            console.error('💡 Cette adresse n\'est probablement pas dans la whitelist du Sandbox Domain.');
            console.error('   Ajoute-la dans Resend > Domains > Sandbox Domain > Allowed Recipients');
          }
          
          throw error;
        }
      },
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
