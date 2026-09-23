import React from 'react';
import { MediaItem } from '../types';
import { X, Search } from 'lucide-react';

interface TrailerPlayerModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onFindWhereToWatch: (item: MediaItem) => void;
}

export const TrailerPlayerModal: React.FC<TrailerPlayerModalProps> = ({ item, onClose, onFindWhereToWatch }) => {
  if (!item || !item.trailerYoutubeId) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#030B14]/85 backdrop-blur-xl flex justify-center p-4 text-[#E8F4F8] animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#071728]/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(8,126,164,0.2)] overflow-hidden my-auto border border-[#35C2C8]/25 text-left">
        <div className="flex items-start justify-between p-6 sm:p-8 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 text-[11px] font-bold uppercase tracking-wider block w-fit mb-1.5">
              TRAILER CHÍNH THỨC
            </span>
            <h2 className="text-2xl font-extrabold text-white leading-tight">{item.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-cyan-200/80 hover:text-white border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer shrink-0"
            title="Đóng"
            aria-label="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          <iframe
            className="h-full w-full"
            // The `origin` param must match the page's own origin — YouTube's
            // embed player uses it to validate the postMessage handshake and
            // otherwise fails immediately with "Error 153".
            src={`https://www.youtube.com/embed/${item.trailerYoutubeId}?autoplay=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
            title={`${item.title} — Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="p-6 sm:p-8 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[#8BA7B8] leading-relaxed">
            Đây là trailer chính thức. Để xem trọn bộ phim, hãy tìm nguồn phát hợp pháp.
          </p>
          <button
            onClick={() => onFindWhereToWatch(item)}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tìm nơi xem phim đầy đủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
