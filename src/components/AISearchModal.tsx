import React, { useState, useEffect } from 'react';
import { MediaItem, MediaType } from '../types';
import { Sparkles, Search, X, Star, Clock, Play, MapPin, SlidersHorizontal, Loader2, ArrowRight } from 'lucide-react';
import { CINEMA_ITEMS } from '../data/cinemaData';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  initialQuery?: string;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onOpenWhereToWatch,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | MediaType>('all');
  const [hasSearched, setHasSearched] = useState(false);

  // Editable AI understanding interpretation
  const [aiUnderstanding, setAiUnderstanding] = useState({
    genre: 'Khoa học viễn tưởng (Sci-Fi)',
    tone: 'Giàu cảm xúc (Emotional)',
    complexity: 'Vừa phải / Tự nhiên',
    similarity: 'Interstellar / After Yang',
    mood: 'Sâu lắng & Khơi gợi',
    ending: 'Tươi sáng / Đọng lại hy vọng',
    pace: 'Chậm rãi, lắng đọng'
  });

  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [curatorNote, setCuratorNote] = useState<string>('');
  const [matchedResults, setMatchedResults] = useState<MediaItem[]>([]);

  const sampleQueries = [
    'Tôi muốn một phim như Interstellar nhưng ít phức tạp hơn',
    'Phim buồn nhưng có ending tích cực',
    'Series bí ẩn, chỉ 1 mùa cuốn hút',
    'Một phim nhẹ nhàng để xem tối nay trước khi ngủ',
    'Anime sâu lắng về ký ức và dòng thời gian',
    'Phim ngắn dưới 30 phút ấn tượng'
  ];

  useEffect(() => {
    if (initialQuery && isOpen) {
      setQuery(initialQuery);
      setHasSearched(false);
      setMatchedResults([]);
      setAiExplanation('');
      setCuratorNote('');
      setAiUnderstanding({
        genre: '',
        tone: '',
        complexity: '',
        similarity: '',
        mood: '',
        ending: '',
        pace: ''
      });
      performSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, isOpen]);

  const performSearch = async (searchQueryText: string) => {
    if (!searchQueryText.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQueryText, filterType: activeFilter })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.aiUnderstanding) {
          setAiUnderstanding(data.aiUnderstanding);
        }
        setAiExplanation(data.explanation || 'Đề xuất dựa trên tâm trạng và thời lượng bạn tìm kiếm.');
        setCuratorNote(data.aiCuratorNote || 'Mỗi bộ phim là một hòn đảo đang chờ bạn ghé thăm.');

        const ids: string[] = data.matchedItemIds || [];
        const found = ids.map((id) => CINEMA_ITEMS.find((c) => c.id === id)).filter(Boolean) as MediaItem[];

        if (found.length === 0) {
          const fallback = CINEMA_ITEMS.filter(
            (c) =>
              c.title.toLowerCase().includes(searchQueryText.toLowerCase()) ||
              c.genres.some((g) => searchQueryText.toLowerCase().includes(g.toLowerCase())) ||
              c.moods.some((m) => searchQueryText.toLowerCase().includes(m.toLowerCase()))
          );
          setMatchedResults(fallback.length > 0 ? fallback : CINEMA_ITEMS.slice(0, 4));
        } else {
          setMatchedResults(found);
        }
      } else {
        throw new Error('Search failed');
      }
    } catch (err) {
      console.warn('API Search error, fallback heuristic:', err);
      // Heuristic fallback
      const lower = searchQueryText.toLowerCase();
      const fallback = CINEMA_ITEMS.filter((item) => {
        if (lower.includes('buồn') || lower.includes('sad')) {
          return item.moods.includes('lonely') || item.genres.includes('Drama');
        }
        if (lower.includes('ngắn') || lower.includes('30 phút')) {
          return item.type === 'short' || item.type === 'ai_film';
        }
        if (lower.includes('series')) {
          return item.type === 'series';
        }
        if (lower.includes('anime')) {
          return item.type === 'anime';
        }
        return true;
      });
      setMatchedResults(fallback.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#060F1A]/90 backdrop-blur-md flex justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#071525] rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6 border border-[#19A7C7]/20 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#19A7C7]/15">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#087EA4] to-[#35C2C8] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#E8F4F8]">
                BIỂN PHIM AI DISCOVERY
              </h2>
              <p className="text-xs text-[#8BA7B8]">
                Tìm phim theo cảm xúc, tình huống, thời lượng hoặc phong cách kể chuyện
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#0C1E2E] hover:bg-[#0A1E30] text-[#8BA7B8] hover:text-[#E8F4F8] transition-colors cursor-pointer border border-[#19A7C7]/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Box */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bạn muốn cảm thấy thế nào hôm nay? (VD: phim buồn nhưng có kết thúc ấm lòng...)"
              className="w-full pl-5 pr-28 py-3.5 bg-[#0C1E2E] rounded-2xl border border-[#19A7C7]/20 text-sm font-medium text-[#E8F4F8] placeholder-[#8BA7B8]/50 focus:outline-none focus:border-[#19A7C7] focus:ring-2 focus:ring-[#19A7C7]/15"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:from-[#062B45] hover:to-[#087EA4] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Tìm kiếm</span>
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-[#8BA7B8]/70 self-center mr-1">Gợi ý:</span>
            {sampleQueries.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(s);
                  performSearch(s);
                }}
                className="px-3 py-1 rounded-full bg-[#0C1E2E] hover:bg-[#0A1E30] border border-[#19A7C7]/20 hover:border-[#19A7C7]/50 text-xs text-[#8BA7B8] hover:text-[#E8F4F8] transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </form>

        {/* AI Interpretation Box (Visible & Editable) */}
        {hasSearched && (
          <div className="bg-[#062B45]/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#19A7C7]/25 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#19A7C7]/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#19A7C7] animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8F4F8]">
                  AI Hiểu Yêu Cầu Của Bạn:
                </h3>
              </div>
              <span className="text-[11px] text-[#35C2C8] font-medium">
                (Có thể chỉnh sửa nhanh bên dưới)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="bg-[#0C1E2E] p-2.5 rounded-xl border border-[#19A7C7]/20">
                <span className="text-[10px] font-bold text-[#8BA7B8] block uppercase">
                  Thể loại (Genre)
                </span>
                <input
                  type="text"
                  value={aiUnderstanding.genre}
                  onChange={(e) =>
                    setAiUnderstanding({ ...aiUnderstanding, genre: e.target.value })
                  }
                  placeholder="Sci-Fi / Drama"
                  className="w-full text-xs font-bold text-[#E8F4F8] bg-transparent border-none p-0 focus:outline-none"
                />
              </div>

              <div className="bg-[#0C1E2E] p-2.5 rounded-xl border border-[#19A7C7]/20">
                <span className="text-[10px] font-bold text-[#8BA7B8] block uppercase">
                  Tông cảm xúc (Tone)
                </span>
                <input
                  type="text"
                  value={aiUnderstanding.tone || aiUnderstanding.mood}
                  onChange={(e) =>
                    setAiUnderstanding({ ...aiUnderstanding, tone: e.target.value })
                  }
                  placeholder="Emotional / Reflective"
                  className="w-full text-xs font-bold text-[#35C2C8] bg-transparent border-none p-0 focus:outline-none"
                />
              </div>

              <div className="bg-[#0C1E2E] p-2.5 rounded-xl border border-[#19A7C7]/20">
                <span className="text-[10px] font-bold text-[#8BA7B8] block uppercase">
                  Độ phức tạp (Complexity)
                </span>
                <input
                  type="text"
                  value={aiUnderstanding.complexity || 'Vừa phải'}
                  onChange={(e) =>
                    setAiUnderstanding({ ...aiUnderstanding, complexity: e.target.value })
                  }
                  placeholder="Thấp / Dễ tiếp nhận"
                  className="w-full text-xs font-bold text-[#E8F4F8] bg-transparent border-none p-0 focus:outline-none"
                />
              </div>

              <div className="bg-[#0C1E2E] p-2.5 rounded-xl border border-[#19A7C7]/20">
                <span className="text-[10px] font-bold text-[#8BA7B8] block uppercase">
                  Tương đồng (Similarity)
                </span>
                <input
                  type="text"
                  value={aiUnderstanding.similarity || 'Điện ảnh chiêm nghiệm'}
                  onChange={(e) =>
                    setAiUnderstanding({ ...aiUnderstanding, similarity: e.target.value })
                  }
                  placeholder="Gần với tác phẩm nào"
                  className="w-full text-xs font-bold text-[#35C2C8] bg-transparent border-none p-0 focus:outline-none"
                />
              </div>
            </div>

            {aiExplanation && (
              <p className="text-xs text-[#8BA7B8] italic pt-1">
                {aiExplanation}
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8BA7B8]">
              Kết quả đề xuất ({matchedResults.length} tác phẩm)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {matchedResults.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-2xl bg-[#0C1E2E] border border-[#19A7C7]/15 hover:border-[#19A7C7]/40 shadow-sm transition-all text-left group"
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-16 h-24 rounded-xl object-cover shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-[#35C2C8]">
                          {item.genres[0]}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-[#E8F4F8]">
                          <Star className="w-3 h-3 text-amber-500 fill-current" />
                          {item.rating}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#E8F4F8] group-hover:text-[#35C2C8] transition-colors truncate">
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-[#8BA7B8] line-clamp-2 leading-relaxed">
                        {item.whyYouMayLike || item.synopsis}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectMedia(item);
                        }}
                        className="px-3 py-1 rounded-lg bg-[#19A7C7] text-white text-xs font-medium hover:bg-[#087EA4] transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onOpenWhereToWatch(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0A1E30] text-[#8BA7B8] hover:text-[#E8F4F8] text-xs font-medium hover:bg-[#0C1E2E] border border-[#19A7C7]/15 transition-colors cursor-pointer"
                      >
                        Nơi xem
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
