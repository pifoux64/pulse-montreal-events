'use client';

export default function EventCardSkeleton() {
  return (
    <div className="glass-effect rounded-3xl overflow-hidden border border-white/20 backdrop-blur-xl animate-pulse">
      {/* Image skeleton */}
      <div className="relative h-48 bg-gradient-to-br from-gray-300 to-gray-400">
        <div className="absolute top-4 left-4 w-20 h-6 bg-white/30 rounded-2xl" />
        <div className="absolute top-4 right-4 w-12 h-12 bg-white/30 rounded-2xl" />
      </div>

      {/* Content skeleton */}
      <div className="p-5">
        {/* Genre badge */}
        <div className="mb-2 w-24 h-6 bg-gray-300 rounded-full" />

        {/* Title */}
        <div className="mb-4 space-y-2">
          <div className="h-5 bg-gray-300 rounded w-3/4" />
          <div className="h-5 bg-gray-300 rounded w-1/2" />
        </div>

        {/* Info items */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded" />
            <div className="h-4 bg-gray-300 rounded w-32" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded" />
            <div className="h-4 bg-gray-300 rounded w-40" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 bg-gray-300 rounded-full w-16" />
          <div className="h-6 bg-gray-300 rounded-full w-20" />
          <div className="h-6 bg-gray-300 rounded-full w-14" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-300 rounded w-16" />
            <div className="h-4 bg-gray-300 rounded w-20" />
          </div>
          <div className="h-8 bg-gray-300 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

