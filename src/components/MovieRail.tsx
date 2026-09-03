import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { MediaItem } from '../types.js';
import { MovieCard } from './MovieCard.js';

interface MovieRailProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onWhereToWatch?: (item: MediaItem) => void;
  onViewAll?: () => void;
  savedItemIds?: string[];
  aspectRatio?: 'landscape' | 'poster';
  showAiBadge?: boolean;
}

export const MovieRail: React.FC<MovieRailProps> = ({
  title,
  subtitle,
  items,
  onSelectMedia,
  onToggleSave,
  onWhereToWatch,
  onViewAll,
  savedItemIds = [],
  aspectRatio = 'landscape',
  showAiBadge = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollDistance = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'right' ? scrollDistance : -scrollDistance, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  return (
    <section className="py-6 sm:py-8 select-none relative text-left" aria-label={title}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Rail Header ─── */}
        <div className="flex items-end justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-400 font-light mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Action: Xem tất cả & Scroll Navigation Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-xs text-cyan-400/90 hover:text-cyan-200 transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-7 h-7 rounded-full border border-cyan-900/40 bg-[#031322]/80 flex items-center justify-center text-white transition-all cursor-pointer ${
                  canScrollLeft ? 'hover:border-cyan-400 hover:bg-cyan-950' : 'opacity-30 cursor-not-allowed'
                }`}
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-7 h-7 rounded-full border border-cyan-900/40 bg-[#031322]/80 flex items-center justify-center text-white transition-all cursor-pointer ${
                  canScrollRight ? 'hover:border-cyan-400 hover:bg-cyan-950' : 'opacity-30 cursor-not-allowed'
                }`}
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Horizontal Cards Container ─── */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <MovieCard
              key={item.id}
              item={item}
              onSelect={onSelectMedia}
              onToggleSave={onToggleSave}
              onWhereToWatch={onWhereToWatch}
              isSaved={savedItemIds.includes(item.id)}
              aspectRatio={aspectRatio}
              showAiBadge={showAiBadge}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
