import React from 'react';
import { Star, Clock, Plus, Check, Play, MapPin, Sparkles, Tv, Film, Zap, BookOpen } from 'lucide-react';
import { MediaItem, MediaType } from '../types';

interface MovieCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onWhereToWatch?: (item: MediaItem) => void;
  isSaved?: boolean;
}

const TYPE_CONFIG: Record<MediaType, { label: string; bgClass: string; icon: React.ReactNode; accentColor: string }> = {
  movie:       { label: 'Phim lẻ',   bgClass: 'type-badge-movie',   icon: <Film className="w-2.5 h-2.5" />,     accentColor: 'rgba(6,43,69,0.08)' },
  series:      { label: 'Series',    bgClass: 'type-badge-series',  icon: <Tv className="w-2.5 h-2.5" />,       accentColor: 'rgba(8,126,164,0.10)' },
  anime:       { label: 'Anime',     bgClass: 'type-badge-anime',   icon: <Sparkles className="w-2.5 h-2.5" />, accentColor: 'rgba(25,167,199,0.10)' },
  short:       { label: 'Phim ngắn', bgClass: 'type-badge-short',   icon: <Clock className="w-2.5 h-2.5" />,    accentColor: 'rgba(53,194,200,0.10)' },
  ai_film:     { label: 'AI Film',   bgClass: 'type-badge-ai_film', icon: <Zap className="w-2.5 h-2.5" />,      accentColor: 'rgba(124,58,237,0.08)' },
  documentary: { label: 'Tài liệu',  bgClass: 'type-badge-doc',     icon: <BookOpen className="w-2.5 h-2.5" />, accentColor: 'rgba(74,101,114,0.08)' },
};

export const MovieCard: React.FC<MovieCardProps> = ({
  item,
  onSelect,
  onToggleSave,
  onWhereToWatch,
  isSaved = false,
}) => {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.movie;
  const seriesInfo = item.seasons && item.seasons.length > 0
    ? `${item.seasons.length} Mùa · ${item.seasons.reduce((acc, s) => acc + s.episodeCount, 0)} Tập`
    : null;

  return (
    <article
      className="group relative flex flex-col bg-[#0C1E2E] rounded-2xl overflow-hidden border border-[#19A7C7]/12 hover:border-[#19A7C7]/40 shadow-sm hover:shadow-xl hover:shadow-[#087EA4]/10 transition-all duration-350 text-left card-hover"
      style={{ borderTopColor: `${config.accentColor.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')')}` }}
    >
      {/* === POSTER IMAGE === */}
      <div
        className="relative aspect-[2/3] w-full overflow-hidden bg-[#0A1E30] cursor-pointer"
        onClick={() => onSelect(item)}
      >
        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm flex items-center gap-1 ${config.bgClass}`}>
            {config.icon}
            {config.label}
          </span>
          <div className="rating-badge">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>{item.rating}</span>
          </div>
        </div>

        {/* AI Match badge — only when present */}
        {item.aiMatchScore && (
          <div className="absolute top-10 right-2.5 pointer-events-none z-10">
            <span className="ai-match-badge">
              <Sparkles className="w-2.5 h-2.5" />
              {item.aiMatchScore}% AI
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#062B45] via-[#062B45]/75 via-40% to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 ease-out flex flex-col justify-end p-3.5 z-10">
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-350 ease-out space-y-1.5">
            {/* Genre + year */}
            <div className="flex items-center gap-2 text-[10px] text-[#35C2C8] font-bold uppercase tracking-wide">
              <span className="truncate">{item.genres.slice(0, 2).join(' · ')}</span>
              <span className="text-white/30">·</span>
              <span className="text-white/80 shrink-0">{item.year}</span>
            </div>

            {/* Director */}
            {item.director && (
              <p className="text-[11px] text-gray-300 truncate">
                ĐD: <span className="text-white font-medium">{item.director}</span>
              </p>
            )}

            {/* Series info or tagline */}
            {seriesInfo ? (
              <p className="text-xs text-[#35C2C8] font-semibold">{seriesInfo}</p>
            ) : (
              <p className="text-xs text-white/85 line-clamp-2 leading-snug italic">
                "{item.tagline || item.synopsis}"
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onSelect(item)}
                className="flex-1 py-2 px-3 rounded-xl bg-white text-[#062B45] hover:bg-[#EAF8FC] font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Chi tiết</span>
              </button>

              {onToggleSave && (
                <button
                  onClick={() => onToggleSave(item.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-[#35C2C8] border-[#35C2C8] text-[#062B45]'
                      : 'bg-black/40 border-white/25 text-white hover:bg-white/20'
                  }`}
                  title={isSaved ? 'Đã lưu' : 'Thêm vào Hải trình'}
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              )}

              {onWhereToWatch && (
                <button
                  onClick={() => onWhereToWatch(item)}
                  className="p-2 rounded-xl bg-black/40 border border-white/25 text-[#35C2C8] hover:bg-white/20 transition-all cursor-pointer"
                  title="Nơi xem bản quyền"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === CARD INFO === */}
      <div className="p-3.5 flex flex-col flex-1 bg-[#0C1E2E]">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#35C2C8] uppercase tracking-wider mb-1">
          <span>{item.genres[0] || 'Điện ảnh'}</span>
          <span className="text-[#8BA7B8]/40">·</span>
          <span>{item.year}</span>
        </div>

        <h3
          className="font-bold text-sm text-[#E8F4F8] group-hover:text-[#35C2C8] transition-colors leading-snug line-clamp-1 cursor-pointer mb-2"
          onClick={() => onSelect(item)}
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Distinct Series vs Movie metadata */}
        {item.type === 'series' || (item.seasons && item.seasons.length > 0) ? (
          <div className="flex items-center gap-1.5 text-xs text-[#35C2C8] font-semibold">
            <Tv className="w-3.5 h-3.5 text-[#19A7C7]" />
            <span>{item.seasons?.length || 1} Mùa</span>
            <span className="text-[#8BA7B8]/40">·</span>
            <span>{item.seasons?.reduce((acc, s) => acc + s.episodeCount, 0) || 8} Tập</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[#8BA7B8]">
            <Clock className="w-3.5 h-3.5 text-[#19A7C7]" />
            <span>{item.runtime}</span>
          </div>
        )}

        {/* Streaming availability preview */}
        {item.streamingOptions?.[0] && (
          <div className="mt-2.5 pt-2 border-t border-[#19A7C7]/15 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-[#35C2C8] truncate">
              {item.streamingOptions[0].provider}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
              item.streamingOptions[0].type === 'free'
                ? 'bg-[#35C2C8]/15 text-[#35C2C8]'
                : 'bg-[#0A1E30] text-[#8BA7B8]'
            }`}>
              {item.streamingOptions[0].type === 'free' ? 'Miễn phí' : 'Bản quyền'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
