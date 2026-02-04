'use client';

import { useState } from 'react';
import { Music, Headphones, Radio, Youtube } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ListenBeforeYouGoProps {
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
  mixcloudUrl?: string | null;
  youtubeUrl?: string | null;
  isMusicEvent?: boolean;
  eventTags?: Array<{ category: string; value: string }> | null;
  category?: string | null;
}

type Platform = 'spotify' | 'soundcloud' | 'mixcloud' | 'youtube';

interface PlatformInfo {
  key: Platform;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const platforms: Record<Platform, PlatformInfo> = {
  spotify: {
    key: 'spotify',
    name: 'Spotify',
    icon: <Music className="w-5 h-5" />,
    color: 'text-green-400',
  },
  soundcloud: {
    key: 'soundcloud',
    name: 'SoundCloud',
    icon: <Headphones className="w-5 h-5" />,
    color: 'text-orange-400',
  },
  mixcloud: {
    key: 'mixcloud',
    name: 'Mixcloud',
    icon: <Radio className="w-5 h-5" />,
    color: 'text-blue-400',
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube',
    icon: <Youtube className="w-5 h-5" />,
    color: 'text-red-400',
  },
};

/**
 * Détecte si un événement est musical basé sur les tags ou la catégorie
 */
function isMusicEvent(
  eventTags?: Array<{ category: string; value: string }> | null,
  category?: string | null
): boolean {
  // Si on a des tags, vérifier s'il y a des tags musicaux
  if (eventTags && eventTags.length > 0) {
    const musicGenres = ['techno', 'house', 'electronic', 'reggae', 'dub', 'hip_hop', 'rock', 'jazz', 'afrobeat', 'latin', 'pop', 'indie', 'folk', 'blues', 'country', 'metal', 'punk', 'rap', 'r&b', 'soul', 'funk', 'disco', 'ambient', 'drum_and_bass', 'dubstep', 'trance', 'hardcore'];
    const musicTypes = ['concert', 'dj_set', 'soiree_club', 'festival', 'live_music', 'show', 'performance'];
    
    const hasMusicTag = eventTags.some(tag => 
      (tag.category === 'genre' && musicGenres.includes(tag.value)) ||
      (tag.category === 'type' && musicTypes.includes(tag.value))
    );
    
    if (hasMusicTag) return true;
  }
  
  // Sinon, vérifier la catégorie
  if (category) {
    const musicCategories = ['MUSIC', 'music', 'Music'];
    return musicCategories.includes(category);
  }
  
  return false;
}

/**
 * Extrait l'ID d'une URL Spotify
 */
function extractSpotifyId(url: string): { type: 'track' | 'album' | 'playlist' | 'artist'; id: string } | null {
  const u = url.trim();
  const trackMatch = u.match(/(?:open\.)?spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) return { type: 'track', id: trackMatch[1] };
  const albumMatch = u.match(/(?:open\.)?spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch) return { type: 'album', id: albumMatch[1] };
  const playlistMatch = u.match(/(?:open\.)?spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
  const artistMatch = u.match(/(?:open\.)?spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (artistMatch) return { type: 'artist', id: artistMatch[1] };
  return null;
}

/**
 * Extrait l'ID d'une URL YouTube
 */
function extractYouTubeId(url: string): string | null {
  // Support multiple YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Extrait l'ID d'une URL SoundCloud
 */
function extractSoundCloudId(url: string): string | null {
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

export default function ListenBeforeYouGo({
  spotifyUrl,
  soundcloudUrl,
  mixcloudUrl,
  youtubeUrl,
  isMusicEvent: propIsMusicEvent,
  eventTags,
  category,
}: ListenBeforeYouGoProps) {
  const t = useTranslations('eventDetail');

  // Normaliser les URLs (string, trim) au cas où featureValue vient en Json
  const n = (v: string | null | undefined): string | undefined =>
    v == null ? undefined : typeof v === 'string' ? v.trim() || undefined : undefined;
  const sUrl = n(spotifyUrl);
  const scUrl = n(soundcloudUrl);
  const mUrl = n(mixcloudUrl);
  const yUrl = n(youtubeUrl);
  
  const musicEvent = propIsMusicEvent ?? isMusicEvent(eventTags, category);
  
  // Collecter toutes les plateformes disponibles
  const availablePlatforms: Platform[] = [];
  if (sUrl) availablePlatforms.push('spotify');
  if (scUrl) availablePlatforms.push('soundcloud');
  if (mUrl) availablePlatforms.push('mixcloud');
  if (yUrl) availablePlatforms.push('youtube');
  
  // État pour la plateforme sélectionnée
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    availablePlatforms.length > 0 ? availablePlatforms[0] : null
  );
  
  // Si on a des URLs, afficher le bloc même si l'événement n'est pas détecté comme musical
  // (l'utilisateur a explicitement ajouté des URLs musicales)
  const shouldShow = availablePlatforms.length > 0;
  
  // Debug en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('[ListenBeforeYouGo] Debug:', {
      shouldShow,
      availablePlatforms,
      musicEvent,
      hasSpotify: !!sUrl,
      hasSoundCloud: !!scUrl,
      hasMixcloud: !!mUrl,
      hasYouTube: !!yUrl,
      eventTags,
      category,
    });
  }

  const linkFallback = (url: string, label: string) => (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      <a
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline break-all"
      >
        {label}
      </a>
    </div>
  );
  
  if (!shouldShow) {
    return null;
  }
  
  const renderPlayer = () => {
    if (!selectedPlatform) return null;
    
    switch (selectedPlatform) {
      case 'spotify': {
        if (!sUrl) return null;
        const spotifyData = extractSpotifyId(sUrl);
        if (!spotifyData) return linkFallback(sUrl, t('listenOnSpotify'));
        
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <iframe
              src={`https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}?utm_source=generator&theme=0`}
              width="100%"
              height={spotifyData.type === 'track' ? '152' : '352'}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
          </div>
        );
      }
      
      case 'soundcloud': {
        if (!scUrl) return null;
        const scId = extractSoundCloudId(scUrl);
        if (!scId) return linkFallback(scUrl, t('listenOnSoundCloud'));
        
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
              className="rounded-lg"
            />
          </div>
        );
      }
      
      case 'mixcloud': {
        if (!mUrl) return null;
        const mcId = extractMixcloudId(mUrl);
        if (!mcId) return linkFallback(mUrl, t('listenOnMixcloud'));
        
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <iframe
              width="100%"
              height="120"
              frameBorder="0"
              src={`https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=${encodeURIComponent(mUrl)}`}
              className="rounded-lg"
            />
          </div>
        );
      }
      
