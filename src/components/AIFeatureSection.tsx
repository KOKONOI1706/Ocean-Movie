import React, { useState } from 'react';
import {
  Sparkles, ArrowRight, Brain, Search, Film, Star, Clock, Bookmark, Play,
  CheckCircle, MessageSquare, Zap
} from 'lucide-react';
import { MediaItem } from '../types';
import { CINEMA_ITEMS } from '../data/cinemaData';

interface AIFeatureSectionProps {
  onSelectMedia: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  onOpenAISearchModal?: (initialQuery?: string) => void;
  savedItemIds?: string[];
  catalog?: MediaItem[];
}

// Fixed prompt options with pre-seeded results
const PROMPT_OPTIONS = [
  {
    label: 'Phim buồn nhưng có ending tích cực',
    mood: 'U uất, giàu cảm xúc',
    ending: 'Tươi sáng & Hy vọng',
    genre: 'Drama / Sci-Fi',
    itemIds: ['after-yang', 'interstellar', 'frieren-journey'],
  },
  {
    label: 'Tôi chỉ có 30 phút',
    mood: 'Tập trung, hồi hộp',
    ending: 'Bất ngờ, ấn tượng',
    genre: 'Phim ngắn tuyển chọn',
    itemIds: ['the-last-signal', 'son-of-sun', 'chronicle-metropolis'],
  },
  {
    label: 'Series bí ẩn cuốn hút',
    mood: 'Ly kỳ, kích thích trí não',
    ending: 'Hé lộ đa tầng',
    genre: 'Series Mystery / Sci-Fi',
    itemIds: ['dark', 'severance', 'frieren-journey'],
  },
  {
    label: 'Anime sâu lắng về ký ức',
    mood: 'Hoài niệm, nhẹ nhàng',
    ending: 'Bình yên & Triết học',
    genre: 'Anime / Fantasy',
    itemIds: ['frieren-journey', 'spirited-away', 'after-yang'],
  },
];

// Steps for the "How AI Works" explainer
const AI_STEPS = [
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Bạn nói tự nhiên',
    desc: 'Không cần tên phim. Chỉ cần mô tả cảm xúc, tình huống hoặc loại câu chuyện bạn muốn.',
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: 'AI phân tích & hiểu',
    desc: 'AI trích xuất tâm trạng, thể loại, nhịp phim và kết thúc bạn mong muốn.',
  },
  {
    icon: <Film className="w-5 h-5" />,
    title: 'Đề xuất có giải thích',
    desc: 'Bạn nhận được phim phù hợp cùng lý do AI chọn — không phải hộp đen.',
  },
];

export const AIFeatureSection: React.FC<AIFeatureSectionProps> = ({
  onSelectMedia,
  onToggleSave,
  onOpenAISearchModal,
  savedItemIds = [],
  catalog = CINEMA_ITEMS,
}) => {
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const activeOption = PROMPT_OPTIONS[activePromptIdx];

  const recommendedItems = activeOption.itemIds
    .map((id) => catalog.find((c) => c.id === id))
    .filter(Boolean) as MediaItem[];

  return (
    <section className="bg-[#062B45] py-14 sm:py-20 relative overflow-hidden" aria-labelledby="ai-section-title">
      {/* Background decorative ocean circles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#087EA4]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#35C2C8]/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Section Header ─── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#087EA4]/20 border border-[#35C2C8]/20 text-[#35C2C8] text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            BIỂN PHIM AI DISCOVERY
          </div>
          <h2
            id="ai-section-title"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3"
          >
            Tìm phim bằng{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35C2C8] to-[#EAF8FC]">
              ngôn ngữ tự nhiên
            </span>
          </h2>
          <p className="text-[#87CEDB] max-w-xl mx-auto text-sm leading-relaxed">
            Không cần biết tên phim. Chỉ cần nói điều bạn cảm thấy hoặc đang tìm kiếm.
          </p>
        </div>

        {/* ─── How It Works: 3 Steps ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {AI_STEPS.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#35C2C8]/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#087EA4]/30 flex items-center justify-center text-[#35C2C8] shrink-0">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#35C2C8] uppercase tracking-wider">
                    Bước {idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                <p className="text-xs text-[#87CEDB] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Live Demo ─── */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-[#35C2C8] animate-pulse" />
            <span className="text-xs font-bold text-[#35C2C8] uppercase tracking-wider">Demo trực tiếp</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Prompt selector */}
            <div className="lg:col-span-5 space-y-3">
              <p className="text-sm text-white/80 font-medium mb-3">
                Thử một trong những yêu cầu sau:
              </p>
              {PROMPT_OPTIONS.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePromptIdx(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    activePromptIdx === idx
                      ? 'bg-[#087EA4] border-[#19A7C7] text-white shadow-lg shadow-[#087EA4]/25'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="flex items-start gap-3">
                    {activePromptIdx === idx ? (
                      <CheckCircle className="w-4 h-4 text-[#35C2C8] shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-white/25 shrink-0 mt-0.5" />
                    )}
                    "{opt.label}"
                  </span>
                </button>
              ))}

              {/* Open AI Search */}
              <button
                onClick={() => onOpenAISearchModal?.()}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#35C2C8] to-[#19A7C7] text-[#062B45] font-bold text-sm hover:from-[#19A7C7] hover:to-[#087EA4] hover:text-white transition-all cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nhập câu hỏi của riêng bạn</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: AI output */}
            <div className="lg:col-span-7 space-y-4">
              {/* AI Understanding chips */}
              <div className="bg-black/20 rounded-2xl p-4 border border-white/8">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-[#35C2C8]" />
                  <span className="text-xs font-bold text-[#35C2C8] uppercase tracking-wider">
                    AI hiểu yêu cầu của bạn:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Tâm trạng', value: activeOption.mood },
                    { label: 'Kết thúc', value: activeOption.ending },
                    { label: 'Thể loại', value: activeOption.genre },
                  ].map((chip, idx) => (
                    <div key={idx} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                      <span className="text-[9px] font-bold text-[#35C2C8] uppercase block">{chip.label}</span>
                      <span className="text-xs font-semibold text-white">{chip.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended results */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  Kết quả đề xuất ({recommendedItems.length} tác phẩm)
                </p>
                {recommendedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-[#35C2C8]/30 hover:bg-white/10 transition-all group cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                    onClick={() => onSelectMedia(item)}
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-12 h-16 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-[#35C2C8] uppercase">{item.genres[0]}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-bold">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {item.rating}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#35C2C8] transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-white/55 line-clamp-1 mt-0.5">
                        {item.whyYouMayLike || item.synopsis}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectMedia(item); }}
                        className="px-3 py-1.5 rounded-lg bg-[#087EA4] hover:bg-[#19A7C7] text-white text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>
                      {onToggleSave && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSave(item.id); }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            savedItemIds.includes(item.id)
                              ? 'bg-[#35C2C8] text-[#062B45]'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {savedItemIds.includes(item.id) ? '✓ Đã lưu' : '+ Lưu'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
