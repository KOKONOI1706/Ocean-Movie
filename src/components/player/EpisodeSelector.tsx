import React, { useEffect, useRef } from 'react';
import { Check, Lock, Play, Radio } from 'lucide-react';
import { Episode, Season } from '../../types';

interface EpisodeSelectorProps {
  seasons: Season[];
  activeSeasonNumber: number;
  activeEpisodeId: string;
  onSelectSeason: (seasonNumber: number) => void;
  onSelectEpisode: (episode: Episode) => void;
}

export const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  seasons,
  activeSeasonNumber,
  activeEpisodeId,
  onSelectSeason,
  onSelectEpisode,
}) => {
  const season = seasons.find((s) => s.seasonNumber === activeSeasonNumber) || seasons[0];
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeEpisodeId, activeSeasonNumber]);

  return (
    <div className="flex flex-col min-h-0 h-full">
      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 shrink-0" role="tablist" aria-label="Chọn mùa">
          {seasons.map((s) => {
            const selected = s.seasonNumber === season?.seasonNumber;
            return (
              <button
                key={s.seasonNumber}
                role="tab"
                aria-selected={selected}
                onClick={() => onSelectSeason(s.seasonNumber)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selected ? 'bg-[#19A7C7] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {s.title || `Mùa ${s.seasonNumber}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Number grid for quick jumps in long series */}
      {(season?.episodes.length || 0) > 12 && (
        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-1.5 pb-3 shrink-0">
          {season!.episodes.map((ep) => {
            const active = ep.id === activeEpisodeId;
            const playable = Boolean(ep.streamUrl);
            return (
              <button
                key={ep.id}
                disabled={!playable}
                onClick={() => onSelectEpisode(ep)}
                aria-label={`Tập ${ep.episodeNumber}`}
                aria-current={active ? 'true' : undefined}
                className={`h-8 rounded-md text-xs font-bold transition-colors ${
                  active
                    ? 'bg-[#19A7C7] text-white'
                    : playable
                      ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                {ep.episodeNumber}
              </button>
            );
          })}
        </div>
      )}

      <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1" aria-label="Danh sách tập">
        {season?.episodes.map((ep) => {
          const active = ep.id === activeEpisodeId;
          const playable = Boolean(ep.streamUrl);
          const done = (ep.playbackProgress || 0) >= 95;
          return (
            <li key={ep.id}>
              <button
                ref={active ? activeRef : undefined}
                disabled={!playable}
                onClick={() => onSelectEpisode(ep)}
                aria-current={active ? 'true' : undefined}
                className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${
                  active
                    ? 'bg-[#19A7C7]/20 ring-1 ring-[#19A7C7]'
                    : playable
                      ? 'hover:bg-white/10 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-white/10 shrink-0">
                  {ep.thumbnail && (
                    <img
                      src={ep.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    {active ? (
                      <Radio className="w-4 h-4 text-[#35C2C8] animate-pulse" />
                    ) : playable ? (
                      <Play className="w-4 h-4 text-white fill-current" />
                    ) : (
                      <Lock className="w-4 h-4 text-white/70" />
                    )}
                  </div>
                  {(ep.playbackProgress || 0) > 0 && (
                    <div className="absolute bottom-0 inset-x-0 h-0.5 bg-black/50">
                      <div className="h-full bg-[#19A7C7]" style={{ width: `${ep.playbackProgress}%` }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#35C2C8]">
                    Tập {ep.episodeNumber}
                    {ep.streamType && <span className="ml-1.5 text-white/40">{ep.streamType.toUpperCase()}</span>}
                  </div>
                  <div className={`text-xs font-semibold line-clamp-2 ${active ? 'text-white' : 'text-white/85'}`}>
                    {ep.title}
                  </div>
                </div>
                {done && <Check className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Đã xem" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
