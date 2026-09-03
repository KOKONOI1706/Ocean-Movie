import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Plus, Compass, Waves, ArrowRight, Star, Clock, Film, ChevronDown } from 'lucide-react';
import { MediaItem } from '../types';

interface HeroProps {
  coverItem?: MediaItem;
  featuredItem?: MediaItem;
  onSelectMedia: (item: MediaItem) => void;
  onSearchSubmit?: (query: string) => void;
  onTriggerAISearch?: (query: string) => void;
  onToggleSave?: (id: string) => void;
  isSaved?: boolean;
}

const QUICK_PROMPTS = [
  'Một phim sci-fi cảm động dưới 2 tiếng',
  'Series bí ẩn, chỉ 1 mùa',
  'Phim nhẹ nhàng xem trước khi ngủ',
  'Anime sâu lắng về dòng thời gian',
];

const OCEAN_STATS = [
  { value: '2,400+', label: 'Tác phẩm điện ảnh' },
  { value: '98%', label: 'Độ chính xác AI' },
  { value: '40+', label: 'Nguồn phát bản quyền' },
];

export const Hero: React.FC<HeroProps> = ({
  coverItem,
  featuredItem,
  onSelectMedia,
  onSearchSubmit,
  onTriggerAISearch,
  onToggleSave,
  isSaved = false,
}) => {
  const activeItem = coverItem || featuredItem;
  const [query, setQuery] = useState('');
  const [activePrompt, setActivePrompt] = useState(-1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (searchQuery: string) => {
    if (onTriggerAISearch) onTriggerAISearch(searchQuery);
    else if (onSearchSubmit) onSearchSubmit(searchQuery);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query.trim() || 'Những bộ phim hay nhất được đề xuất cho bạn');
  };

  return (
    <div className="relative overflow-hidden bg-[#060F1A]">
      {/* === BACKGROUND LAYER: Ocean horizon photo with soft overlay === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sky/Ocean photo – very light opacity */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=75"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-[0.35]"
          loading="eager"
          fetchPriority="high"
        />
        {/* Deep dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060F1A]/95 via-[#071525]/85 to-[#041E30]/90" />
        {/* Left blue accent glow */}
        <div className="absolute -left-40 top-0 w-[600px] h-[600px] rounded-full bg-[#087EA4]/8 opacity-60 blur-[120px]" />
        {/* Right turquoise glow */}
        <div className="absolute -right-20 top-20 w-[400px] h-[400px] rounded-full bg-[#35C2C8]/10 blur-[100px]" />
      </div>

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ─── LEFT COLUMN: Brand + AI Search ─── */}
          <div className="lg:col-span-7 space-y-7 text-left py-8 lg:py-12">
            {/* Brand eyebrow pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0C1E2E] border border-[#19A7C7]/30 text-xs font-semibold text-[#35C2C8] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35C2C8] animate-pulse" />
              <Waves className="w-3.5 h-3.5" />
              <span>AI DISCOVERY — BIỂN PHIM</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-[#E8F4F8]">
                Nơi mọi câu chuyện{' '}
                <span className="text-gradient-ocean">cập bến.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#8BA7B8] max-w-lg font-normal leading-relaxed">
                Khám phá phim, series và những câu chuyện phù hợp với bạn —{' '}
                <span className="font-semibold text-[#35C2C8]">với sức mạnh của AI.</span>
              </p>
            </div>

            {/* ─── AI SEARCH BOX ─── */}
            <div className="space-y-3">
              <form
                onSubmit={handleFormSubmit}
                className={`relative bg-[#0C1E2E] rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                  isSearchFocused
                    ? 'border-[#19A7C7] shadow-[0_0_0_4px_rgba(25,167,199,0.12)]'
                    : 'border-[#19A7C7]/20 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 p-3 sm:p-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#087EA4] to-[#35C2C8] flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActivePrompt(-1); }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Bạn muốn xem gì hôm nay? (VD: sci-fi buồn nhưng có hy vọng...)"
                    className="flex-1 bg-transparent border-none text-[#E8F4F8] text-sm sm:text-base font-medium placeholder-[#8BA7B8]/60 focus:outline-none min-w-0"
                    aria-label="Tìm kiếm phim bằng AI"
                  />
                  <button
                    type="submit"
                    className="shrink-0 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:from-[#062B45] hover:to-[#087EA4] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Khám phá cùng AI</span>
                    <span className="sm:hidden">Tìm</span>
                  </button>
                </div>
              </form>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#8BA7B8]/70 font-medium">Gợi ý:</span>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(prompt);
                      setActivePrompt(idx);
                      handleSearch(prompt);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${
                      activePrompt === idx
                        ? 'bg-[#087EA4] text-white border-[#087EA4] shadow-sm'
                        : 'bg-[#0C1E2E] text-[#8BA7B8] border-[#19A7C7]/20 hover:border-[#19A7C7] hover:text-[#E8F4F8]'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Strip */}
            <div className="flex items-center gap-6 sm:gap-8 pt-2 border-t border-[#19A7C7]/10">
              {OCEAN_STATS.map((stat, idx) => (
                <div key={idx} className="text-left">
                  <p className="text-xl font-extrabold text-[#E8F4F8] leading-none">{stat.value}</p>
                  <p className="text-xs text-[#8BA7B8] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Featured Film Spotlight ─── */}
          {activeItem && (
            <div className="lg:col-span-5 flex justify-center lg:justify-end py-6 lg:py-10">
              <div
                className="relative group w-full max-w-sm lg:max-w-none rounded-2xl overflow-hidden bg-[#0C1E2E] shadow-2xl border border-[#19A7C7]/15 cursor-pointer transition-all duration-500 hover:shadow-[0_24px_60px_rgba(25,167,199,0.15)] hover:-translate-y-1"
                onClick={() => onSelectMedia(activeItem)}
              >
                {/* Backdrop image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={activeItem.backdropUrl || activeItem.posterUrl}
                    alt={activeItem.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="eager"
                  />
                  {/* Cinematic gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062B45]/95 via-[#062B45]/30 to-transparent" />

                  {/* Top badges row */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-[#087EA4]/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      ĐẶC SẮC TUẦN NÀY
                    </span>
                    <div className="rating-badge">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{activeItem.rating}</span>
                    </div>
                  </div>

                  {/* Play button overlay */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectMedia(activeItem); }}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/95 text-[#062B45] flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:bg-white cursor-pointer z-10"
                    aria-label={`Xem chi tiết ${activeItem.title}`}
                  >
                    <Play className="w-6 h-6 ml-1 fill-current" />
                  </button>

                  {/* Bottom meta on image */}
                  <div className="absolute bottom-3 left-4 right-4 text-left">
                    <p className="text-[11px] text-[#35C2C8] font-bold uppercase tracking-wider mb-1">
                      {activeItem.genres.slice(0, 2).join(' · ')}
                    </p>
                    <h2 className="text-xl font-extrabold text-white leading-snug">
                      {activeItem.title}
                    </h2>
                  </div>
                </div>

                {/* Card info row */}
                <div className="p-4 bg-[#0C1E2E]">
                  <p className="text-xs text-[#8BA7B8] line-clamp-2 leading-relaxed mb-3">
                    {activeItem.synopsis}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-[#8BA7B8]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#19A7C7]" />
                        {activeItem.runtime}
                      </span>
                      <span className="text-[#19A7C7]/30">·</span>
                      <span>{activeItem.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onToggleSave && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onToggleSave(activeItem.id); }}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-[#35C2C8] border-[#35C2C8] text-[#062B45]'
                              : 'bg-[#0A1E30] border-[#19A7C7]/30 text-[#8BA7B8] hover:bg-[#19A7C7]/10'
                          }`}
                          title={isSaved ? 'Đã lưu' : 'Thêm vào Hải trình'}
                        >
                          <Plus className={`w-3.5 h-3.5 ${isSaved ? 'rotate-45' : ''} transition-transform`} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelectMedia(activeItem); }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] text-white hover:from-[#062B45] hover:to-[#087EA4] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === WAVE BOTTOM TRANSITION === */}
      <div className="relative w-full overflow-hidden leading-none" style={{ height: '60px' }}>
        {/* Double wave layers for depth */}
        <svg
          className="absolute bottom-0 w-[200%] h-full text-white/50"
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="animate-wave-fast"
            d="M0,30 C150,60 350,0 600,30 C850,60 1050,0 1200,30 L1200,60 L0,60 Z"
            fill="rgba(8, 126, 164, 0.06)"
          />
        </svg>
        <svg
          className="absolute bottom-0 w-[200%] h-full"
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="animate-wave-slow"
            d="M0,20 C200,50 400,0 600,25 C800,50 1000,5 1200,20 L1200,60 L0,60 Z"
            fill="#071525"
          />
        </svg>
      </div>
    </div>
  );
};
