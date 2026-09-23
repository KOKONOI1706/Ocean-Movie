import React from 'react';
import { Home, Compass, Sparkles, Navigation, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  savedCount: number;
}

const NAV_ITEMS = [
  { id: 'discover',   label: 'Trang chủ', icon: Home },
  { id: 'explore',    label: 'Khám phá',  icon: Compass },
  { id: 'search',     label: 'AI Tìm',    icon: Sparkles, isSearch: true },
  { id: 'my-cinema',  label: 'Hải trình', icon: Navigation },
  { id: 'profile',    label: 'Hồ sơ',     icon: User, isProfile: true },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenProfile,
  savedCount,
}) => {
  const handlePress = (item: typeof NAV_ITEMS[number]) => {
    if ('isSearch' in item && item.isSearch) {
      onOpenSearch();
    } else if ('isProfile' in item && item.isProfile) {
      onOpenProfile();
    } else {
      onSelectTab(item.id as string);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061826]/95 backdrop-blur-xl border-t border-cyan-900/30 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.5)]"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSearch = 'isSearch' in item && item.isSearch;
          const isProfile = 'isProfile' in item && item.isProfile;
          const isActive = !isSearch && !isProfile && currentTab === item.id;

          // AI Search button is special — elevated circle
          if (isSearch) {
            return (
              <button
                key={item.id}
                onClick={() => handlePress(item)}
                className="flex flex-col items-center justify-center px-3 py-2 gap-0.5 cursor-pointer -mt-4 group"
                aria-label="Tìm kiếm AI"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#087EA4] to-[#35C2C8] flex items-center justify-center shadow-lg shadow-[#087EA4]/40 group-hover:shadow-[#35C2C8]/50 transition-all group-hover:scale-105 group-active:scale-95">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[9px] font-bold text-[#35C2C8] mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handlePress(item)}
              className={`relative flex flex-col items-center justify-center flex-1 px-2 py-3 gap-1 cursor-pointer transition-all duration-200 ${
                isActive ? 'text-[#35C2C8]' : 'text-gray-400 hover:text-white'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-[#35C2C8]/15' : 'hover:bg-white/5'
              }`}>
                <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                {/* Saved count badge on Hải trình */}
                {item.id === 'my-cinema' && savedCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#35C2C8] text-[#030A14] text-[9px] font-bold flex items-center justify-center">
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-[#35C2C8]' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#35C2C8]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
