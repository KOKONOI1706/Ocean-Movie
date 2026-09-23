import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ListVideo, X } from 'lucide-react';
import { Episode, MediaItem } from '../../types';
import { VideoPlayer } from './VideoPlayer';
import { EpisodeSelector } from './EpisodeSelector';

interface SeriesPlayerModalProps {
  series: MediaItem;
  initialEpisode: Episode;
  onClose: () => void;
  onUpdateEpisodeProgress?: (episodeId: string, percentage: number) => void;
}

const code = (ep: Episode) =>
  `S${String(ep.seasonNumber).padStart(2, '0')}E${String(ep.episodeNumber).padStart(2, '0')}`;

/**
 * In-app series player. Picking an episode swaps the stream source in place,
 * so binge-watching never leaves the page or reloads it.
 */
export const SeriesPlayerModal: React.FC<SeriesPlayerModalProps> = ({
  series,
  initialEpisode,
  onClose,
  onUpdateEpisodeProgress,
}) => {
  const seasons = series.seasons || [];
  const playable = useMemo(
    () => seasons.flatMap((s) => s.episodes || []).filter((ep) => ep.streamUrl),
    [seasons]
  );

  const [current, setCurrent] = useState<Episode>(initialEpisode);
  const [browsingSeason, setBrowsingSeason] = useState(initialEpisode.seasonNumber);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [autoNext, setAutoNext] = useState(true);

  const index = playable.findIndex((ep) => ep.id === current.id);
  const prev = index > 0 ? playable[index - 1] : undefined;
  const next = index >= 0 && index < playable.length - 1 ? playable[index + 1] : undefined;

  const selectEpisode = useCallback((ep: Episode) => {
    setCurrent(ep);
    setBrowsingSeason(ep.seasonNumber);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Shift+N / Shift+P, like YouTube; plain arrows are left to the <video> element.
      if (e.shiftKey && e.key.toLowerCase() === 'n' && next) selectEpisode(next);
      if (e.shiftKey && e.key.toLowerCase() === 'p' && prev) selectEpisode(prev);
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, next, prev, selectEpisode]);

  const handleProgress = (pct: number) => {
    setProgress((p) => ({ ...p, [current.id]: pct }));
    onUpdateEpisodeProgress?.(current.id, pct);
  };

  // Overlay local progress so the selector reflects what was just watched.
  const seasonsWithProgress = useMemo(
    () =>
      seasons.map((s) => ({
        ...s,
        episodes: (s.episodes || []).map((ep) =>
          progress[ep.id] !== undefined ? { ...ep, playbackProgress: progress[ep.id] } : ep
        ),
      })),
    [seasons, progress]
  );

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#03182A]/95 backdrop-blur-md text-white flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${series.title} — trình phát`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10 shrink-0">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#35C2C8] truncate">{series.title}</div>
          <div className="text-sm sm:text-base font-bold truncate">
            {code(current)} · {current.title}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer shrink-0"
          aria-label="Đóng trình phát"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Player column */}
        <div className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto p-0 sm:p-4 lg:p-6 space-y-4">
          <div className="sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <VideoPlayer
              src={current.streamUrl || ''}
              type={current.streamType}
              poster={current.thumbnail || series.backdropUrl}
              title={`${series.title} ${code(current)}`}
              startAtPercent={progress[current.id] ?? current.playbackProgress}
              onProgress={handleProgress}
              onEnded={() => {
                if (autoNext && next) selectEpisode(next);
              }}
            />
          </div>

          <div className="px-4 sm:px-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                disabled={!prev}
                onClick={() => prev && selectEpisode(prev)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Tập trước
              </button>
              <button
                disabled={!next}
                onClick={() => next && selectEpisode(next)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                Tập tiếp <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(e) => setAutoNext(e.target.checked)}
                className="accent-[#19A7C7]"
              />
              Tự động phát tập tiếp theo
            </label>
          </div>

          {(current.synopsis || current.sourceName) && (
            <div className="px-4 sm:px-0 pb-4 space-y-1">
              {current.synopsis && <p className="text-sm text-white/75 leading-relaxed">{current.synopsis}</p>}
              {current.sourceName && <p className="text-[11px] text-white/40">Nguồn: {current.sourceName}</p>}
            </div>
          )}
        </div>

        {/* Episode list */}
        <aside className="lg:w-[360px] lg:shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 p-4 flex flex-col lg:min-h-0 max-h-[70vh] lg:max-h-none">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 pb-3 shrink-0">
            <ListVideo className="w-4 h-4" /> Danh sách tập · {playable.length} có thể phát
          </div>
          <EpisodeSelector
            seasons={seasonsWithProgress}
            activeSeasonNumber={browsingSeason}
            activeEpisodeId={current.id}
            onSelectSeason={setBrowsingSeason}
            onSelectEpisode={selectEpisode}
          />
        </aside>
      </div>
    </div>
  );
};
