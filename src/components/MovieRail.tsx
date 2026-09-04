import React, { useRef, useState, useEffect } from 'react';
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
  /** Visual accent for this depth zone */
  depthAccent?: 'surface' | 'shallow' | 'twilight' | 'deep' | 'abyss';
}

const DEPTH_ACCENT_COLORS: Record<string, string> = {
  surface:  'from-cyan-400 to-cyan-600',
  shallow:  'from-sky-400 to-cyan-600',
  twilight: 'from-blue-500 to-cyan-700',
  deep:     'from-violet-500 to-blue-700',
  abyss:    'from-violet-700 to-indigo-900',
};

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
  depthAccent = 'surface',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Scroll-reveal for section header
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    const dist = el.clientWidth * 0.72;
    el.scrollBy({ left: dir === 'right' ? dist : -dist, behavior: 'smooth' });
    setTimeout(updateScrollState, 360);
  };

  const accentGradient = DEPTH_ACCENT_COLORS[depthAccent] || DEPTH_ACCENT_COLORS.surface;

  return (
    <section
      ref={sectionRef}
      className="py-8 sm:py-10 select-none relative text-left"
      aria-label={title}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Section Header ─── */}
        <div
          className={`flex items-end justify-between mb-5 gap-4 transition-all duration-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex-1 min-w-0 section-header-line" style={{
            '--before-gradient': accentGradient,
          } as React.CSSProperties}>
            {/* Override the left border color with depth accent */}
            <div className="relative pl-3">
              <div
                className={`absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b ${accentGradient} rounded-full`}
              />
              <h2 className="text-[11px] sm:text-xs font-sans font-bold text-white uppercase tracking-[0.12em]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[12px] text-gray-500 font-light mt-0.5 font-sans leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: View All + scroll navigation */}
          <div className="flex items-center gap-3 shrink-0">
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-[11px] text-cyan-400/80 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1 cursor-pointer font-sans tracking-wide"
                aria-label={`Xem tất cả ${title}`}
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-7 h-7 rounded-full border bg-[#031322]/90 flex items-center justify-center text-white transition-all cursor-pointer ${
                  canScrollLeft
                    ? 'border-cyan-800/50 hover:border-cyan-400 hover:bg-cyan-950'
                    : 'border-cyan-900/20 opacity-25 cursor-not-allowed'
                }`}
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-7 h-7 rounded-full border bg-[#031322]/90 flex items-center justify-center text-white transition-all cursor-pointer ${
                  canScrollRight
                    ? 'border-cyan-800/50 hover:border-cyan-400 hover:bg-cyan-950'
                    : 'border-cyan-900/20 opacity-25 cursor-not-allowed'
                }`}
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Scrollable Card Track ─── */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="list"
          aria-label={`${title} — danh sách phim`}
        >
          {items.map((item) => (
            <div key={item.id} role="listitem">
              <MovieCard
                item={item}
                onSelect={onSelectMedia}
                onToggleSave={onToggleSave}
                onWhereToWatch={onWhereToWatch}
                isSaved={savedItemIds.includes(item.id)}
                aspectRatio={aspectRatio}
                showAiBadge={showAiBadge}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
