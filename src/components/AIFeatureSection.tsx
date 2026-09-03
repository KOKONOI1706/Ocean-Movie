import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle, SlidersHorizontal, Star, Clock, Bookmark, Play, Search } from 'lucide-react';
import { MediaItem } from '../types';
import { CINEMA_ITEMS } from '../data/cinemaData';

interface AIFeatureSectionProps {
  onSelectMedia: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onOpenAISearchModal?: (initialQuery?: string) => void;
  savedItemIds?: string[];
  catalog?: MediaItem[];
}

export const AIFeatureSection: React.FC<AIFeatureSectionProps> = ({
  onSelectMedia,
  onToggleSave,
  onOpenAISearchModal,
  savedItemIds = [],
  catalog = CINEMA_ITEMS
}) => {
  const [activePrompt, setActivePrompt] = useState('Phim buồn nhưng có ending tích cực');
  const [customInput, setCustomInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Interpretation state
  const [understanding, setUnderstanding] = useState({
    mood: 'U uất, trầm lắng & giàu cảm xúc',
    ending: 'Tươi sáng & Giàu hy vọng (Positive Ending)',
    genre: 'Tâm lý / Viễn tưởng nhân văn (Drama / Sci-Fi)',
    pace: 'Chậm rãi, lắng đọng'
  });

  const promptOptions = [
    {
      label: 'Phim buồn nhưng có ending tích cực',
      understanding: {
        mood: 'U uất, trầm lắng & giàu cảm xúc',
        ending: 'Tươi sáng & Giàu hy vọng',
        genre: 'Drama / Sci-Fi',
        pace: 'Chậm rãi, lắng đọng'
      },
      itemIds: ['after-yang', 'interstellar', 'frieren-journey']
    },
    {
      label: 'Tôi chỉ có 30 phút',
      understanding: {
        mood: 'Tập trung, hồi hộp',
        ending: 'Bất ngờ, ấn tượng',
        genre: 'Phim ngắn tuyển chọn',
        pace: 'Dưới 30 phút (Short Film)'
      },
      itemIds: ['the-last-signal', 'son-of-sun', 'chronicle-metropolis']
    },
    {
      label: 'Series bí ẩn nhưng không quá kinh dị',
      understanding: {
        mood: 'Ly kỳ, kích thích trí não',
        ending: 'Hé lộ đa tầng',
        genre: 'Series Mystery / Sci-Fi',
        pace: 'Bí ẩn lôi cuốn'
      },
      itemIds: ['severance', 'dark', 'frieren-journey']
    },
    {
      label: 'Cho tôi phim giống Interstellar',
      understanding: {
        mood: 'Vũ trụ mênh mang & Tình cảm thiêng liêng',
        ending: 'Xúc động trào dâng',
        genre: 'Sci-Fi Epic',
        pace: 'Quy mô lớn, âm hưởng Hans Zimmer'
      },
      itemIds: ['interstellar', 'blade-runner-2049', 'the-last-signal']
    },
    {
      label: 'Nhẹ nhàng để xem trước khi ngủ',
      understanding: {
        mood: 'Thư thái, an yên',
        ending: 'Ấm áp, êm dịu',
        genre: 'Slow Cinema / Slice of Life',
        pace: 'Bình yên, thư giãn'
      },
      itemIds: ['perfect-days', 'frieren-journey', 'spirited-away']
    }
  ];

  const safeCatalog = Array.isArray(catalog) && catalog.length > 0 ? catalog : CINEMA_ITEMS;
  const currentOption = (promptOptions && promptOptions.find((p) => p.label === activePrompt)) || promptOptions[0];

  const matchedItems = (currentOption?.itemIds || [])
    .map((id) => safeCatalog.find((c) => c && c.id === id))
    .filter(Boolean) as MediaItem[];

  const handleSelectPrompt = (option: typeof promptOptions[0]) => {
    setIsLoading(true);
    setActivePrompt(option.label);
    setUnderstanding(option.understanding);
    setTimeout(() => {
      setIsLoading(false);
    }, 250);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    setIsLoading(true);
    setActivePrompt(customInput);

    // Heuristic breakdown for custom query
    const lower = customInput.toLowerCase();
    let m = 'Cảm xúc đa chiều';
    let end = 'Mở hoặc tươi sáng';
    let g = 'Tuyển chọn Biển Phim';
    let p = 'Cân bằng';

    if (lower.includes('buồn')) m = 'U uất, xúc động';
    if (lower.includes('nhẹ nhàng')) m = 'Êm đềm, chữa lành';
    if (lower.includes('tích cực') || lower.includes('vui')) end = 'Tươi sáng & Hy vọng';
    if (lower.includes('anime')) g = 'Anime Nhật Bản';
    if (lower.includes('sci-fi')) g = 'Khoa học viễn tưởng';

    setUnderstanding({ mood: m, ending: end, genre: g, pace: p });

    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return (
    <section className="py-14 sm:py-18 bg-white border-y border-[#087EA4]/15 relative overflow-hidden">
      {/* Background soft ocean glow */}
      <div className="absolute -top-32 right-0 w-96 h-96 bg-[#EAF8FC] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-0 w-96 h-96 bg-[#35C2C8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF8FC] text-[#087EA4] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#19A7C7]" />
            <span>CÔNG NGHỆ KHÁM PHÁ THẾ HỆ MỚI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#062B45] tracking-tight">
            BIỂN PHIM AI
          </h2>
          <p className="text-base text-gray-600">
            Không cần nhớ tên phim. Chỉ cần nói bạn muốn xem gì, AI sẽ định vị hòn đảo phù hợp nhất trong đại dương câu chuyện.
          </p>
        </div>

        {/* Input chips */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-4xl mx-auto mb-6">
          {promptOptions.map((opt, idx) => {
            const isSelected = activePrompt === opt.label;
            return (
              <button
                key={idx}
                onClick={() => handleSelectPrompt(opt)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#087EA4] text-white shadow-md'
                    : 'bg-[#EAF8FC] text-[#062B45] hover:bg-[#19A7C7]/20 border border-[#19A7C7]/20'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Custom prompt input inline */}
        <div className="max-w-xl mx-auto mb-10">
          <form onSubmit={handleCustomSubmit} className="relative flex items-center">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Hoặc gõ mong muốn riêng của bạn..."
              className="w-full pl-4 pr-24 py-2.5 bg-[#FAF8F5] rounded-full border border-gray-200 text-sm text-[#062B45] focus:outline-none focus:border-[#087EA4] focus:ring-2 focus:ring-[#087EA4]/20"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-1.5 rounded-full bg-[#062B45] text-white text-xs font-medium hover:bg-[#087EA4] transition-colors cursor-pointer"
            >
              Phân tích
            </button>
          </form>
        </div>

        {/* AI Interpretation Box (Visible & Transparent) */}
        <div className="bg-[#EAF8FC]/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-[#19A7C7]/30 max-w-4xl mx-auto mb-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#19A7C7]/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#19A7C7] animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-[#062B45] uppercase tracking-wider">
                AI Hiểu Yêu Cầu Của Bạn:
              </span>
            </div>
            <span className="text-xs text-[#087EA4] font-medium italic">
              “{activePrompt}”
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="bg-white p-3 rounded-xl border border-[#19A7C7]/20">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">
                Tâm trạng (Mood)
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#062B45] mt-1 block">
                {understanding.mood}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#19A7C7]/20">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">
                Kết thúc (Ending)
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#087EA4] mt-1 block">
                {understanding.ending}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#19A7C7]/20">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">
                Thể loại (Genre)
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#062B45] mt-1 block">
                {understanding.genre}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#19A7C7]/20">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">
                Nhịp điệu (Pace)
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#062B45] mt-1 block">
                {understanding.pace}
              </span>
            </div>
          </div>

          {onOpenAISearchModal && (
            <div className="mt-4 pt-3 border-t border-[#19A7C7]/20 flex justify-end">
              <button
                onClick={() => onOpenAISearchModal(activePrompt)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087EA4] hover:text-[#062B45] transition-colors cursor-pointer"
              >
                <span>Mở đối thoại chuyên sâu với AI Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {matchedItems.map((item, idx) => {
            const isSaved = savedItemIds.includes(item.id);
            const matchPercentage = 96 - idx * 2;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#087EA4]/15 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group text-left"
              >
                <div>
                  {/* Poster image container with match badge */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={item.backdropUrl || item.posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Match Score Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#087EA4] text-white text-xs font-bold shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {matchPercentage}% phù hợp
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[11px] text-[#35C2C8] font-semibold uppercase tracking-wider block">
                        {item.genres.slice(0, 2).join(' · ')}
                      </span>
                      <h4 className="font-bold text-lg leading-tight line-clamp-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-semibold text-[#062B45]">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        {item.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.runtime}
                      </span>
                      <span>{item.year}</span>
                    </div>

                    {/* AI Reasoning Pill */}
                    <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-100 text-xs text-[#062B45]/85 leading-relaxed">
                      <span className="font-semibold text-[#087EA4] block mb-0.5">
                        Lý do gợi ý:
                      </span>
                      {item.whyYouMayLike ||
                        'Phù hợp vì tác phẩm cân bằng hoàn hảo giữa chiều sâu cảm xúc và tia hy vọng ấm áp ở đoạn kết.'}
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="px-4 sm:px-5 pb-5 pt-1 flex items-center gap-2 border-t border-gray-100">
                  <button
                    onClick={() => onSelectMedia(item)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#087EA4] hover:bg-[#062B45] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Xem chi tiết</span>
                  </button>

                  <button
                    onClick={() => onToggleSave?.(item.id)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-[#EAF8FC] border-[#19A7C7] text-[#087EA4]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    title={isSaved ? 'Đã lưu trong Hải trình' : 'Lưu vào Hải trình'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
