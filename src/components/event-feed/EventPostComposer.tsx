'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { MediaKind } from '@prisma/client';

interface EventPostComposerProps {
  eventId: string;
}

const mediaOptions = [
  { label: 'Image', value: MediaKind.IMAGE, icon: ImageIcon },
  { label: 'Vidéo', value: MediaKind.VIDEO, icon: Video },
];

export default function EventPostComposer({ eventId }: EventPostComposerProps) {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaKind, setMediaKind] = useState<MediaKind>(MediaKind.IMAGE);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: {
        content: string;
        media?: Array<{ url: string; kind: MediaKind }>;
      } = {
        content,
      };

      if (mediaUrl.trim()) {
        payload.media = [
          {
            url: mediaUrl.trim(),
            kind: mediaKind,
          },
        ];
      }

      const response = await fetch(`/api/events/${eventId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Impossible de publier le post.');
      }

      return response.json();
    },
    onSuccess: () => {
      setContent('');
      setMediaUrl('');
      queryClient.invalidateQueries({ queryKey: ['event-posts', eventId] });
    },
  });

  const canSubmit = content.trim().length > 0 && !mutation.isPending;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Publier un post</h3>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Partagez une mise à jour, une photo, une vidéo..."
        className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="url"
          value={mediaUrl}
          onChange={(event) => setMediaUrl(event.target.value)}
          placeholder="URL du média (optionnel)"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <div className="flex gap-2">
          {mediaOptions.map((option) => {
            const Icon = option.icon;
            const active = mediaKind === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMediaKind(option.value)}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-emerald-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publier
        </button>
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-600">Erreur lors de la publication. Veuillez réessayer.</p>
      )}
    </div>
  );
}

