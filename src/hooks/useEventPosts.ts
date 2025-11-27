'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

interface EventPostResponse {
  data: any[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

async function fetchEventPosts(eventId: string, page: number, pageSize: number): Promise<EventPostResponse> {
  const response = await fetch(`/api/events/${eventId}/posts?page=${page}&pageSize=${pageSize}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Impossible de charger le fil.');
  }

  return response.json();
}

export function useEventPosts(eventId: string, pageSize = 10) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['event-posts', eventId, pageSize],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchEventPosts(eventId, pageParam, pageSize),
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-posts', eventId, pageSize] });
  };

  return {
    ...query,
    invalidate,
  };
}

