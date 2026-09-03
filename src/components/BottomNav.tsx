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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/97 backdrop-blur-md border-t border-[#087EA4]/12 pb-safe shadow-[0_-4px_20px_rgba(6,43,69,0.08)]"
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#087EA4] to-[#35C2C8] flex items-center justify-center shadow-lg shadow-[#087EA4]/30 group-hover:shadow-[#087EA4]/50 transition-all group-hover:scale-105 group-active:scale-95">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[9px] font-bold text-[#087EA4] mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handlePress(item)}
              className={`relative flex flex-col items-center justify-center flex-1 px-2 py-3 gap-1 cursor-pointer transition-all duration-200 ${
                isActive ? 'text-[#087EA4]' : 'text-[#4A6572] hover:text-[#062B45]'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-[#EAF8FC]' : 'hover:bg-[#F6F1E7]'
              }`}>
                <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                {/* Saved count badge on Hải trình */}
                {item.id === 'my-cinema' && savedCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#087EA4] text-white text-[9px] font-bold flex items-center justify-center">
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-[#087EA4]' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#087EA4]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
