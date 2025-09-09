/**
 * Route API NextAuth pour Pulse
 * Gère l'authentification via magic link et Google OAuth
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
