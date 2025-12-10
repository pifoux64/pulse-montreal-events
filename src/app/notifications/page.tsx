'use client';

import { useMemo } from 'react';
import { Bell, CheckCheck, Loader2, Wifi } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import { useNotificationSubscription, useSubscriptionStatus, usePushNotificationSupport } from '@/hooks/useNotificationSubscription';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const page = 1;
  const { data, isLoading, isError } = useNotifications(page, PAGE_SIZE);
  const markNotifications = useMarkNotificationsRead(page, PAGE_SIZE);
  const subscribePush = useNotificationSubscription();
  const { data: isSubscribed, isLoading: checkingStatus } = useSubscriptionStatus();
  const { isSupported, permission } = usePushNotificationSupport();

  const notifications = data?.data ?? [];
  const unreadCount = data?.meta.unreadCount ?? 0;

  const hasNotifications = notifications.length > 0;

  const handleMarkAll = () => {
    if (unreadCount === 0) {
      return;
    }
    markNotifications.mutate({ markAll: true });
  };

  const handleMarkOne = (notificationId: string) => {
    markNotifications.mutate({ ids: [notificationId] });
  };

  const formattedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        formattedDate: formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
          locale: fr,
        }),
      })),
    [notifications]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <header className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Centre de notifications</p>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2 mt-1">
              <Bell className="h-7 w-7 text-emerald-500" />
              Notifications
            </h1>
            <p className="text-slate-500 mt-2">
              Retrouvez toutes les mises à jour liées à vos événements favoris.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markNotifications.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markNotifications.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Tout marquer comme lu
            </button>
            {!isSupported ? (
              <p className="text-xs text-slate-500 max-w-sm text-right">
                Les notifications push ne sont pas supportées par ce navigateur.
              </p>
            ) : permission === 'denied' ? (
              <p className="text-xs text-amber-600 max-w-sm text-right">
                Les notifications ont été bloquées. Autorisez-les dans les paramètres de votre navigateur.
              </p>
            ) : checkingStatus ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Vérification...
              </div>
            ) : isSubscribed ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <Wifi className="h-4 w-4" />
                Notifications push activées
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => subscribePush.mutate()}
                  disabled={subscribePush.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscribePush.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wifi className="h-4 w-4" />
                  )}
                  Activer les notifications push
                </button>
                {subscribePush.isError && (
                  <p className="text-xs text-red-500 max-w-sm text-right">
                    {(subscribePush.error as Error)?.message ?? "Impossible d'activer les notifications push."}
                  </p>
                )}
                {subscribePush.isSuccess && (
                  <p className="text-xs text-emerald-600">
                    {subscribePush.data?.message || 'Notifications push activées pour ce navigateur.'}
                  </p>
                )}
              </>
            )}
          </div>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Chargement des notifications…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl bg-white shadow p-8 text-center text-slate-500">
            <p>Impossible de charger vos notifications pour le moment.</p>
          </div>
        )}

        {!isLoading && !isError && !hasNotifications && (
          <div className="rounded-2xl bg-white shadow p-10 text-center">
            <Bell className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-900">Aucune notification</h2>
            <p className="text-slate-500 mt-2">
              Suivez des événements ou ajoutez des favoris pour recevoir des mises à jour.
            </p>
          </div>
        )}

        {!isLoading && !isError && hasNotifications && (
          <div className="space-y-4">
            {formattedNotifications.map((notification) => {
              const isRead = Boolean(notification.readAt);
              return (
                <article
                  key={notification.id}
                  className={`rounded-2xl border bg-white shadow-sm p-5 transition ${
                    isRead ? 'border-slate-100' : 'border-emerald-200 bg-emerald-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase font-semibold tracking-wide text-slate-400">
                        {notification.type.replace(/_/g, ' ')}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900 mt-1">{notification.title}</h3>
                      <p className="text-slate-600 mt-2 whitespace-pre-line">{notification.body}</p>
                      <p className="text-xs text-slate-400 mt-2">{notification.formattedDate}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkOne(notification.id)}
                          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          <CheckCheck className="h-4 w-4" />
                          Marquer comme lu
                        </button>
                      )}
                      {notification.event?.id && (
                        <a
                          href={`/evenement/${notification.event.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Voir l’événement
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

            {data?.meta.hasMore && (
              <p className="text-center text-sm text-slate-500">
                D’autres notifications seront ajoutées prochainement (pagination à venir).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}












