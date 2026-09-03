import React from 'react';
import { Star, Sparkles, Plus, Check, MapPin, Tv, Film } from 'lucide-react';
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

  return (
    <article
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-[#051322]/90 border border-cyan-900/30 hover:border-cyan-400/40 shadow-lg hover:shadow-2xl hover:shadow-cyan-950/40 transition-all duration-300 text-left select-none cursor-pointer ${
        aspectRatio === 'landscape' ? 'w-[230px] sm:w-[270px] shrink-0' : 'w-full'
      }`}
      onClick={() => onSelect(item)}
    >
      {/* ─── Poster / Backdrop Thumbnail ─── */}
      <div
        className={`relative w-full overflow-hidden bg-[#020A12] ${
          aspectRatio === 'landscape' ? 'aspect-[16/10]' : 'aspect-[2/3]'
        }`}
      >
        <img
          src={imageUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-110"
        />

        {/* Ambient Bottom Gradient on Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#051322] via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {/* Media Type pill */}
          {isSeries ? (
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 backdrop-blur-md border border-cyan-500/30 text-[9px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <Tv className="w-2.5 h-2.5" />
              Series
            </span>
          ) : (
            <span />
          )}

          {/* AI Sparkle Badge (Matching reference image) */}
          {(showAiBadge || (item.aiMatchScore && item.aiMatchScore >= 90)) && (
            <div
              className="w-6 h-6 rounded-md bg-[#020C17]/80 backdrop-blur-md border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md pointer-events-auto"
              title={`Phù hợp AI: ${item.aiMatchScore || 92}%`}
            >
              <Sparkles className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Quick Action Overlay on Hover */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(item.id);
              }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-colors ${
                isSaved
                  ? 'bg-cyan-500 text-white'
                  : 'bg-black/60 hover:bg-cyan-950/80 text-gray-300 hover:text-white border border-white/20'
              }`}
              title={isSaved ? 'Đã lưu trong hải trình' : 'Lưu vào hải trình'}
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
              className="w-7 h-7 rounded-lg bg-black/60 hover:bg-cyan-950/80 text-gray-300 hover:text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-colors"
              title="Xem ở đâu"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Metadata Info ─── */}
      <div className="p-3 pt-2 bg-[#051322]/90">
        <h3 className="font-sans font-bold text-xs sm:text-sm text-white tracking-wide truncate group-hover:text-cyan-300 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-gray-400">
          <span>{item.year}</span>
          <span>·</span>
          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <Star className="w-3 h-3 fill-current" />
            <span>{item.rating?.toFixed(1) || '8.5'}</span>
          </div>
          {item.genres && item.genres.length > 0 && (
            <>
              <span>·</span>
              <span className="truncate max-w-[80px] font-sans text-gray-400 text-[10px]">
                {item.genres[0]}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
