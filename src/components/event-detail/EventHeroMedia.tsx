'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Music, Play, Pause } from 'lucide-react';

interface EventHeroMediaProps {
  imageUrl?: string | null;
  title: string;
  // Pour les événements musicaux
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
  mixcloudUrl?: string | null;
  lineup?: string[] | null;
  // Détection automatique si c'est un événement musical
  isMusicEvent?: boolean;
  eventTags?: Array<{ category: string; value: string }> | null;
}

/**
 * Détecte si un événement est musical basé sur les tags
 */
function isMusicEvent(eventTags?: Array<{ category: string; value: string }> | null): boolean {
  if (!eventTags) return false;
  
  const musicGenres = ['techno', 'house', 'electronic', 'reggae', 'dub', 'hip_hop', 'rock', 'jazz', 'afrobeat', 'latin'];
  const musicTypes = ['concert', 'dj_set', 'soiree_club', 'festival'];
  
  return eventTags.some(tag => 
    (tag.category === 'genre' && musicGenres.includes(tag.value)) ||
    (tag.category === 'type' && musicTypes.includes(tag.value))
  );
}

/**
 * Extrait l'ID d'une URL Spotify
 */
function extractSpotifyId(url: string): string | null {
  const match = url.match(/spotify\.com\/(?:track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Extrait l'ID d'une URL SoundCloud
 */
function extractSoundCloudId(url: string): string | null {
  // SoundCloud URLs sont plus complexes, on peut utiliser l'embed
  const match = url.match(/soundcloud\.com\/([^/]+)\/([^/]+)/);
  return match ? `${match[1]}/${match[2]}` : null;
}

/**
 * Extrait l'ID d'une URL Mixcloud
 */
function extractMixcloudId(url: string): string | null {
  const match = url.match(/mixcloud\.com\/([^/]+)\/([^/]+)/);
  return match ? `${match[1]}/${match[2]}` : null;
}

export default function EventHeroMedia({
  imageUrl,
  title,
  spotifyUrl,
  soundcloudUrl,
  mixcloudUrl,
  lineup,
  isMusicEvent: propIsMusicEvent,
  eventTags,
}: EventHeroMediaProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const musicEvent = propIsMusicEvent ?? isMusicEvent(eventTags);
  const hasAudio = !!(spotifyUrl || soundcloudUrl || mixcloudUrl);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Image principale */}
      {imageUrl ? (
        <div className="relative w-full h-[500px] md:h-[600px]">
          <Image
            src={imageUrl.startsWith('http') || imageUrl.startsWith('/')
              ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
              : imageUrl}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-[500px] md:h-[600px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
          <Music className="w-32 h-32 text-white/50" />
        </div>
      )}

      {/* Player audio pour événements musicaux */}
      {musicEvent && hasAudio && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Music className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Écouter</h3>
            </div>
            
            <div className="space-y-3">
              {/* Spotify */}
              {spotifyUrl && (() => {
                const spotifyId = extractSpotifyId(spotifyUrl);
                if (spotifyId) {
                  return (
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <iframe
                        src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-lg"
                      />
                    </div>
                  );
                }
                return null;
              })()}

              {/* SoundCloud */}
              {soundcloudUrl && (() => {
                const scId = extractSoundCloudId(soundcloudUrl);
                if (scId) {
                  return (
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <iframe
                        width="100%"
                        height="166"
                        scrolling="no"
                        frameBorder="no"
                        allow="autoplay"
                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                        className="rounded-lg"
                      />
                    </div>
                  );
                }
                return null;
              })()}

              {/* Mixcloud */}
              {mixcloudUrl && (() => {
                const mcId = extractMixcloudId(mixcloudUrl);
                if (mcId) {
                  return (
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <iframe
                        width="100%"
                        height="120"
                        frameBorder="0"
                        src={`https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=${encodeURIComponent(mixcloudUrl)}`}
                        className="rounded-lg"
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Lineup si disponible */}
            {lineup && lineup.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/70 mb-2">Line-up:</p>
                <div className="flex flex-wrap gap-2">
                  {lineup.map((artist, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/10 text-white rounded-full text-sm"
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
