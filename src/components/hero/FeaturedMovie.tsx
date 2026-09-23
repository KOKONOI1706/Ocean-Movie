import React from 'react';
import { Play, Plus, Check, Sparkles, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MediaItem } from '../../types.js';

interface FeaturedMovieProps {
  item: MediaItem;
  isSaved?: boolean;
  onWatch: () => void;
  onToggleSave?: () => void;
  onTriggerAISearch?: () => void;
}

const MOOD_LABELS: Record<string, string> = {
  philosophical: 'Chiêm nghiệm',
  lonely: 'Trầm lắng',
  restless: 'Cảm xúc mạnh',
  curious: 'Bí ẩn',
  romantics: 'Lãng mạn',
  'night-owls': 'Đêm khuya',
  melancholic: 'U uất',
  hope: 'Hy vọng',
};

function formatRuntime(item: MediaItem): string {
  if (item.runtimeMinutes) return `${item.runtimeMinutes} phút`;
  if (!item.runtime) return '';
  return item.runtime.replace(/\bmin\b/i, 'phút');
}

function moodLabel(mood: string): string {
  return MOOD_LABELS[mood] || mood.replace(/-/g, ' ');
}

export const FeaturedMovie: React.FC<FeaturedMovieProps> = ({
  item,
  isSaved,
  onWatch,
  onToggleSave,
  onTriggerAISearch,
}) => {
  const runtime = formatRuntime(item);
  const genres = (item.genres || []).slice(0, 3).join(' · ');
  const moods = (item.moods || []).slice(0, 4);

  return (
    <div className="relative z-20 max-w-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 sm:space-y-5"
        >
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">
            <span className="h-1 w-1 rounded-full bg-cyan-300" />
            Phim đề xuất cho bạn
          </div>

          <h1
            className="font-serif font-medium text-white leading-[1.05] tracking-tight"
            style={{ fontSize: 'clamp(2.1rem, 5.2vw, 4.4rem)' }}
          >
            {item.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] sm:text-[13px] text-white/70 font-sans">
            <span>{item.year}</span>
            {runtime && (
              <>
                <span className="text-white/30">•</span>
                <span>{runtime}</span>
              </>
            )}
            {item.rating != null && (
              <>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1 text-amber-300/90">
                  <Star className="w-3 h-3 fill-current" />
                  {item.rating.toFixed(1)}/10
                </span>
              </>
            )}
            {genres && (
              <>
                <span className="text-white/30">•</span>
                <span>{genres}</span>
              </>
            )}
          </div>

          <p className="max-w-md text-sm sm:text-[15px] leading-relaxed text-white/65 font-light line-clamp-3">
            {item.synopsis || item.tagline}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onWatch}
              className="inline-flex items-center gap-2 rounded-md bg-[#19A7C7] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#031018] transition-colors hover:bg-[#35C2C8]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Xem ngay
            </button>
            {onToggleSave && (
              <button
                type="button"
                onClick={onToggleSave}
                className="inline-flex items-center gap-2 rounded-md border border-white/18 bg-white/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90 transition-colors hover:border-white/35 hover:bg-white/10"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {isSaved ? 'Đã lưu' : 'Danh sách của tôi'}
              </button>
            )}
            {onTriggerAISearch && (
              <button
                type="button"
                onClick={onTriggerAISearch}
                className="inline-flex items-center gap-1.5 px-2 py-2 text-[11px] font-medium tracking-wide text-cyan-200/80 hover:text-cyan-100"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI gợi ý
              </button>
            )}
          </div>

          {moods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {moods.map((mood) => (
                <span
                  key={mood}
                  className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] tracking-wide text-white/60"
                >
                  {moodLabel(mood)}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
