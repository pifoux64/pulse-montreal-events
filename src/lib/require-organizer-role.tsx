/**
 * Helper pour activation progressive du rôle ORGANIZER
 * À utiliser dans les composants client avant d'accéder à une action nécessitant ORGANIZER
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import OrganizerEnableModal from '@/components/OrganizerEnableModal';

interface UseRequireOrganizerOptions {
  actionRedirectUrl?: string;
  actionName?: string;
  onSuccess?: () => void;
}

/**
 * Hook pour vérifier et activer le rôle ORGANIZER si nécessaire
 * Retourne: { hasRole, showModal, handleAction }
 */
export function useRequireOrganizer(options: UseRequireOrganizerOptions = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const userRoles = session?.user?.roles || (session?.user?.role ? [session.user.role] : ['USER']);
  const hasOrganizerRole = userRoles.includes('ORGANIZER');

  const handleAction = (action: () => void) => {
    if (hasOrganizerRole) {
      // L'utilisateur a déjà le rôle, exécuter l'action directement
      action();
    } else {
      // L'utilisateur n'a pas le rôle, montrer la modal
      setPendingAction(() => action);
      setShowModal(true);
    }
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    if (options.actionRedirectUrl) {
      router.push(options.actionRedirectUrl);
    }
    options.onSuccess?.();
  };

  const Modal = showModal ? (
    <OrganizerEnableModal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        setPendingAction(null);
      }}
      onSuccess={handleModalSuccess}
      actionRedirectUrl={options.actionRedirectUrl}
      actionName={options.actionName}
    />
  ) : null;

  return {
    hasRole: hasOrganizerRole,
    showModal,
    handleAction,
    Modal,
  };
}

/**
 * Composant wrapper pour protéger une action nécessitant le rôle ORGANIZER
 */
export function RequireOrganizer({
  children,
  actionRedirectUrl,
  actionName,
  fallback,
}: {
  children: (props: { handleAction: (action: () => void) => void }) => React.ReactNode;
  actionRedirectUrl?: string;
  actionName?: string;
  fallback?: React.ReactNode;
}) {
  const { hasRole, handleAction, Modal } = useRequireOrganizer({
    actionRedirectUrl,
    actionName,
  });

  return (
    <>
      {children({ handleAction })}
      {Modal}
    </>
  );
}
