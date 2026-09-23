import React from 'react';
import { Creator, MediaItem } from '../types';
import { CINEMA_ITEMS } from '../data/cinemaData';
import { X, Sparkles, Film, ArrowRight, UserCheck, Compass } from 'lucide-react';

interface CreatorDetailModalProps {
  creator: Creator | null;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
}

export const CreatorDetailModal: React.FC<CreatorDetailModalProps> = ({
  creator,
  onClose,
  onSelectMedia
}) => {
  if (!creator) return null;

  const catalogFilms = (creator.filmographyIds || [])
    .map((id) => CINEMA_ITEMS.find((c) => c && c.id === id))
    .filter(Boolean) as MediaItem[];

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#030B14]/85 backdrop-blur-xl flex justify-center p-4 text-[#E8F4F8] animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#071728]/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(8,126,164,0.2)] overflow-hidden my-auto p-6 sm:p-8 space-y-6 border border-[#35C2C8]/25 text-left">
        {/* Top bar */}
        <div className="flex items-start justify-between pb-4 border-b border-[#19A7C7]/20">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 text-[11px] font-bold uppercase tracking-wider block w-fit mb-1.5">
              HỒ SƠ TÁC GIẢ & ĐẠO DIỄN
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {creator.name}
            </h2>
            <span className="text-xs text-[#8BA7B8] block mt-0.5">
              {creator.role} · {creator.bornLocation} ({creator.birthYear})
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

        {/* Portrait & Bio Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] border-2 border-[#35C2C8]/30">
              <img
                src={creator.portrait}
                alt={creator.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="bg-gradient-to-br from-[#087EA4]/20 via-[#0B2035]/60 to-[#071728]/80 p-4 rounded-2xl border border-[#35C2C8]/30 shadow-[0_0_20px_rgba(8,126,164,0.1)]">
              <span className="text-[10px] font-bold text-[#35C2C8] uppercase tracking-wider block mb-1">
                Tuyên ngôn nghệ thuật
              </span>
              <p className="text-xs sm:text-sm text-cyan-100 font-medium italic leading-relaxed">
                “{creator.manifesto}”
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#8BA7B8] leading-relaxed">
              {creator.biography}
            </p>

            <div className="flex items-center gap-4 text-xs text-[#8BA7B8] pt-1">
              <span className="flex items-center gap-1 font-semibold text-[#35C2C8]">
                <Compass className="w-3.5 h-3.5" />
                {creator.notableAwards}
              </span>
            </div>
          </div>
        </div>

        {/* Filmography on Biển Phim */}
        <div className="space-y-3 pt-4 border-t border-[#19A7C7]/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#35C2C8]/80">
            Tác phẩm có trên Biển Phim ({catalogFilms.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catalogFilms.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onClose();
                  onSelectMedia(item);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl border border-[#19A7C7]/20 bg-[#0B2035]/50 hover:bg-[#0F2A45]/70 hover:border-[#35C2C8]/50 transition-all cursor-pointer group shadow-xs hover:shadow-[0_0_15px_rgba(8,126,164,0.2)]"
              >
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-12 h-16 rounded-xl object-cover shrink-0 border border-[#19A7C7]/20"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white group-hover:text-[#35C2C8] transition-colors truncate">
                    {item.title}
                  </h4>
                  <span className="text-xs text-[#8BA7B8] block">
                    {item.year} · {item.runtime}
                  </span>
                  <span className="text-[11px] text-[#35C2C8] font-medium block truncate">
                    {item.genres.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
