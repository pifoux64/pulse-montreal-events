import webpush from 'web-push';

/**
 * Gestion centralisée de l'envoi push via web-push (VAPID).
 * Assure-toi de définir les env:
 *  - NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *  - VAPID_PRIVATE_KEY
 *  - VAPID_SUBJECT (mailto:… ou URL)
 */

export interface WebPushSubscription {
  endpoint: string;
  keys?: {
    auth?: string | null;
    p256dh?: string | null;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_APP_URL || 'mailto:support@pulse.local';

const pushReady = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);

if (pushReady) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
} else if (process.env.NODE_ENV !== 'production') {
  console.warn(
    '[Push] WEB-PUSH non configuré. Définis NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY et VAPID_SUBJECT pour activer l’envoi.'
  );
}

export async function sendEventPostPushNotifications({
  subscriptions,
  payload,
}: {
  subscriptions: WebPushSubscription[];
  payload: PushNotificationPayload;
}) {
  if (subscriptions.length === 0) {
    return;
  }

  if (!pushReady) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Push] Abandon de l’envoi: configuration incomplète.', {
        missing: {
          NEXT_PUBLIC_VAPID_PUBLIC_KEY: Boolean(VAPID_PUBLIC_KEY),
          VAPID_PRIVATE_KEY: Boolean(VAPID_PRIVATE_KEY),
          VAPID_SUBJECT: Boolean(VAPID_SUBJECT),
        },
      });
    }
    return;
  }

  await Promise.all(
    subscriptions.map((subscription) => {
      const { endpoint, keys } = subscription;
      if (!endpoint) {
        return Promise.resolve();
      }

      return webpush
        .sendNotification(
          {
            endpoint,
            keys: {
              auth: keys?.auth ?? undefined,
              p256dh: keys?.p256dh ?? undefined,
            },
          },
          JSON.stringify(payload)
        )
        .catch((error) => {
          console.warn('[Push] Erreur d’envoi', error);
        });
    })
  );
}

