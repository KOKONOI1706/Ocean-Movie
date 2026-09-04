import React from 'react';

interface MovieRailSkeletonProps {
  count?: number;
  aspectRatio?: 'landscape' | 'poster';
}

export const MovieRailSkeleton: React.FC<MovieRailSkeletonProps> = ({
  count = 5,
  aspectRatio = 'landscape',
}) => {
  return (
    <section className="py-8 sm:py-10 select-none" aria-label="Đang tải..." aria-busy="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header skeleton */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[2px] h-8 skeleton-card opacity-60 rounded-full" />
          <div className="space-y-1.5">
            <div className="skeleton-card h-3 w-28 rounded" />
            <div className="skeleton-card h-2.5 w-44 rounded opacity-60" />
          </div>
        </div>

        {/* Card skeletons */}
        <div className="flex gap-3.5 overflow-hidden pb-3">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className={`shrink-0 rounded-lg overflow-hidden bg-[#050E1C]/95 border border-cyan-900/15 ${
                aspectRatio === 'landscape' ? 'w-[240px] sm:w-[280px]' : 'w-[160px] sm:w-[200px]'
              }`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Image area */}
              <div
                className={`skeleton-card w-full ${
                  aspectRatio === 'landscape' ? 'aspect-[16/10]' : 'aspect-[2/3]'
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              />
              {/* Metadata area */}
              <div className="px-3 py-2.5 space-y-1.5">
                <div className="skeleton-card h-3 w-4/5 rounded" style={{ animationDelay: `${i * 0.08 + 0.1}s` }} />
                <div className="skeleton-card h-2.5 w-1/2 rounded opacity-70" style={{ animationDelay: `${i * 0.08 + 0.15}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
