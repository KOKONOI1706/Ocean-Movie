import React from 'react';
import { Waves, Compass, ShieldCheck, Globe, Sparkles, Mail, Film } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#062B45] text-white relative overflow-hidden">
      {/* Wave top separator */}
      <div className="relative w-full overflow-hidden leading-none" style={{ height: '60px', marginTop: '-1px' }}>
        <svg
          className="absolute top-0 w-[200%] h-full"
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,30 C200,60 400,0 600,25 C800,50 1000,5 1200,20 L1200,0 L0,0 Z"
            fill="#060F1A"
          />
        </svg>
      </div>

      {/* Subtle background glows */}
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-[#087EA4]/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#35C2C8]/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-12">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Brand column */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#087EA4] to-[#35C2C8] flex items-center justify-center shadow-lg relative overflow-hidden">
                <Waves className="absolute bottom-0.5 w-9 h-5 text-white opacity-40" />
                <Film className="w-5 h-5 text-white relative z-10" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
                  BIỂN PHIM
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#35C2C8]/80">
                  Oceans of Cinema
                </span>
              </div>
            </div>

            <p className="text-base text-[#35C2C8] font-medium italic leading-snug">
              "Nơi mọi câu chuyện cập bến."
            </p>

            <p className="text-xs text-gray-300 max-w-sm leading-relaxed font-normal">
              Biển Phim là nền tảng khám phá điện ảnh lấy cảm hứng từ đại dương bao la.
              AI đồng hành cùng bạn tìm kiếm những câu chuyện phù hợp — phim, series, anime hay
              những tác phẩm AI generative tiên phong.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#35C2C8]">
              <ShieldCheck className="w-4 h-4" />
              <span>Chỉ liên kết nguồn phát bản quyền chính thức.</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Sparkles className="w-4 h-4 text-[#35C2C8]" />
              <span>Hệ thống AI Discovery sử dụng Gemini.</span>
            </div>
          </div>

          {/* Navigation links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#35C2C8]">
              Hải Trình Khám Phá
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              {[
                { tab: 'discover',    label: 'Trang chủ & Sóng nổi' },
                { tab: 'explore',     label: 'Khám phá tất cả phim' },
                { tab: 'collections', label: 'Bộ sưu tập tuyển chọn' },
                { tab: 'my-cinema',   label: 'Hải trình của tôi' },
              ].map((link) => (
                <li key={link.tab}>
                  <button
                    onClick={() => onNavigate?.(link.tab)}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35C2C8]/40 group-hover:bg-[#35C2C8] transition-colors" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Ocean zones */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#35C2C8]">
              Vùng Biển Đặc Biệt
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              {[
                { dot: 'bg-[#35C2C8]',  label: 'Đảo Ngắn: Phim ngắn 15–30 phút' },
                { dot: 'bg-purple-400', label: 'Biển AI: Điện ảnh generative' },
                { dot: 'bg-amber-400',  label: 'Vùng Nước Sâu: Phim triết học' },
                { dot: 'bg-blue-300',   label: 'Anime Tuyển Chọn: Thế giới kỳ ảo' },
                { dot: 'bg-[#19A7C7]',  label: 'Series Cuốn Hút: Binge-worthy' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shrink-0`} />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 BIỂN PHIM — Ocean Cinema. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#35C2C8]" />
              Tiếng Việt (Việt Nam)
            </span>
            <button className="hover:text-white transition-colors cursor-pointer">Điều khoản</button>
            <button className="hover:text-white transition-colors cursor-pointer">Bảo mật</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
