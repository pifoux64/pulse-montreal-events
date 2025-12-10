'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    auth?: string;
    p256dh?: string;
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Vérifie si les notifications push sont supportées
 */
export function usePushNotificationSupport() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return { isSupported, permission };
}

/**
 * Vérifie si l'utilisateur est déjà abonné aux notifications push
 */
async function checkSubscriptionStatus(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de la souscription:', error);
    return false;
  }
}

/**
 * S'abonne aux notifications push
 */
async function subscribeToPush(): Promise<{ subscribed: boolean; message?: string }> {
  if (typeof window === 'undefined') {
    throw new Error('Fonction disponible uniquement côté client.');
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Les notifications push ne sont pas supportées par ce navigateur.');
  }

  // Vérifier la permission
  if ('Notification' in window) {
    if (Notification.permission === 'denied') {
      throw new Error('Les notifications ont été bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission de notification refusée.');
      }
    }
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey) {
    throw new Error('Configuration VAPID manquante. Veuillez contacter le support.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  // Si déjà abonné, mettre à jour la souscription
  if (subscription) {
    const payload = subscription.toJSON() as PushSubscriptionJSON;

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: payload.endpoint,
        keys: {
          auth: payload.keys?.auth,
          p256dh: payload.keys?.p256dh,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Impossible de mettre à jour la souscription push.');
    }

    return { subscribed: true, message: 'Souscription mise à jour avec succès.' };
  }

  // Nouvelle souscription
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Permission de notification refusée.');
    }
    throw new Error('Impossible de créer la souscription push.');
  }

  const payload = subscription.toJSON() as PushSubscriptionJSON;

  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      endpoint: payload.endpoint,
      keys: {
        auth: payload.keys?.auth,
        p256dh: payload.keys?.p256dh,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Impossible d'enregistrer la souscription push.");
  }

  return { subscribed: true, message: 'Notifications push activées avec succès !' };
}

/**
 * Hook pour vérifier l'état de la souscription
 */
export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ['push-subscription-status'],
    queryFn: checkSubscriptionStatus,
    enabled: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook pour s'abonner aux notifications push
 */
export function useNotificationSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: subscribeToPush,
    onSuccess: () => {
      // Invalider le statut de souscription après succès
      queryClient.invalidateQueries({ queryKey: ['push-subscription-status'] });
    },
  });
}

