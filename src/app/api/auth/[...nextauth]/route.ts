/**
 * Route API NextAuth pour Pulse
 * Gère l'authentification via magic link et Google OAuth
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// Exporter directement les handlers NextAuth
// NextAuth gère automatiquement les erreurs et les redirections appropriées
export { handler as GET, handler as POST };
