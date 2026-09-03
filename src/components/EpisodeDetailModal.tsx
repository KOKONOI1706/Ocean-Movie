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
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#062B45]/85 backdrop-blur-md flex justify-center p-0 sm:p-4 md:p-6 text-[#062B45] animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col min-h-screen sm:min-h-0 border border-[#087EA4]/20 text-left">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF8FC] text-[#087EA4] text-xs font-bold uppercase tracking-wider">
              {series.title}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs font-semibold text-gray-600">
              Mùa {episode.seasonNumber} Tập {episode.episodeNumber}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail & Video player preview */}
        <div className="relative aspect-[16/9] w-full bg-[#062B45] overflow-hidden group">
          <img
            src={episode.thumbnail || series.backdropUrl}
            alt={episode.title}
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062B45]/90 via-[#062B45]/30 to-transparent" />

          {/* Central Play Trigger */}
          <button
            onClick={() => onPlayEpisode(episode)}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/90 hover:bg-white text-[#062B45] flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110 cursor-pointer"
          >
            <Play className="w-7 h-7 ml-1 fill-current text-[#087EA4]" />
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
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
              {episode.title}
            </h2>
          </div>
        </div>

        {/* Action bar */}
        <div className="bg-[#FAF8F5] px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={() => onPlayEpisode(episode)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:from-[#062B45] hover:to-[#087EA4] text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
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
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Đã xem xong' : 'Đánh dấu đã xem'}</span>
              </button>
            )}

            {hasPrevious && onSelectPreviousEpisode && (
              <button
                onClick={onSelectPreviousEpisode}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                title="Tập trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {hasNext && onSelectNextEpisode && (
              <button
                onClick={onSelectNextEpisode}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                title="Tập kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-6 flex-1 bg-white">
          {/* Tóm tắt tập */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Tóm tắt tập phim
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {episode.synopsis}
            </p>
          </div>

          {/* AI RECAP (Tóm tắt thông minh) */}
          {episode.aiRecap && (
            <div className="bg-[#EAF8FC] p-4 sm:p-5 rounded-2xl border border-[#19A7C7]/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#087EA4]" />
                <h4 className="text-xs sm:text-sm font-bold text-[#062B45]">
                  AI Recap & Điểm then chốt
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3">
                {episode.aiRecap}
              </p>

              {episode.importantEvents && episode.importantEvents.length > 0 && (
                <div className="pt-2 border-t border-[#19A7C7]/20">
                  <span className="text-[11px] font-bold text-[#087EA4] uppercase tracking-wider block mb-1.5">
                    Sự kiện quan trọng:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
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
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Nhân vật xuất hiện chính
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {episode.keyCharacters.map((char, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {episode.majorThemes && episode.majorThemes.length > 0 && (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Chủ đề trọng tâm (Themes)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {episode.majorThemes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[#EAF8FC] border border-[#19A7C7]/20 text-xs font-medium text-[#087EA4]"
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
