/**
 * Helpers pour vérification des rôles utilisateur (système multi-rôles)
 */

import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

/**
 * Récupère tous les rôles d'un utilisateur (depuis UserRoleAssignment)
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const roleAssignments = await prisma.userRoleAssignment.findMany({
    where: { userId },
    select: { role: true },
  });
  
  // Inclure aussi le rôle legacy pour compatibilité
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  const roles = new Set<UserRole>(roleAssignments.map(ra => ra.role));
  if (user?.role) {
    roles.add(user.role);
  }
  
  // Toujours inclure USER par défaut
  roles.add('USER');
  
  return Array.from(roles);
}

/**
 * Vérifie si un utilisateur a un rôle spécifique
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

/**
 * Vérifie si un utilisateur a au moins un des rôles spécifiés
 */
export async function hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
  const userRoles = await getUserRoles(userId);
  return roles.some(role => userRoles.includes(role));
}

/**
 * Vérifie si un utilisateur a tous les rôles spécifiés
 */
export async function hasAllRoles(userId: string, roles: UserRole[]): Promise<boolean> {
  const userRoles = await getUserRoles(userId);
  return roles.every(role => userRoles.includes(role));
}

/**
 * Récupère les rôles depuis la session (côté serveur)
 */
export async function getSessionRoles(): Promise<UserRole[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return ['USER'];
  }
  return getUserRoles(session.user.id);
}

/**
 * Vérifie si l'utilisateur de la session a un rôle spécifique
 */
export async function sessionHasRole(role: UserRole): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return role === 'USER';
  }
  return hasRole(session.user.id, role);
}

/**
 * Vérifie si l'utilisateur a un claim VENUE vérifié pour une venue spécifique
 */
export async function hasVerifiedVenueClaim(userId: string, venueId: string): Promise<boolean> {
  const claim = await prisma.venueClaim.findFirst({
    where: {
      userId,
      venueId,
      status: 'VERIFIED',
    },
  });
  return !!claim;
}

/**
 * Récupère toutes les venues vérifiées pour un utilisateur
 */
export async function getVerifiedVenues(userId: string) {
  const claims = await prisma.venueClaim.findMany({
    where: {
      userId,
      status: 'VERIFIED',
    },
    include: {
      venue: true,
    },
  });
  return claims.map(c => c.venue);
}

/**
 * Helper pour activation progressive du rôle ORGANIZER
 * À utiliser avant d'accéder à une action nécessitant le rôle ORGANIZER
 */
export async function requireOrganizerRole(
  userId: string,
  actionRedirectUrl?: string
): Promise<{ hasRole: boolean; needsActivation: boolean }> {
  const hasOrganizerRole = await hasRole(userId, 'ORGANIZER');
  
  if (hasOrganizerRole) {
    return { hasRole: true, needsActivation: false };
  }
  
  return { hasRole: false, needsActivation: true };
}
