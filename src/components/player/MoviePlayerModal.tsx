import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MediaItem } from '../../types';
import { VideoPlayer } from './VideoPlayer';

interface MoviePlayerModalProps {
  item: MediaItem;
  onClose: () => void;
}

/** Full-screen in-app player for a single film with an aggregated stream. */
export const MoviePlayerModal: React.FC<MoviePlayerModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#03182A]/95 backdrop-blur-md text-white flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — trình phát`}
    >
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10 shrink-0">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#35C2C8]">
            {item.type === 'ai_film' ? 'Phim AI' : 'Phim'} · {item.year}
          </div>
          <div className="text-sm sm:text-base font-bold truncate">{item.title}</div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer shrink-0"
          aria-label="Đóng trình phát"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex items-start lg:items-center justify-center p-0 sm:p-6">
        <div className="w-full max-w-6xl space-y-4">
          <div className="sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <VideoPlayer src={item.streamUrl || ''} type={item.streamType} poster={item.backdropUrl} title={item.title} />
          </div>
          {(item.synopsis || item.sourceName) && (
            <div className="px-4 sm:px-0 pb-4 space-y-1">
              {item.synopsis && <p className="text-sm text-white/75 leading-relaxed">{item.synopsis}</p>}
              {item.sourceName && <p className="text-[11px] text-white/40">Nguồn: {item.sourceName}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
