'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2, Wifi } from 'lucide-react';

import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import { useNotificationSubscription, useSubscriptionStatus, usePushNotificationSupport } from '@/hooks/useNotificationSubscription';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useNotifications();
  const markAsRead = useMarkNotificationsRead();
  const subscribePush = useNotificationSubscription();
  const { data: isSubscribed, isLoading: checkingStatus } = useSubscriptionStatus();
  const { isSupported, permission } = usePushNotificationSupport();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const unreadCount = data?.meta.unreadCount ?? 0;
  const notifications = data?.data ?? [];

  const handleMarkAll = () => {
    if (notifications.length === 0) {
      return;
    }
    markAsRead.mutate({ markAll: true });
  };

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="p-3 rounded-2xl text-slate-200 hover:text-sky-300 transition-all duration-300 relative group border border-white/10 bg-white/5 backdrop-blur-md"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/15 to-emerald-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} non lues` : 'À jour'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markAsRead.isPending || unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:text-white hover:border-white/30 transition disabled:opacity-50"
            >
              {markAsRead.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Tout lire
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-slate-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Chargement…
              </div>
            )}

            {isError && (
              <div className="py-6 text-center text-sm text-red-400">
                Impossible de récupérer vos notifications.
              </div>
            )}

            {!isLoading && !isError && notifications.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400">
                Aucune notification pour le moment.
              </div>
            )}

            {notifications.map((notification) => (
              <div key={notification.id} className="px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-white">{notification.title}</p>
                <p className="text-xs text-slate-300">{notification.body}</p>
                <p className="text-[11px] text-slate-500">
                  {new Date(notification.createdAt).toLocaleString('fr-CA', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
                  })}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/10">
            {!isSupported ? (
              <p className="text-[11px] text-slate-400 text-center">
                Les notifications push ne sont pas supportées par ce navigateur.
              </p>
            ) : permission === 'denied' ? (
              <p className="text-[11px] text-amber-400 text-center">
                Les notifications ont été bloquées. Autorisez-les dans les paramètres de votre navigateur.
              </p>
            ) : checkingStatus ? (
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Vérification...
              </div>
            ) : isSubscribed ? (
              <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-300">
                <Wifi className="h-3 w-3" />
                Notifications push activées
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => subscribePush.mutate()}
                  disabled={subscribePush.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-emerald-400 hover:text-emerald-200 transition disabled:opacity-50"
                >
                  {subscribePush.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wifi className="h-4 w-4" />
                  )}
                  Activer les notifications push
                </button>
                {subscribePush.isError && (
                  <p className="mt-2 text-[11px] text-red-400">
                    {(subscribePush.error as Error)?.message ?? "Erreur lors de l'activation."}
                  </p>
                )}
                {subscribePush.isSuccess && (
                  <p className="mt-2 text-[11px] text-emerald-300">
                    {subscribePush.data?.message || 'Notifications push activées.'}
                  </p>
                )}
              </>
            )}
            <Link
              href="/notifications"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-emerald-400 hover:text-emerald-200 transition"
              onClick={() => setOpen(false)}
            >
              Ouvrir le centre
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

