/**
 * Extensions des types NextAuth pour Pulse
 * Ajoute les propriétés role et organizer à l'utilisateur
 */

import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      organizer?: {
        id: string;
        displayName: string;
        verified: boolean;
      } | null;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    organizer?: {
      id: string;
      displayName: string;
      verified: boolean;
    } | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
  }
}