      case 'youtube': {
        if (!yUrl) return null;
        const youtubeId = extractYouTubeId(yUrl);
        if (!youtubeId) return linkFallback(yUrl, t('watchOnYouTube'));
        
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );
      }
      
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Music className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white">{t('listenBeforeYouGo')}</h3>
      </div>
      
      {/* Switch entre plateformes si plusieurs disponibles */}
      {availablePlatforms.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {availablePlatforms.map((platform) => {
            const platformInfo = platforms[platform];
            const isSelected = selectedPlatform === platform;
            
            const getSelectedClasses = (platform: Platform) => {
              switch (platform) {
                case 'spotify':
                  return 'bg-green-500/20 border border-green-500/50 text-green-400';
                case 'soundcloud':
                  return 'bg-orange-500/20 border border-orange-500/50 text-orange-400';
                case 'mixcloud':
                  return 'bg-blue-500/20 border border-blue-500/50 text-blue-400';
                case 'youtube':
                  return 'bg-red-500/20 border border-red-500/50 text-red-400';
                default:
                  return 'bg-white/10 text-white border border-white/20';
              }
            };
            
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isSelected
                    ? getSelectedClasses(platform)
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                {platformInfo.icon}
                <span>{platformInfo.name}</span>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Player */}
      <div className="mt-4">
        {renderPlayer()}
      </div>
    </div>
  );
}
