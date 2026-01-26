'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

interface VenueImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

export function VenueImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  className = '',
  priority = false,
  unoptimized = false,
}: VenueImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
  }, [src]);

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 ${className}`}>
        <Building2 className="w-16 h-16 text-white/50" />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        unoptimized={unoptimized}
        onError={() => {
          console.error('[VenueImage] Erreur de chargement:', imageSrc);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('[VenueImage] Image chargée avec succès:', imageSrc);
        }}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized={unoptimized}
      onError={() => {
        console.error('[VenueImage] Erreur de chargement:', imageSrc);
        setImageError(true);
      }}
      onLoad={() => {
        console.log('[VenueImage] Image chargée avec succès:', imageSrc);
      }}
    />
  );
}
