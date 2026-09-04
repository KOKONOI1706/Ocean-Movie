import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Compass, Sparkles, ArrowRight, Star, Plus, Check, MapPin } from 'lucide-react';
import { MediaItem } from '../types.js';

interface AIRecommendationRailProps {
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onWhereToWatch?: (item: MediaItem) => void;
  onViewAll?: () => void;
  savedItemIds?: string[];
}

const AIRecommendationCard: React.FC<{
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onWhereToWatch?: (item: MediaItem) => void;
  isSaved: boolean;
}> = ({ item, onSelect, onToggleSave, onWhereToWatch, isSaved }) => {
  const matchScore = item.aiMatchScore ?? 88;
  const reason = item.whyYouMayLike || 'Câu chuyện này phù hợp với hành trình điện ảnh của bạn.';

  return (
    <article
      className="group relative flex flex-col rounded-lg overflow-hidden bg-[#050E1C]/95 border border-cyan-700/20 hover:border-cyan-400/40 shadow-lg hover:shadow-[0_16px_48px_rgba(8,126,164,0.18)] transition-all duration-350 ease-out cursor-pointer select-none w-[240px] sm:w-[280px] shrink-0 text-left"
      onClick={() => onSelect(item)}
    >
      {/* Image with AI match overlay */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#020A12]">
        <img
          src={item.backdropUrl || item.posterUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.025] group-hover:brightness-105"
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050E1C] via-[#050E1C]/25 to-transparent" />

        {/* AI Match Score — top-right, prominent */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#020C17]/90 backdrop-blur-sm border border-cyan-400/30 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-cyan-300 shrink-0" />
            <span className="font-mono font-bold text-[13px] text-cyan-200 leading-none">
              {matchScore}%
            </span>
          </div>
          <span className="text-[8px] font-mono text-cyan-400/60 tracking-wider uppercase pr-0.5">
            AI MATCH
          </span>
        </div>

        {/* Quick actions */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onToggleSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(item.id); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${
                isSaved ? 'bg-cyan-500 text-white' : 'bg-black/65 hover:bg-cyan-950/85 text-gray-300 hover:text-white border border-white/20'
              }`}
              title={isSaved ? 'Đã lưu' : 'Lưu vào hải trình'}
              aria-label={isSaved ? 'Bỏ lưu' : 'Lưu'}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
          {onWhereToWatch && item.streamingOptions && item.streamingOptions.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onWhereToWatch(item); }}
              className="w-7 h-7 rounded-lg bg-black/65 hover:bg-cyan-950/85 text-gray-300 hover:text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
              title="Xem ở đâu"
              aria-label="Xem ở đâu"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-3 py-2.5 flex-1 flex flex-col">
        <h3 className="font-sans font-semibold text-[13px] text-white/95 tracking-tight truncate group-hover:text-cyan-200 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-gray-500">
          <span>{item.year}</span>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span className="font-semibold">{item.rating?.toFixed(1) || '—'}</span>
          </div>
          {item.genres?.[0] && (
            <>
              <span className="text-gray-600">·</span>
              <span className="truncate max-w-[70px] text-gray-500 text-[10px] font-sans">{item.genres[0]}</span>
            </>
          )}
        </div>

        {/* AI reason — distinctive teal quote */}
        <p className="mt-2 text-[10px] text-cyan-400/65 leading-relaxed font-sans line-clamp-2 italic border-l border-cyan-800/50 pl-2">
          {reason}
        </p>
      </div>
    </article>
  );
};

export const AIRecommendationRail: React.FC<AIRecommendationRailProps> = ({
  items,
  onSelectMedia,
  onToggleSave,
  onWhereToWatch,
  onViewAll,
  savedItemIds = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.06 }
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
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.72 : -el.clientWidth * 0.72, behavior: 'smooth' });
    setTimeout(updateScrollState, 360);
  };

  return (
    <section
      ref={sectionRef}
      className="py-10 sm:py-14 relative select-none ai-recommendation-panel"
      aria-label="Đề xuất từ AI"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(8,126,164,0.07) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div
          className={`flex items-end justify-between mb-6 gap-4 transition-all duration-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Compass icon */}
            <div
              className="mt-0.5 w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_20px_rgba(53,194,200,0.15)]"
              aria-hidden="true"
            >
              <Compass className="w-4.5 h-4.5" />
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-[0.14em] text-cyan-400/70 uppercase mb-0.5">
                AI · Dành riêng cho bạn
              </div>
              <h2 className="text-sm sm:text-base font-sans font-bold text-white uppercase tracking-[0.1em]">
                ĐỀ XUẤT TỪ AI
              </h2>
              <p className="text-[12px] text-gray-500 font-sans font-light mt-0.5">
                AI đã tìm thấy vài câu chuyện có thể hợp với bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-[11px] text-cyan-400/80 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1 cursor-pointer font-sans tracking-wide"
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
                  canScrollLeft ? 'border-cyan-800/50 hover:border-cyan-400 hover:bg-cyan-950' : 'border-cyan-900/20 opacity-25 cursor-not-allowed'
                }`}
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-7 h-7 rounded-full border bg-[#031322]/90 flex items-center justify-center text-white transition-all cursor-pointer ${
                  canScrollRight ? 'border-cyan-800/50 hover:border-cyan-400 hover:bg-cyan-950' : 'border-cyan-900/20 opacity-25 cursor-not-allowed'
                }`}
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="list"
          aria-label="Đề xuất AI — danh sách phim"
        >
          {items.map((item) => (
            <div key={item.id} role="listitem">
              <AIRecommendationCard
                item={item}
                onSelect={onSelectMedia}
                onToggleSave={onToggleSave}
                onWhereToWatch={onWhereToWatch}
                isSaved={savedItemIds.includes(item.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
