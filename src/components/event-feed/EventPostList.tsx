'use client';

import Image from 'next/image';
import { Loader2, PlayCircle } from 'lucide-react';

import { useEventPosts } from '@/hooks/useEventPosts';

interface EventPostListProps {
  eventId: string;
}

export default function EventPostList({ eventId }: EventPostListProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventPosts(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Chargement du fil…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        Impossible de charger le fil pour le moment.
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  if (posts.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        Aucun post pour le moment. Soyez le premier à partager une mise à jour !
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {posts.map((post) => (
        <article key={post.id} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            {post.author?.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name ?? 'Organisateur'}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold">
                {post.author?.name?.slice(0, 1) ?? 'O'}
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900">{post.author?.name ?? 'Organisateur'}</p>
              <p className="text-sm text-slate-500">
                {new Date(post.createdAt).toLocaleString('fr-CA', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
          <p className="text-slate-800 whitespace-pre-line">{post.content}</p>
          {post.medias?.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {post.medias.map((media: any) => {
                if (media.kind === 'VIDEO') {
                  return (
                    <div key={media.id} className="relative rounded-2xl overflow-hidden bg-slate-900">
                      <video
                        controls
                        className="w-full h-full"
                        src={media.url}
                        poster="/Pulse_Logo_only_heart.png"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <PlayCircle className="h-12 w-12 text-white/70 drop-shadow-lg" />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={media.id} className="relative rounded-2xl overflow-hidden border border-slate-100">
                    <Image
                      src={media.url}
                      alt="Média du post"
                      width={800}
                      height={600}
                      className="object-cover w-full h-full"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </article>
      ))}
      {hasNextPage && (
        <div className="p-6 text-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition disabled:opacity-60"
          >
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}

