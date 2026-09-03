import React from 'react';
import { Star, Clock, Plus, Check, Play, Info, MapPin, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';

interface MovieCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onWhereToWatch?: (item: MediaItem) => void;
  isSaved?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  item,
  onSelect,
  onToggleSave,
  onWhereToWatch,
  isSaved = false
}) => {
  const getTypeBadge = () => {
    switch (item.type) {
      case 'series':
        return { label: 'Series', bg: 'bg-[#087EA4]' };
      case 'anime':
        return { label: 'Anime', bg: 'bg-[#19A7C7]' };
      case 'short':
        return { label: 'Phim ngắn', bg: 'bg-[#35C2C8] text-[#062B45]' };
      case 'ai_film':
        return { label: 'Phim AI', bg: 'bg-purple-600' };
      default:
        return { label: 'Phim lẻ', bg: 'bg-[#062B45]' };
    }
  };

  const badge = getTypeBadge();

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-[#087EA4]/12 hover:border-[#19A7C7]/50 shadow-xs hover:shadow-lg hover:shadow-[#087EA4]/10 transition-all duration-400 text-left">
      {/* Poster Image Container */}
      <div
        className="relative aspect-[2/3] w-full overflow-hidden bg-[#062B45]/5 cursor-pointer"
        onClick={() => onSelect(item)}
      >
        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10 transition-opacity duration-300 group-hover:opacity-90">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-xs ${badge.bg}`}
          >
            {badge.label}
          </span>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#062B45]/70 backdrop-blur-xs text-[#35C2C8] text-xs font-bold shadow-xs border border-white/10">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>{item.rating}</span>
          </div>
        </div>

        {/* Ocean Hover Action Overlay with smooth fade-in */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#062B45] via-[#062B45]/80 via-45% to-transparent opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-400 ease-out flex flex-col justify-end p-4 text-white z-10">
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-400 ease-out space-y-1.5">
            {/* Genre & Meta row */}
            <div className="flex items-center gap-2 text-[11px] text-[#35C2C8] font-semibold uppercase tracking-wider">
              <span className="truncate">{item.genres.slice(0, 2).join(' · ')}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/80 shrink-0">{item.year}</span>
            </div>

            {/* Director info */}
            {item.director && (
              <p className="text-[11px] text-gray-300 truncate">
                ĐD: <span className="text-white font-medium">{item.director}</span>
              </p>
            )}

            {/* Tagline or synopsis */}
            <p className="text-xs text-white/90 line-clamp-2 leading-snug italic pt-0.5">
              “{item.tagline || item.synopsis}”
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onSelect(item)}
                className="flex-1 py-2 px-3 rounded-xl bg-white text-[#062B45] hover:bg-[#EAF8FC] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Chi tiết & Xem</span>
              </button>

              {onToggleSave && (
                <button
                  onClick={() => onToggleSave(item.id)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-[#35C2C8] border-[#35C2C8] text-[#062B45]'
                      : 'bg-black/40 border-white/30 text-white hover:bg-white/20'
                  }`}
                  title={isSaved ? 'Đã lưu trong Hải trình' : 'Thêm vào Hải trình'}
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              )}

              {onWhereToWatch && (
                <button
                  onClick={() => onWhereToWatch(item)}
                  className="p-2 rounded-xl bg-black/40 border border-white/30 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Nơi xem bản quyền"
                >
                  <MapPin className="w-4 h-4 text-[#35C2C8]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info details */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
        <div>
          <h3
            className="font-bold text-sm text-[#062B45] group-hover:text-[#087EA4] transition-colors leading-snug line-clamp-1 cursor-pointer"
            onClick={() => onSelect(item)}
            title={item.title}
          >
            {item.title}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{item.year}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {item.runtime}
            </span>
          </div>
        </div>

        {/* Quick streaming label preview */}
        {item.streamingOptions && item.streamingOptions[0] && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#087EA4]">
            <span className="font-medium truncate">
              {item.streamingOptions[0].provider}
            </span>
            <span className="text-gray-400 text-[10px]">
              {item.streamingOptions[0].type === 'free' ? 'Miễn phí' : 'Bản quyền'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
