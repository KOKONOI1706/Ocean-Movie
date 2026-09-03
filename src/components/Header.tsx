import React, { useState, useEffect } from 'react';
import { Search, Compass, Sparkles, User, Menu, X, Waves, Film, Tv, Bookmark } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenProfile: () => void;
  savedCount: number;
}

const NAV_ITEMS = [
  { id: 'discover',     label: 'Trang chủ' },
  { id: 'explore',      label: 'Khám phá' },
  { id: 'movies',       label: 'Phim' },
  { id: 'series',       label: 'Series' },
  { id: 'shorts',       label: 'Phim ngắn' },
  { id: 'ai-films',     label: 'AI Films' },
  { id: 'collections',  label: 'Bộ sưu tập' },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenProfile,
  savedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for elevated header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-[#060F1A]/90 backdrop-blur-md border-b border-[#19A7C7]/15 transition-all duration-300 ${
        scrolled ? 'shadow-lg shadow-[#060F1A]/80' : ''
      }`}
    >
      {/* === TOP ANNOUNCEMENT BAR === */}
      <div className="bg-[#062B45] text-white px-4 sm:px-8 py-1.5 flex justify-between items-center text-xs">
        <div className="flex items-center gap-2 text-[#35C2C8]">
          <Waves className="w-3 h-3" />
          <span className="font-semibold text-[10px] sm:text-xs uppercase tracking-wider">BIỂN PHIM</span>
          <span className="hidden sm:inline text-white/30">·</span>
          <span className="hidden sm:inline text-white/70 text-[11px]">
            Nơi mọi câu chuyện cập bến — Nền tảng khám phá điện ảnh AI
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <button
            onClick={() => onOpenSearch('phim nhẹ nhàng xem tối nay')}
            className="hidden md:inline text-[#35C2C8] hover:text-white transition-colors cursor-pointer font-medium"
          >
            🌊 Gợi ý phim cho tối nay
          </button>
          <span className="hidden md:inline text-white/20">|</span>
          <span className="flex items-center gap-1.5 text-[#35C2C8] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35C2C8] animate-pulse" />
            AI Sẵn sàng
          </span>
        </div>
      </div>

      {/* === MAIN NAVIGATION BAR === */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">

        {/* ─── Logo / Brand ─── */}
        <button
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          onClick={() => handleNav('discover')}
          aria-label="Về trang chủ Biển Phim"
        >
          {/* Logo mark */}
          <div className="relative w-10 h-10 rounded-xl bg-[#062B45] flex items-center justify-center shadow-md overflow-hidden group-hover:bg-[#087EA4] transition-colors duration-300">
            <Waves className="absolute bottom-0.5 w-8 h-5 text-[#19A7C7] opacity-60" />
            <Film className="w-4.5 h-4.5 text-white relative z-10" />
          </div>
          {/* Wordmark */}
          <div className="hidden sm:block">
            <div className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#35C2C8] transition-colors leading-none">
              BIỂN PHIM
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#35C2C8]/70 mt-0.5">
              Oceans of Cinema
            </div>
          </div>
        </button>

        {/* ─── Desktop Navigation (center) ─── */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`relative px-2.5 xl:px-3.5 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-[#35C2C8] bg-[#19A7C7]/15'
                    : 'text-[#8BA7B8] hover:text-[#E8F4F8] hover:bg-[#0C1E2E]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
                {/* Active underline indicator */}
                {isActive && (
                  <span className="absolute bottom-0.5 left-2.5 right-2.5 xl:left-3.5 xl:right-3.5 h-0.5 rounded-full bg-[#35C2C8]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ─── Right Actions ─── */}
        <div className="flex items-center gap-2 ml-auto">
          {/* AI Search CTA */}
          <button
            onClick={() => onOpenSearch()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#0C1E2E] hover:bg-[#19A7C7]/15 border border-[#19A7C7]/25 text-xs sm:text-sm font-semibold text-[#E8F4F8] transition-all cursor-pointer group shadow-xs"
            title="Tìm kiếm bằng AI"
            aria-label="Mở tìm kiếm AI"
          >
            <Sparkles className="w-4 h-4 text-[#087EA4] group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline text-[#E8F4F8]">Tìm với AI</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-[#35C2C8] bg-[#071525] border border-[#19A7C7]/25 rounded-md ml-0.5">
              ⌘K
            </kbd>
          </button>

          {/* Watchlist Button */}
          <button
            onClick={() => handleNav('my-cinema')}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'my-cinema'
                ? 'bg-[#19A7C7]/20 text-[#35C2C8] border border-[#19A7C7]/30'
                : 'text-[#8BA7B8] hover:bg-[#0C1E2E] border border-transparent hover:border-[#19A7C7]/20'
            }`}
            title="Hải trình của tôi"
            aria-label={`Hải trình của tôi — ${savedCount} phim đã lưu`}
          >
            <Compass className={`w-4 h-4 ${currentTab === 'my-cinema' ? 'text-[#35C2C8]' : 'text-[#19A7C7]'}`} />
            <span className="hidden sm:inline">Hải trình</span>
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#087EA4] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {savedCount > 9 ? '9+' : savedCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-xl bg-[#0C1E2E] hover:bg-[#19A7C7]/20 border border-[#19A7C7]/20 flex items-center justify-center text-[#35C2C8] transition-all cursor-pointer hover:shadow-sm"
            title="Hồ sơ người xem"
            aria-label="Xem hồ sơ người xem"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#8BA7B8] hover:bg-[#0C1E2E] transition-colors cursor-pointer border border-[#19A7C7]/15"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* === MOBILE DRAWER MENU === */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#19A7C7]/15 bg-[#071525] px-4 py-4 shadow-lg animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                    isActive
                      ? 'bg-[#19A7C7]/20 text-[#35C2C8] border border-[#19A7C7]/30'
                      : 'bg-[#0C1E2E] text-[#8BA7B8] hover:bg-[#0A1E30] hover:text-[#E8F4F8]'
                  }`}
                >
                  {item.label}
                  {isActive && <span className="ml-2 text-[#35C2C8]">·</span>}                </button>
              );
            })}
          </div>

          {/* Bottom links */}
          <div className="pt-3 mt-3 border-t border-[#19A7C7]/15 flex items-center justify-between text-xs text-[#8BA7B8]">
            <span className="text-[#35C2C8] font-semibold">Biển Phim v2.0</span>
            <button
              onClick={() => { onOpenProfile(); setMobileMenuOpen(false); }}
              className="text-[#35C2C8] font-semibold hover:text-[#E8F4F8] transition-colors cursor-pointer"
            >
              Gu điện ảnh của tôi →
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
