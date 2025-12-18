'use client';

/**
 * Skeleton loader amélioré pour EventCard
 * Performance: Animation fluide et réaliste
 */

export default function EventCardSkeleton() {
  return (
    <div className="glass-effect rounded-3xl overflow-hidden border border-white/20 backdrop-blur-xl animate-pulse">
      {/* Image skeleton avec shimmer effect */}
      <div className="relative h-48 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]">
        <div className="absolute top-4 left-4 w-20 h-6 bg-white/40 rounded-2xl backdrop-blur-sm" />
        <div className="absolute top-4 right-4 w-12 h-12 bg-white/40 rounded-2xl backdrop-blur-sm" />
        <div className="absolute bottom-4 right-4 w-16 h-6 bg-white/40 rounded-2xl backdrop-blur-sm" />
      </div>

      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        {/* Genre badge */}
        <div className="w-24 h-6 bg-slate-300 rounded-full" />

        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-slate-300 rounded w-3/4" />
          <div className="h-5 bg-slate-300 rounded w-1/2" />
        </div>

        {/* Info items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-300 rounded" />
            <div className="h-4 bg-slate-300 rounded w-32" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-300 rounded" />
            <div className="h-4 bg-slate-300 rounded w-40" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-300 rounded" />
            <div className="h-4 bg-slate-300 rounded w-28" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-slate-300 rounded-full w-16" />
          <div className="h-6 bg-slate-300 rounded-full w-20" />
          <div className="h-6 bg-slate-300 rounded-full w-14" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-slate-300 rounded w-16" />
            <div className="h-4 bg-slate-300 rounded w-20" />
          </div>
          <div className="h-8 bg-slate-300 rounded-full w-20" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
