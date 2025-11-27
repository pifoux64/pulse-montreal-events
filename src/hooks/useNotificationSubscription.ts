'use client';

import { useMutation } from '@tanstack/react-query';

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

async function subscribeToPush(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Les notifications push ne sont pas supportées par ce navigateur.');
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey) {
    throw new Error('Clé publique VAPID manquante.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
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
    throw new Error('Impossible d’enregistrer la souscription push.');
  }
}

export function useNotificationSubscription() {
  return useMutation({
    mutationFn: subscribeToPush,
  });
}

