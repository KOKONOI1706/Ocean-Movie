import React from 'react';
import { Waves } from 'lucide-react';

interface OceanFooterProps {
  onNavigate: (tab: string) => void;
}

export const OceanFooter: React.FC<OceanFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-cyan-950/40 text-gray-400 py-16 px-4 sm:px-6 lg:px-8 relative select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand & Editorial Statement */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Waves className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-wider uppercase">BIỂN PHIM</span>
          </div>
          <p className="font-serif italic text-sm text-cyan-200/60">
            "Những câu chuyện nằm ở mọi độ sâu."
          </p>
          <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
            CINEMATIC OCEAN EXPLORATION PLATFORM · LAT 16°N 108°E
          </span>
        </div>

        {/* Minimal Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs uppercase tracking-wider font-medium">
          <button onClick={() => onNavigate('explore')} className="hover:text-cyan-300 transition-colors cursor-pointer">
            Khám phá
          </button>
          <button onClick={() => onNavigate('movies')} className="hover:text-cyan-300 transition-colors cursor-pointer">
            Phim
          </button>
          <button onClick={() => onNavigate('series')} className="hover:text-cyan-300 transition-colors cursor-pointer">
            Series
          </button>
          <button onClick={() => onNavigate('collections')} className="hover:text-cyan-300 transition-colors cursor-pointer">
            Bộ sưu tập
          </button>
          <button onClick={() => onNavigate('ai-discovery')} className="hover:text-cyan-300 transition-colors cursor-pointer">
            AI Dẫn đường
          </button>
          <button onClick={() => onNavigate('my-cinema')} className="hover:text-cyan-300 transition-colors cursor-pointer">
            Hải trình
          </button>
        </div>

        {/* Legal & Copyright */}
        <div className="text-center md:text-right text-[11px] text-gray-500 space-y-1">
          <div>© {new Date().getFullYear()} BIỂN PHIM. Tất cả quyền được bảo lưu.</div>
          <div className="flex items-center justify-center md:justify-end gap-3 text-[10px]">
            <span className="hover:text-gray-400 cursor-pointer">Điều khoản sử dụng</span>
            <span>·</span>
            <span className="hover:text-gray-400 cursor-pointer">Chính sách bảo mật</span>
            <span>·</span>
            <span className="hover:text-gray-400 cursor-pointer">Nguồn hợp pháp</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
