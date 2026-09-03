import React, { useState } from 'react';
import { Search, Compass, Sparkles, User, Menu, X, Waves, Film, Tv, Play, Bookmark } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenProfile: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenProfile,
  savedCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'discover', label: 'Trang chủ' },
    { id: 'explore', label: 'Khám phá' },
    { id: 'movies', label: 'Phim' },
    { id: 'series', label: 'Series' },
    { id: 'anime', label: 'Anime' },
    { id: 'shorts', label: 'Phim ngắn' },
    { id: 'ai-films', label: 'AI Films' },
    { id: 'collections', label: 'Bộ sưu tập' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#087EA4]/15 shadow-sm transition-all">
      {/* Ocean announcement / atmosphere sub-bar */}
      <div className="bg-[#EAF8FC] text-[#062B45] border-b border-[#19A7C7]/20 px-4 sm:px-8 py-1 flex justify-between items-center text-xs font-medium">
        <div className="flex items-center gap-2 text-[#087EA4]">
          <Waves className="w-3.5 h-3.5 text-[#19A7C7] animate-pulse" />
          <span className="hidden sm:inline font-semibold">BIỂN PHIM</span>
          <span className="hidden sm:inline text-gray-400">·</span>
          <span className="text-[11px] sm:text-xs text-[#062B45]/80">Nơi mọi câu chuyện cập bến — Tuyển chọn điện ảnh thư thái</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#087EA4]">
          <button
            onClick={() => onOpenSearch('phim cho đêm khuya')}
            className="hidden md:inline hover:underline text-[#087EA4] hover:text-[#062B45] cursor-pointer"
          >
            🌊 Gợi ý: Phim cho đêm khuya
          </button>
          <span className="hidden md:inline text-gray-300">|</span>
          <span className="flex items-center gap-1 font-semibold text-[#087EA4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35C2C8] animate-ping" />
            AI Discovery Sẵn Sàng
          </span>
        </div>
      </div>

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => {
            onSelectTab('discover');
            setMobileMenuOpen(false);
          }}
        >
          {/* Logo symbol: Ocean wave with cinema spark */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#062B45] via-[#087EA4] to-[#35C2C8] p-0.5 shadow-md flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#062B45] rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <Waves className="w-5 h-5 text-[#35C2C8] absolute -bottom-0.5 opacity-70" />
              <Film className="w-4 h-4 text-white relative z-10" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-extrabold text-xl sm:text-2xl tracking-tight text-[#062B45] group-hover:text-[#087EA4] transition-colors">
                BIỂN PHIM
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#19A7C7]" />
            </div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-[#087EA4]/80 hidden sm:block">
              Oceans of Cinema
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#087EA4] text-white shadow-sm'
                    : 'text-[#062B45]/80 hover:text-[#062B45] hover:bg-[#EAF8FC]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Search Bar trigger button */}
          <button
            onClick={() => onOpenSearch()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#EAF8FC] hover:bg-[#19A7C7]/20 border border-[#19A7C7]/30 text-xs sm:text-sm font-medium text-[#062B45] transition-all group cursor-pointer shadow-xs"
            title="Tìm kiếm bằng ngôn ngữ tự nhiên"
          >
            <Sparkles className="w-4 h-4 text-[#087EA4] group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Tìm với AI...</span>
            <span className="sm:hidden">Tìm</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-[#087EA4] bg-white border border-[#19A7C7]/30 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Watchlist / Hải Trình */}
          <button
            onClick={() => onSelectTab('my-cinema')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer relative ${
              currentTab === 'my-cinema'
                ? 'bg-[#062B45] text-white shadow-sm'
                : 'text-[#062B45] hover:bg-[#EAF8FC] border border-transparent'
            }`}
            title="Hải trình phim của bạn"
          >
            <Compass className="w-4 h-4 text-[#19A7C7]" />
            <span className="hidden sm:inline">Hải trình</span>
            {savedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#087EA4] text-white text-[11px] font-bold flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={onOpenProfile}
            className="p-2 rounded-full text-[#062B45] hover:bg-[#EAF8FC] transition-colors cursor-pointer border border-[#087EA4]/20"
            title="Hồ sơ người xem"
          >
            <User className="w-4 h-4 text-[#087EA4]" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#062B45] hover:bg-[#EAF8FC] transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#087EA4]/15 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2 pb-3">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                    isActive
                      ? 'bg-[#087EA4] text-white font-semibold'
                      : 'bg-[#EAF8FC]/60 text-[#062B45] hover:bg-[#EAF8FC]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Biển Phim v2.0 — Đại dương điện ảnh</span>
            <button
              onClick={() => {
                onOpenProfile();
                setMobileMenuOpen(false);
              }}
              className="text-[#087EA4] font-semibold"
            >
              Xem gu điện ảnh của tôi →
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
