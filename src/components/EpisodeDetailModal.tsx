import React from 'react';
import { Episode, MediaItem } from '../types';
import { X, Play, Clock, Calendar, Sparkles, Users, Compass, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface EpisodeDetailModalProps {
  series: MediaItem;
  episode: Episode;
  onClose: () => void;
  onPlayEpisode: (episode: Episode) => void;
  onSelectPreviousEpisode?: () => void;
  onSelectNextEpisode?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onToggleProgress?: (episodeId: string, percentage: number) => void;
}

export const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  series,
  episode,
  onClose,
  onPlayEpisode,
  onSelectPreviousEpisode,
  onSelectNextEpisode,
  hasPrevious = false,
  hasNext = false,
  onToggleProgress
}) => {
  const isCompleted = (episode.playbackProgress || 0) >= 95;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#030B14]/85 backdrop-blur-xl flex justify-center p-0 sm:p-4 md:p-6 text-[#E8F4F8] animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#071728]/95 backdrop-blur-2xl rounded-none sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(8,126,164,0.2)] overflow-hidden my-auto flex flex-col min-h-screen sm:min-h-0 border border-[#35C2C8]/25 text-left">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-[#061424]/90 backdrop-blur-md border-b border-[#19A7C7]/20 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 text-xs font-bold uppercase tracking-wider">
              {series.title}
            </span>
            <span className="text-xs text-white/20">·</span>
            <span className="text-xs font-semibold text-[#8BA7B8]">
              Mùa {episode.seasonNumber} Tập {episode.episodeNumber}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-cyan-200/80 hover:text-white border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
            title="Đóng"
            aria-label="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail & Video player preview */}
        <div className="relative aspect-[16/9] w-full bg-[#061424] overflow-hidden group">
          <img
            src={episode.thumbnail || series.backdropUrl}
            alt={episode.title}
            className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071728] via-[#071728]/40 to-transparent" />

          {/* Central Play Trigger */}
          <button
            onClick={() => onPlayEpisode(episode)}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-r from-[#087EA4] to-[#35C2C8] text-white flex items-center justify-center shadow-[0_0_25px_rgba(53,194,200,0.5)] transform transition-transform group-hover:scale-110 cursor-pointer"
          >
            <Play className="w-7 h-7 ml-1 fill-current text-white" />
          </button>

          {/* Episode Info on Bottom of Thumbnail */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-xs text-[#35C2C8] font-bold mb-1 uppercase tracking-wider">
              <span>S{String(episode.seasonNumber).padStart(2, '0')}E{String(episode.episodeNumber).padStart(2, '0')}</span>
              <span>·</span>
              <span>{episode.runtime}</span>
              <span>·</span>
              <span>Khởi chiếu: {episode.airDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight text-white">
              {episode.title}
            </h2>
          </div>
        </div>

        {/* Action bar */}
        <div className="bg-[#061424]/70 px-6 py-3 border-b border-[#19A7C7]/20 flex items-center justify-between">
          <button
            onClick={() => onPlayEpisode(episode)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:brightness-110 text-white font-semibold text-xs shadow-[0_0_15px_rgba(53,194,200,0.3)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Phát tập này ngay</span>
          </button>

          <div className="flex items-center gap-2">
            {onToggleProgress && (
              <button
                onClick={() => onToggleProgress(episode.id, isCompleted ? 0 : 100)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isCompleted
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                    : 'bg-[#0B2035]/60 border-[#19A7C7]/20 text-[#8BA7B8] hover:text-white hover:bg-[#0F2A45]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Đã xem xong' : 'Đánh dấu đã xem'}</span>
              </button>
            )}

            {hasPrevious && onSelectPreviousEpisode && (
              <button
                onClick={onSelectPreviousEpisode}
                className="p-2 rounded-xl bg-[#0B2035]/60 border border-[#19A7C7]/20 text-[#8BA7B8] hover:text-white hover:bg-[#0F2A45] cursor-pointer transition-colors"
                title="Tập trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {hasNext && onSelectNextEpisode && (
              <button
                onClick={onSelectNextEpisode}
                className="p-2 rounded-xl bg-[#0B2035]/60 border border-[#19A7C7]/20 text-[#8BA7B8] hover:text-white hover:bg-[#0F2A45] cursor-pointer transition-colors"
                title="Tập kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-6 flex-1 bg-[#071728]/70">
          {/* Tóm tắt tập */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#35C2C8]/80 mb-2">
              Tóm tắt tập phim
            </h3>
            <p className="text-sm text-[#8BA7B8] leading-relaxed">
              {episode.synopsis}
            </p>
          </div>

          {/* AI RECAP (Tóm tắt thông minh) */}
          {episode.aiRecap && (
            <div className="bg-gradient-to-br from-[#087EA4]/20 via-[#0B2035]/60 to-[#071728]/80 p-4 sm:p-5 rounded-2xl border border-[#35C2C8]/30 shadow-[0_0_25px_rgba(8,126,164,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#35C2C8]" />
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  AI Recap & Điểm then chốt
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed mb-3">
                {episode.aiRecap}
              </p>

              {episode.importantEvents && episode.importantEvents.length > 0 && (
                <div className="pt-2 border-t border-[#19A7C7]/20">
                  <span className="text-[11px] font-bold text-[#35C2C8] uppercase tracking-wider block mb-1.5">
                    Sự kiện quan trọng:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#8BA7B8]">
                    {episode.importantEvents.map((evt, idx) => (
                      <li key={idx}>{evt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Nhân vật & Chủ đề */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {episode.keyCharacters && episode.keyCharacters.length > 0 && (
              <div className="p-4 rounded-xl bg-[#0B2035]/50 border border-[#19A7C7]/20">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#35C2C8]/80 block mb-2">
                  Nhân vật xuất hiện chính
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {episode.keyCharacters.map((char, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[#061424] border border-[#19A7C7]/20 text-xs font-medium text-cyan-100"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {episode.majorThemes && episode.majorThemes.length > 0 && (
              <div className="p-4 rounded-xl bg-[#0B2035]/50 border border-[#19A7C7]/20">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#35C2C8]/80 block mb-2">
                  Chủ đề trọng tâm (Themes)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {episode.majorThemes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[#087EA4]/20 border border-[#35C2C8]/30 text-xs font-medium text-[#35C2C8]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
