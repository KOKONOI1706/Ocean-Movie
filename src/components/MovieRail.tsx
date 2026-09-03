import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { MediaItem } from '../types';
import { MovieCard } from './MovieCard';

interface MovieRailProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onWhereToWatch?: (item: MediaItem) => void;
  onViewAll?: () => void;
  savedItemIds?: string[];
  icon?: React.ReactNode;
  accentVariant?: 'default' | 'sand' | 'sky' | 'navy';
}

const VARIANT_STYLES = {
  default: 'bg-[#060F1A]',
  sand:    'bg-[#071525]',
  sky:     'bg-[#0A1E30]',
  navy:    'bg-[#062B45]',
};

const CARD_WIDTH = 190; // px for scroll calculation
const SCROLL_AMOUNT = CARD_WIDTH * 3;

export const MovieRail: React.FC<MovieRailProps> = ({
  title,
  subtitle,
  items,
  onSelectMedia,
  onToggleSave,
  onWhereToWatch,
  onViewAll,
  savedItemIds = [],
  icon,
  accentVariant = 'default',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? SCROLL_AMOUNT : -SCROLL_AMOUNT, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  const bgClass = VARIANT_STYLES[accentVariant] ?? VARIANT_STYLES.default;
  const isNavy = accentVariant === 'navy';

  return (
    <section className={`${bgClass} py-8 sm:py-10`} aria-label={title}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Rail Header ─── */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              {icon && (
                <span className={`flex items-center ${isNavy ? 'text-[#35C2C8]' : 'text-[#087EA4]'}`}>
                  {icon}
                </span>
              )}
              <h2 className={`section-title text-base sm:text-lg ${isNavy ? 'text-white' : 'text-[#E8F4F8]'}`}>
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className={`section-subtitle text-xs sm:text-sm line-clamp-2 ${isNavy ? 'text-gray-300' : 'text-[#8BA7B8]'}`}>
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-[#0C1E2E] border-[#19A7C7]/25 text-[#8BA7B8] hover:bg-[#0A1E30] hover:text-[#E8F4F8] hover:border-[#19A7C7]'
                  : 'opacity-30 cursor-not-allowed bg-[#0A1628] border-[#19A7C7]/10 text-[#8BA7B8]/30'
              }`}
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-[#0C1E2E] border-[#19A7C7]/25 text-[#8BA7B8] hover:bg-[#0A1E30] hover:text-[#E8F4F8] hover:border-[#19A7C7]'
                  : 'opacity-30 cursor-not-allowed bg-[#0A1628] border-[#19A7C7]/10 text-[#8BA7B8]/30'
              }`}
              aria-label="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {onViewAll && (
              <button
                onClick={onViewAll}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isNavy
                    ? 'text-[#35C2C8] hover:text-[#E8F4F8] hover:bg-[#0C1E2E]'
                    : 'text-[#35C2C8] hover:text-[#E8F4F8] hover:bg-[#0C1E2E]'
                }`}
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Scrollable Rail ─── */}
        <div className="relative">
          {/* Left fade gradient */}
          {canScrollLeft && (
            <div
              className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-[#062B45] to-transparent"
              style={{ background: `linear-gradient(to right, ${accentVariant === 'navy' ? '#062B45' : accentVariant === 'sky' ? '#0A1E30' : accentVariant === 'sand' ? '#071525' : '#060F1A'}, transparent)` }}
            />
          )}
          {/* Right fade gradient */}
          {canScrollRight && (
            <div
              className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to left, ${accentVariant === 'navy' ? '#062B45' : accentVariant === 'sky' ? '#0A1E30' : accentVariant === 'sand' ? '#071525' : '#060F1A'}, transparent)` }}
            />
          )}

          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex gap-4 overflow-x-auto no-scrollbar pb-3 -mb-3"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="shrink-0"
                style={{ width: `${CARD_WIDTH}px`, scrollSnapAlign: 'start' }}
              >
                <MovieCard
                  item={item}
                  onSelect={onSelectMedia}
                  onToggleSave={onToggleSave}
                  onWhereToWatch={onWhereToWatch}
                  isSaved={savedItemIds.includes(item.id)}
                />
              </div>
            ))}

            {/* View All card at end */}
            {onViewAll && (
              <div className="shrink-0 flex" style={{ width: `${CARD_WIDTH * 0.6}px`, scrollSnapAlign: 'start' }}>
                <button
                  onClick={onViewAll}
                  className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 p-4 transition-all cursor-pointer group ${
                    isNavy
                      ? 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                      : 'border-[#19A7C7]/20 text-[#8BA7B8] hover:border-[#19A7C7] hover:text-[#35C2C8] hover:bg-[#0C1E2E]/50'
                  }`}
                >
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  <span className="text-xs font-semibold text-center">Xem tất cả</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
