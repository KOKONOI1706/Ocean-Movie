import React from 'react';
import { Waves, Compass, ShieldCheck, Heart, Globe, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#062B45] text-white pt-14 pb-10 text-left border-t border-[#087EA4]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#087EA4] to-[#35C2C8] flex items-center justify-center shadow-md">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                BIỂN PHIM
              </span>
            </div>

            <p className="text-base text-[#35C2C8] font-medium italic">
              “Nơi mọi câu chuyện cập bến.”
            </p>

            <p className="text-xs text-gray-300 max-w-md leading-relaxed font-normal">
              Biển Phim là nền tảng khám phá điện ảnh lấy cảm hứng từ đại dương bao la. Chúng tôi đồng hành cùng bạn tìm kiếm những hòn đảo câu chuyện giàu cảm xúc thông qua hệ thống định vị thông minh và bản đồ cảm xúc AI.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-[#35C2C8]" />
              <span>Chỉ liên kết nguồn phát bản quyền chính thức.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#35C2C8]">
              Hải Trình Khám Phá
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button
                  onClick={() => onNavigate?.('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Trang chủ & Sóng nổi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('explore')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Khám phá toàn bộ phim & Series
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('collections')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Quần đảo tuyển chọn (Collections)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('my-cinema')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Hải trình của tôi (Đã lưu & Đang xem)
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#35C2C8]">
              Vùng Biển Đặc Biệt
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#19A7C7]" />
                <span>Đảo Ngắn: Phim ngắn 15 - 30 phút cuối tuần</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Biển AI: Điện ảnh generative & thử nghiệm</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Vùng Nước Sâu: Phim độc lập & chiêm nghiệm triết học</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                <span>Anime Tuyển Chọn: Thế giới kỳ ảo & sâu sắc</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© 2026 BIỂN PHIM (Ocean Cinema). All rights reserved.</p>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#35C2C8]" />
              Tiếng Việt (Vietnam)
            </span>
            <span>·</span>
            <span>Điều khoản dịch vụ</span>
            <span>·</span>
            <span>Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
