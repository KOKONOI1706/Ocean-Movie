import React, { useState, useEffect } from 'react';
import { Search, Compass, Sparkles, User, Menu, X, Waves, Film, Tv, Bookmark, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenProfile: () => void;
  savedCount: number;
}

const NAV_ITEMS = [
  { id: 'explore',      label: 'KHÁM PHÁ' },
  { id: 'movies',       label: 'PHIM' },
  { id: 'series',       label: 'SERIES' },
  { id: 'collections',  label: 'BỘ SƯU TẬP' },
  { id: 'ai-discovery', label: 'AI GỢI Ý' },
  { id: 'my-cinema',    label: 'HẢI TRÌNH CỦA TÔI' },
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

  // Deepen navbar background on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 select-none ${
        scrolled
          ? 'bg-[#030A14]/90 backdrop-blur-xl border-b border-cyan-900/20 shadow-2xl'
          : 'bg-gradient-to-b from-[#030A14]/80 via-[#030A14]/40 to-transparent backdrop-blur-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* ─── Left: Brand Logo & Wordmark ─── */}
        <button
          onClick={() => handleNav('discover')}
          className="flex items-center gap-3 cursor-pointer group shrink-0 text-left focus:outline-none"
          aria-label="Về trang chủ Biển Phim"
        >
          {/* Wave Icon */}
          <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:bg-cyan-900/40 transition-all">
            <Waves className="w-4 h-4" />
          </div>
          <span className="font-sans font-bold text-lg tracking-wider text-white group-hover:text-cyan-300 transition-colors uppercase">
            BIỂN PHIM
          </span>
        </button>

        {/* ─── Center: Editorial Navigation Links ─── */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 justify-center"
          role="navigation"
          aria-label="Main Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`relative py-1 text-xs tracking-wider uppercase font-sans font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 font-semibold'
                    : 'text-gray-300/80 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-400 to-cyan-200 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ─── Right: Search & User Profile ─── */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={() => onOpenSearch()}
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Tìm kiếm (⌘K)"
            aria-label="Mở tìm kiếm"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* User Profile Avatar with dropdown arrow */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
            title="Hồ sơ người dùng"
            aria-label="Hồ sơ tài khoản"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-cyan-500/40">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors mr-1" />
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── Mobile Dropdown Menu ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#030A14]/98 border-b border-cyan-900/30 px-6 py-6 space-y-4 backdrop-blur-2xl animate-fade-in text-left">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left text-sm uppercase tracking-wider font-semibold py-2.5 transition-colors ${
                currentTab === item.id ? 'text-cyan-300' : 'text-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider"
            >
              <Search className="w-4 h-4" />
              <span>Tìm kiếm với AI</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="text-xs font-semibold text-gray-400 hover:text-white"
            >
              Hồ sơ của tôi
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
