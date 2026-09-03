import React, { useState } from 'react';
import { MediaItem, Season, Episode } from '../types';
import {
  X,
  Bookmark,
  Play,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Clock,
  Calendar,
  Layers,
  Star,
  MapPin,
  Check,
  Tv
} from 'lucide-react';
import { EpisodeDetailModal } from './EpisodeDetailModal';

interface SeriesDetailModalProps {
  item: MediaItem;
  onClose: () => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  isSaved: boolean;
  onToggleSave: (item: MediaItem) => void;
  onUpdateEpisodeProgress: (episodeId: string, percentage: number) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  item,
  onClose,
  onOpenWhereToWatch,
  isSaved,
  onToggleSave,
  onUpdateEpisodeProgress
}) => {
  const seasons = item.seasons || [];
  const [activeSeasonNum, setActiveSeasonNum] = useState<number>(seasons[0]?.seasonNumber || 1);
  const currentSeason = seasons.find((s) => s.seasonNumber === activeSeasonNum) || seasons[0];

  const [activeEpisodeModal, setActiveEpisodeModal] = useState<Episode | null>(null);

  // Calculate first unfinished episode for "Tiếp tục xem" CTA
  const allEpisodes = seasons.flatMap((s) => s.episodes || []);
  const nextUpEpisode =
    allEpisodes.find((ep) => (ep.playbackProgress || 0) < 95) || allEpisodes[0];

  const totalEpisodesCount = allEpisodes.length;

  const handleOpenEpisode = (episode: Episode) => {
    setActiveEpisodeModal(episode);
  };

  const handlePlayDirect = (episode: Episode) => {
    onUpdateEpisodeProgress(episode.id, 100);
    setActiveEpisodeModal(null);
    onOpenWhereToWatch(item);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#062B45]/85 backdrop-blur-md flex justify-center p-0 sm:p-4 md:p-6 text-[#062B45] animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col min-h-screen sm:min-h-0 border border-[#087EA4]/20 text-left">
          {/* Top Control Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#087EA4] text-white text-xs font-bold uppercase tracking-wider">
                SERIES ĐẶC SẮC
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs font-semibold text-gray-600">
                {seasons.length} Mùa · {totalEpisodesCount} Tập
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleSave(item)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-[#087EA4] text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-[#062B45]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Đang theo dõi' : '+ Theo dõi series'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative bg-[#062B45] text-white">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[360px] w-full overflow-hidden">
              <img
                src={item.backdropUrl || item.posterUrl}
                alt={item.title}
                className="w-full h-full object-cover brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062B45] via-[#062B45]/40 to-transparent" />
            </div>

            <div className="px-6 pb-6 pt-2 relative z-10 -mt-16 sm:-mt-24 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#35C2C8] font-semibold">
                <span>{item.year}</span>
                <span>·</span>
                <span>{seasons.length} Mùa phim</span>
                <span>·</span>
                <span>{item.genres.join(', ')}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {item.title}
              </h1>

              {item.tagline && (
                <p className="text-sm sm:text-base text-gray-200 italic max-w-2xl">
                  “{item.tagline}”
                </p>
              )}

              {/* Primary Action Button: Tiếp tục xem S01E01 */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {nextUpEpisode && (
                  <button
                    onClick={() => handleOpenEpisode(nextUpEpisode)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:from-[#062B45] hover:to-[#087EA4] text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      Tiếp tục xem S{String(nextUpEpisode.seasonNumber).padStart(2, '0')}E{String(nextUpEpisode.episodeNumber).padStart(2, '0')}: {nextUpEpisode.title}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => onOpenWhereToWatch(item)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#35C2C8]" />
                  <span>Nơi xem bản quyền</span>
                </button>
              </div>
            </div>
          </div>

          {/* Season Selector Tabs */}
          <div className="border-b border-gray-200 bg-[#FAF8F5] px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 shrink-0">
              Chọn mùa:
            </span>
            {seasons.map((season) => {
              const isSelected = season.seasonNumber === activeSeasonNum;
              return (
                <button
                  key={season.seasonNumber}
                  onClick={() => setActiveSeasonNum(season.seasonNumber)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#087EA4] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {season.title || `Mùa ${season.seasonNumber}`} ({season.episodes?.length || 0} tập)
                </button>
              );
            })}
          </div>

          {/* Episodes List Grid */}
          <div className="p-6 space-y-4 flex-1 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#062B45]">
                {currentSeason?.title || `Mùa ${activeSeasonNum}`}
              </h3>
              <span className="text-xs text-gray-500">
                {currentSeason?.episodes?.length || 0} tập phim
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSeason?.episodes?.map((ep) => {
                const progress = ep.playbackProgress || 0;
                const isCompleted = progress >= 95;

                return (
                  <div
                    key={ep.id}
                    onClick={() => handleOpenEpisode(ep)}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-[#087EA4] p-3 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                  >
                    <div>
                      {/* Episode Thumbnail & Badges */}
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 mb-3">
                        <img
                          src={ep.thumbnail || item.backdropUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                        {/* Play Icon hover */}
                        <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/90 text-[#087EA4] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                        </div>

                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                          S{String(ep.seasonNumber).padStart(2, '0')}E{String(ep.episodeNumber).padStart(2, '0')}
                        </div>

                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[#35C2C8] text-[10px] font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ep.runtime}
                        </div>

                        {/* Progress Bar inside thumbnail */}
                        {progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                            <div
                              className="h-full bg-[#19A7C7]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <h4 className="font-bold text-sm text-[#062B45] group-hover:text-[#087EA4] transition-colors line-clamp-1">
                            {ep.title}
                          </h4>
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Đã xem
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {ep.synopsis}
                        </p>
                      </div>
                    </div>

                    {/* Footer AI Recap preview */}
                    {ep.aiRecap && (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#087EA4]">
                        <span className="flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3" /> AI Recap có sẵn
                        </span>
                        <span className="text-gray-400 group-hover:text-[#087EA4] flex items-center">
                          Chi tiết <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Episode Detail Sub-Modal */}
      {activeEpisodeModal && (
        <EpisodeDetailModal
          series={item}
          episode={activeEpisodeModal}
          onClose={() => setActiveEpisodeModal(null)}
          onPlayEpisode={handlePlayDirect}
          onToggleProgress={(id, pct) => {
            onUpdateEpisodeProgress(id, pct);
            setActiveEpisodeModal((prev) => (prev ? { ...prev, playbackProgress: pct } : null));
          }}
        />
      )}
    </>
  );
};
