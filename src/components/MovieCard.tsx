import React, { useRef, useEffect, useState } from 'react';
import { Star, Plus, Check, MapPin, Tv, Sparkles } from 'lucide-react';
import { MediaItem } from '../types.js';

interface MovieCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onWhereToWatch?: (item: MediaItem) => void;
  isSaved?: boolean;
  aspectRatio?: 'landscape' | 'poster';
  showAiBadge?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  item,
  onSelect,
  onToggleSave,
  onWhereToWatch,
  isSaved = false,
  aspectRatio = 'landscape',
  showAiBadge = false,
}) => {
  const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);
  const imageUrl = aspectRatio === 'landscape' ? (item.backdropUrl || item.posterUrl) : item.posterUrl;
  const cardRef = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Scroll-reveal with IntersectionObserver
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 50px 0px 50px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showAiScore = showAiBadge && item.aiMatchScore && item.aiMatchScore >= 80;

  return (
    <article
      ref={cardRef}
      className={`group relative flex flex-col rounded-lg overflow-hidden bg-[#050E1C]/95 border border-cyan-900/25 hover:border-cyan-400/35 shadow-lg hover:shadow-[0_12px_40px_rgba(8,126,164,0.15)] transition-all duration-350 ease-out text-left select-none cursor-pointer ${
        aspectRatio === 'landscape' ? 'w-[240px] sm:w-[280px] shrink-0' : 'w-full'
      } ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      style={{ transition: 'opacity 0.45s ease-out, transform 0.45s ease-out, box-shadow 0.3s ease, border-color 0.3s ease' }}
      onClick={() => onSelect(item)}
    >
      {/* ─── Image ─── */}
      <div
        className={`relative w-full overflow-hidden bg-[#020A12] ${
          aspectRatio === 'landscape' ? 'aspect-[16/10]' : 'aspect-[2/3]'
        }`}
      >
        <img
          src={imageUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.025] group-hover:brightness-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050E1C] via-[#050E1C]/15 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          {/* Type pill */}
          {isSeries ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/75 backdrop-blur-sm border border-cyan-500/25 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
              <Tv className="w-2 h-2" />
              Series
            </span>
          ) : (
            <span />
          )}

          {/* AI Match badge */}
          {showAiScore ? (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#020C17]/85 backdrop-blur-sm border border-cyan-400/35 text-cyan-200 shadow-sm pointer-events-none"
              title={`Phù hợp AI: ${item.aiMatchScore}%`}
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
              <span className="text-[9px] font-bold font-mono">{item.aiMatchScore}%</span>
            </div>
          ) : null}
        </div>

        {/* Quick actions on hover */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(item.id);
              }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-cyan-500 text-white'
                  : 'bg-black/65 hover:bg-cyan-950/85 text-gray-300 hover:text-white border border-white/20'
              }`}
              title={isSaved ? 'Đã lưu trong hải trình' : 'Lưu vào hải trình'}
              aria-label={isSaved ? 'Bỏ lưu' : 'Lưu'}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}

          {onWhereToWatch && item.streamingOptions && item.streamingOptions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWhereToWatch(item);
              }}
              className="w-7 h-7 rounded-lg bg-black/65 hover:bg-cyan-950/85 text-gray-300 hover:text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
              title="Xem ở đâu"
              aria-label="Xem ở đâu"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Metadata ─── */}
      <div className="px-3 py-2.5 bg-[#050E1C]/95 flex-1">
        <h3 className="font-sans font-semibold text-[13px] text-white/95 tracking-tight truncate group-hover:text-cyan-200 transition-colors leading-tight">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-gray-500">
          <span>{item.year}</span>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span className="font-semibold text-[11px]">{item.rating?.toFixed(1) || '—'}</span>
          </div>
          {item.genres?.[0] && (
            <>
              <span className="text-gray-600">·</span>
              <span className="truncate max-w-[72px] font-sans text-gray-500 text-[10px]">
                {item.genres[0]}
              </span>
            </>
          )}
        </div>

        {/* AI reason text — only on ai recommendation cards */}
        {showAiBadge && item.whyYouMayLike && (
          <p className="mt-1.5 text-[10px] text-cyan-400/60 leading-relaxed font-sans line-clamp-2">
            {item.whyYouMayLike}
          </p>
        )}
      </div>
    </article>
  );
};
