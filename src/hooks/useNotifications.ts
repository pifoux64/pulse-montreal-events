'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface NotificationsResponse {
  data: Array<{
    id: string;
    title: string;
    body: string;
    readAt?: string | null;
    createdAt: string;
    data?: Record<string, unknown>;
    event?: {
      id: string;
      title: string;
    } | null;
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    unreadCount: number;
    hasMore: boolean;
  };
}

async function fetchNotifications(page: number, pageSize: number): Promise<NotificationsResponse> {
  const response = await fetch(`/api/notifications?page=${page}&pageSize=${pageSize}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401) {
    return {
      data: [],
      meta: {
        page,
        pageSize,
        total: 0,
        unreadCount: 0,
        hasMore: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error('Impossible de charger les notifications.');
  }

  return response.json();
}

async function markNotificationsRead(payload: { ids?: string[]; markAll?: boolean }) {
  const response = await fetch('/api/notifications/mark-as-read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Impossible de marquer les notifications comme lues.');
  }

  return response.json();
}

export function useNotifications(page = 1, pageSize = 20) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return useQuery({
    queryKey: ['notifications', page, pageSize],
    queryFn: () => fetchNotifications(page, pageSize),
    enabled: isAuthenticated, // Ne pas interroger l'API si l'utilisateur n'est pas connecté
    refetchInterval: isAuthenticated ? 60 * 1000 : false,
  });
}

export function useMarkNotificationsRead(page = 1, pageSize = 20) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', page, pageSize] });
    },
  });
}

