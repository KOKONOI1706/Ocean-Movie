import React, { useState, useEffect } from 'react';
import { Search, Waves, User, Menu, X, CircleUser, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenProfile?: () => void;
  savedCount: number;
}

const NAV_ITEMS = [
  { id: 'discover',     label: 'KHÁM PHÁ' },
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
  const { user } = useAuth();
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

  const handleAuthClick = () => {
    if (user) {
      if (onOpenProfile) {
        onOpenProfile();
      } else {
        onSelectTab('my-cinema');
      }
    } else {
      onSelectTab('auth');
    }
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
        {/* Left: Brand Logo & Wordmark */}
        <button
          onClick={() => handleNav('discover')}
          className="flex items-center gap-3 cursor-pointer group shrink-0 text-left focus:outline-none"
          aria-label="Về trang chủ Biển Phim"
        >
          {/* Wave Icon */}
          <div className="w-9 h-9 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:bg-cyan-900/40 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
            <Waves className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-extrabold text-base sm:text-lg tracking-wider text-white group-hover:text-cyan-300 transition-colors uppercase leading-none">
              BIỂN PHIM
            </span>
            <span className="text-[10px] text-cyan-400/80 font-medium tracking-widest uppercase mt-0.5">
              OCEAN CINEMA
            </span>
          </div>
        </button>

        {/* Center: Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-5 lg:gap-7 justify-center"
          role="navigation"
          aria-label="Main Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`relative py-1.5 text-xs tracking-wider uppercase font-sans font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 font-bold'
                    : 'text-slate-300/80 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Search & User Auth */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={() => onOpenSearch()}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white bg-[#061527]/60 hover:bg-[#09223e] border border-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer shadow-md"
            title="Tìm kiếm phim AI"
            aria-label="Mở tìm kiếm"
          >
            <Search className="w-4 h-4 text-cyan-400" />
          </button>

          {/* User Auth / Profile Button */}
          {user ? (
            <button
              onClick={handleAuthClick}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-[#05162b]/80 hover:bg-[#082244] border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer group shadow-lg shadow-black/40"
              title={`Hồ sơ: ${user.displayName || user.username || 'Thành viên'}`}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-cyan-400/40 bg-cyan-950 flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CircleUser className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 max-w-[100px] truncate hidden sm:inline">
                {user.displayName || user.username || 'Hồ sơ'}
              </span>
            </button>
          ) : (
            <button
              onClick={handleAuthClick}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-400/40 hover:border-cyan-300 text-xs font-semibold text-cyan-200 hover:text-white transition-all cursor-pointer shadow-md shadow-cyan-950/40"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Đăng Nhập</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#020914]/98 border-b border-cyan-900/30 px-6 py-6 space-y-4 backdrop-blur-2xl animate-fade-in text-left">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left text-sm uppercase tracking-wider font-semibold py-2.5 transition-colors ${
                currentTab === item.id ? 'text-cyan-300 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-cyan-900/40 flex items-center justify-between">
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
              onClick={handleAuthClick}
              className="text-xs font-semibold text-slate-300 hover:text-cyan-300"
            >
              {user ? (user.displayName || 'Hồ sơ của tôi') : 'Đăng nhập / Đăng ký'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
