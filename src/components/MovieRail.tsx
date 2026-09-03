import React, { useRef, useState, useEffect } from 'react';
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
  icon
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="py-7 sm:py-9">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex items-end justify-between mb-4 sm:mb-5">
          <div className="text-left space-y-0.5">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#062B45] tracking-tight">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 font-normal">
                {subtitle}
              </p>
            )}
          </div>

          {/* Controls: Prev/Next & View All */}
          <div className="flex items-center gap-2">
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#087EA4] hover:text-[#062B45] transition-colors mr-2 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 sm:p-2 rounded-full border border-gray-200 bg-white hover:bg-[#EAF8FC] text-[#062B45] transition-colors cursor-pointer shadow-xs ${
                !canScrollLeft ? 'opacity-35 cursor-not-allowed' : ''
              }`}
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-1.5 sm:p-2 rounded-full border border-gray-200 bg-white hover:bg-[#EAF8FC] text-[#062B45] transition-colors cursor-pointer shadow-xs ${
                !canScrollRight ? 'opacity-35 cursor-not-allowed' : ''
              }`}
              aria-label="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scroll Container with Ocean Gradient Fade at the Edge */}
        <div className="relative movie-rail-container">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="w-[180px] sm:w-[220px] lg:w-[240px] shrink-0 snap-start"
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
          </div>

          {/* Left Ocean subtle edge when scrolled */}
          <div
            className={`pointer-events-none absolute top-0 bottom-4 left-0 w-12 sm:w-20 bg-gradient-to-r from-[#087EA4]/20 via-[#087EA4]/5 to-transparent z-10 transition-opacity duration-300 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Right Ocean Gradient overlay (#087EA4 to transparent) creating depth and infinite sea horizon */}
          <div
            className={`pointer-events-none absolute top-0 bottom-4 right-0 w-20 sm:w-32 lg:w-44 bg-gradient-to-l from-[#087EA4]/35 via-[#087EA4]/12 to-transparent z-10 transition-opacity duration-300 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
};
