import React, { useState } from 'react';
import { Sparkles, Play, Plus, Compass, Waves, ArrowRight, Star, Clock, Film } from 'lucide-react';
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

export const Hero: React.FC<HeroProps> = ({
  coverItem,
  featuredItem,
  onSelectMedia,
  onSearchSubmit,
  onTriggerAISearch,
  onToggleSave,
  isSaved = false
}) => {
  const activeItem = coverItem || featuredItem;
  const [query, setQuery] = useState('');

  const quickPrompts = [
    'Một phim sci-fi cảm động dưới 2 tiếng',
    'Series bí ẩn kịch tính một cuối tuần là xong',
    'Phim nhẹ nhàng xem trước khi ngủ',
    'Anime sâu lắng về dòng thời gian',
    'Phim buồn nhưng có ending tích cực'
  ];

  const handleSearch = (searchQuery: string) => {
    if (onTriggerAISearch) {
      onTriggerAISearch(searchQuery);
    } else if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    } else {
      handleSearch('Những bộ phim hay nhất được đề xuất cho bạn');
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#062B45] via-[#087EA4] to-[#19A7C7] text-white">
      {/* Background ambient lighting and subtle wave backdrop */}
      <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80"
          alt="Ocean Horizon"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Decorative calm water ripples & gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#35C2C8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#062B45]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Brand Statement & AI Search Bar */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-[#EAF8FC] shadow-xs">
              <Waves className="w-3.5 h-3.5 text-[#35C2C8]" />
              <span>HẢI TRÌNH ĐIỆN ẢNH VÔ TẬN</span>
              <span className="w-1 h-1 rounded-full bg-[#35C2C8]" />
              <span className="text-white/80">Phiên bản Biển Phim</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white drop-shadow-sm">
                Đại dương điện ảnh. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35C2C8] via-[#EAF8FC] to-white">
                  Tìm câu chuyện của bạn.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[#EAF8FC]/90 max-w-xl font-normal leading-relaxed pt-1">
                Khám phá hàng ngàn bộ phim, series và phim ngắn được tuyển chọn kỹ lưỡng. Mỗi tác phẩm là một hòn đảo kỳ diệu đang chờ bạn cập bến.
              </p>
            </div>

            {/* AI Natural Language Search Box */}
            <div className="pt-2">
              <form
                onSubmit={handleFormSubmit}
                className="bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl shadow-xl border border-white/40 flex flex-col sm:flex-row items-center gap-2 transition-all focus-within:ring-4 focus-within:ring-[#35C2C8]/30"
              >
                <div className="flex items-center gap-3 w-full px-3 py-1">
                  <Sparkles className="w-5 h-5 text-[#087EA4] shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tôi muốn xem gì hôm nay? (VD: sci-fi buồn nhưng có hy vọng...)"
                    className="w-full bg-transparent border-none text-[#062B45] text-sm sm:text-base font-medium placeholder-[#062B45]/45 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:from-[#062B45] hover:to-[#087EA4] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Khám phá cùng AI</span>
                </button>
              </form>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
                <span className="text-[#EAF8FC]/70 font-medium">Gợi ý nhanh:</span>
                {quickPrompts.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(prompt);
                      handleSearch(prompt);
                    }}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[#EAF8FC] transition-colors cursor-pointer text-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Value Props */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/15 text-xs text-[#EAF8FC]/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#35C2C8]" />
                <span>Không cần nhớ tên phim</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#35C2C8]" />
                <span>Định vị nơi xem chính xác</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#35C2C8]" />
                <span>Tóm tắt tập thông minh</span>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Spotlight Card */}
          {activeItem && (
            <div className="lg:col-span-5">
              <div className="relative group rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 shadow-2xl transition-all duration-300 hover:border-white/40">
                {/* Backdrop image */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden shadow-inner mb-4">
                  <img
                    src={activeItem.backdropUrl || activeItem.posterUrl}
                    alt={activeItem.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062B45]/90 via-[#062B45]/30 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#087EA4]/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                      ĐẶC SẮC TUẦN NÀY
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/50 text-[#35C2C8] text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {activeItem.rating}
                    </span>
                  </div>

                  {/* Floating Play Icon */}
                  <button
                    onClick={() => onSelectMedia(activeItem)}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 text-[#062B45] flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 cursor-pointer hover:bg-white"
                    aria-label="Xem chi tiết"
                  >
                    <Play className="w-6 h-6 ml-1 fill-current" />
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="text-xs text-[#35C2C8] font-semibold uppercase tracking-wider">
                      {activeItem.genres.slice(0, 3).join(' · ')}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      {activeItem.title}
                    </h3>
                  </div>
                </div>

                {/* Info & Action bar */}
                <div className="space-y-3 text-left">
                  <p className="text-xs text-[#EAF8FC]/80 line-clamp-2 leading-relaxed">
                    {activeItem.synopsis}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3 text-xs text-[#EAF8FC]/70">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {activeItem.runtime}
                      </span>
                      <span>·</span>
                      <span>{activeItem.year}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {onToggleSave && (
                        <button
                          type="button"
                          onClick={() => onToggleSave(activeItem.id)}
                          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-[#35C2C8] border-[#35C2C8] text-[#062B45]'
                              : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          }`}
                          title={isSaved ? 'Đã lưu trong Hải trình' : 'Thêm vào Hải trình'}
                        >
                          <Plus className={`w-4 h-4 ${isSaved ? 'rotate-45' : ''} transition-transform`} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectMedia(activeItem)}
                        className="px-4 py-2.5 rounded-xl bg-white text-[#062B45] hover:bg-[#EAF8FC] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
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

      {/* Wave bottom transition into page content */}
      <div className="relative w-full overflow-hidden leading-none text-[#F6F1E7]">
        <svg
          className="relative block w-full h-8 sm:h-12 text-[#F6F1E7]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.31,201.2,109.11,241.69,102.13,281.82,83.9,321.39,56.44Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
};
