'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  return useQuery({
    queryKey: ['notifications', page, pageSize],
    queryFn: () => fetchNotifications(page, pageSize),
    refetchInterval: 60 * 1000,
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

