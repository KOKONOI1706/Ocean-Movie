import React, { useState, useEffect } from 'react';
import { MediaItem, MediaType } from '../types';
import { CINEMA_ITEMS } from '../data/cinemaData';
import { moviesApi, seriesApi } from '../lib/api';
import {
  Compass, Search, Sparkles, Film, Tv, Clock, Star,
  X, Waves, SlidersHorizontal, LayoutGrid, List, Loader2
} from 'lucide-react';
import { MovieCard } from './MovieCard';

interface ExploreViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  savedItemIds?: string[];
  initialType?: 'all' | MediaType;
}

const TYPE_FILTERS = [
  { id: 'all',         label: 'Tất cả',             icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'movie',       label: 'Phim điện ảnh',       icon: <Film className="w-3.5 h-3.5" /> },
  { id: 'series',      label: 'Series',              icon: <Tv className="w-3.5 h-3.5" /> },
  { id: 'anime',       label: 'Anime',               icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'short',       label: 'Phim ngắn',           icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'ai_film',     label: 'AI Films',            icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'documentary', label: 'Tài liệu',            icon: <Film className="w-3.5 h-3.5" /> },
];

const GENRES = ['Sci-Fi', 'Drama', 'Mystery', 'Animation', 'Romance', 'Fantasy', 'Adventure', 'Thriller', 'Horror'];

const MOODS = [
  { id: 'all', label: 'Tất cả tâm trạng' },
  { id: 'restless', label: 'Kịch tính & Hồi hộp' },
  { id: 'lonely', label: 'Trầm lắng & Độc thoại' },
  { id: 'curious', label: 'Bí ẩn & Trí tuệ' },
  { id: 'romantics', label: 'Lãng mạn & Duyên nợ' },
  { id: 'night-owls', label: 'Phim cho đêm khuya' },
  { id: 'philosophical', label: 'Triết học & Vùng nước sâu' },
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  onSelectMedia,
  onOpenWhereToWatch,
  onToggleSave,
  savedItemIds = [],
  initialType = 'all',
}) => {
  const [catalogItems, setCatalogItems] = useState<MediaItem[]>(CINEMA_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | MediaType>(initialType);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        setIsLoading(true);
        const [moviesRes, seriesRes] = await Promise.all([
          moviesApi.getAll({ limit: 50 }),
          seriesApi.getAll({ limit: 50 }),
        ]);
        if (isMounted) {
          const combined = [...(moviesRes.items || []), ...(seriesRes.items || [])];
          if (combined.length > 0) {
            setCatalogItems(combined);
          }
        }
      } catch (err) {
        console.warn('Could not fetch catalog from API, falling back to local dataset:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Progressive filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [runtimeFilter, setRuntimeFilter] = useState<'all' | 'under40' | 'under120' | 'over120'>('all');
  const [yearFilter, setYearFilter] = useState<'all' | 'new' | 'modern' | 'classic'>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [aiFilter, setAiFilter] = useState<'all' | 'ai_only' | 'human_only'>('all');

  // Keep type in sync with initialType from parent tabs
  React.useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedGenres([]);
    setSearchFilter('');
    setMinRating(0);
    setRuntimeFilter('all');
    setYearFilter('all');
    setSelectedMood('all');
    setAiFilter('all');
  };

  const advancedFilterCount =
    (minRating > 0 ? 1 : 0) +
    (runtimeFilter !== 'all' ? 1 : 0) +
    (yearFilter !== 'all' ? 1 : 0) +
    (selectedMood !== 'all' ? 1 : 0) +
    (aiFilter !== 'all' ? 1 : 0);

  const hasFilters =
    selectedType !== 'all' ||
    selectedGenres.length > 0 ||
    searchFilter.trim() !== '' ||
    advancedFilterCount > 0;

  const filteredItems = catalogItems.filter((item) => {
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (selectedGenres.length > 0 && !selectedGenres.some((g) => item.genres.includes(g))) return false;
    if (minRating > 0 && item.rating < minRating) return false;

    // Runtime filter
    if (runtimeFilter === 'under40' && item.runtimeMinutes > 40) return false;
    if (runtimeFilter === 'under120' && item.runtimeMinutes > 120) return false;
    if (runtimeFilter === 'over120' && item.runtimeMinutes < 120) return false;

    // Year filter
    if (yearFilter === 'new' && item.year < 2025) return false;
    if (yearFilter === 'modern' && (item.year < 2020 || item.year > 2024)) return false;
    if (yearFilter === 'classic' && item.year >= 2020) return false;

    // Mood filter
    if (selectedMood !== 'all' && !item.moods?.includes(selectedMood)) return false;

    // AI filter
    if (aiFilter === 'ai_only' && item.type !== 'ai_film' && !item.aiInvolvement?.isAiFilm) return false;
    if (aiFilter === 'human_only' && (item.type === 'ai_film' || item.aiInvolvement?.isAiFilm)) return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.director?.toLowerCase().includes(q) ||
        item.genres.some((g) => g.toLowerCase().includes(q)) ||
        item.synopsis?.toLowerCase().includes(q) ||
        item.cast?.some((c) => c.toLowerCase().includes(q)) ||
        item.moods?.some((m) => m.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#060F1A] text-[#E8F4F8]">
      {/* ─── Page Header ─── */}
      <div className="bg-[#071525] border-b border-[#19A7C7]/15 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C1E2E] text-[#35C2C8] text-xs font-bold uppercase tracking-wider mb-3 border border-[#19A7C7]/20">
                <Compass className="w-3.5 h-3.5" />
                KHÁM PHÁ BIỂN PHIM
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#E8F4F8] mb-2">
                Toàn bộ tác phẩm
              </h1>
              <p className="text-sm text-[#8BA7B8] max-w-lg">
                Lọc theo thể loại, định dạng, hoặc tìm tên phim. Mọi hòn đảo điện ảnh đều nằm ở đây.
              </p>
            </div>

            {/* Search bar */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#8BA7B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm tên phim, đạo diễn, thể loại..."
                className="w-full pl-10 pr-10 py-3 bg-[#0C1E2E] border border-[#19A7C7]/20 rounded-2xl text-sm font-medium text-[#E8F4F8] placeholder-[#8BA7B8]/50 focus:outline-none focus:border-[#19A7C7] focus:ring-2 focus:ring-[#19A7C7]/15 transition-all"
                aria-label="Tìm kiếm phim"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#8BA7B8] hover:text-[#E8F4F8] cursor-pointer"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ─── Filter Panel ─── */}
        <div className="bg-[#071525] rounded-2xl border border-[#19A7C7]/15 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#19A7C7]/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#E8F4F8]">
              <SlidersHorizontal className="w-4 h-4 text-[#35C2C8]" />
              Bộ lọc
              {hasFilters && (
                <span className="px-2 py-0.5 rounded-full bg-[#19A7C7] text-white text-[10px] font-bold">
                  Đang lọc
                </span>
              )}
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#35C2C8] hover:text-[#E8F4F8] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="px-5 py-4 border-b border-[#19A7C7]/8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA7B8] mb-3">Định dạng</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-[#19A7C7] text-white shadow-sm'
                      : 'bg-[#0C1E2E] text-[#8BA7B8] hover:bg-[#0A1E30] hover:text-[#E8F4F8] border border-[#19A7C7]/15 hover:border-[#19A7C7]/40'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre filter */}
          <div className="px-5 py-4 border-b border-[#19A7C7]/8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA7B8] mb-3">Thể loại</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    selectedGenres.includes(g)
                      ? 'bg-[#062B45] text-[#35C2C8] border border-[#19A7C7]/40 shadow-sm'
                      : 'bg-[#0C1E2E] text-[#8BA7B8] hover:bg-[#0A1E30] hover:text-[#E8F4F8] border border-[#19A7C7]/15 hover:border-[#19A7C7]/30'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Progressive Filters Toggle */}
          <div className="px-5 py-3 bg-[#0C1E2E]/60 flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-xs font-semibold text-[#35C2C8] hover:text-white transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvancedFilters ? 'Thu gọn bộ lọc nâng cao' : 'Mở rộng bộ lọc nâng cao (Rating, Năm, Thời lượng, Mood, AI)'}</span>
              {advancedFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#19A7C7] text-white text-[10px] font-bold">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            {advancedFilterCount > 0 && (
              <span className="text-[11px] text-[#8BA7B8]">Đang áp dụng {advancedFilterCount} tiêu chí</span>
            )}
          </div>

          {/* Progressive Filters Content */}
          {showAdvancedFilters && (
            <div className="p-5 bg-[#050E18]/70 border-t border-[#19A7C7]/15 space-y-4 animate-fade-in text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Rating filter */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA7B8] mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" /> Đánh giá tối thiểu
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { val: 0, label: 'Tất cả' },
                      { val: 8.0, label: '★ 8.0+' },
                      { val: 8.5, label: '★ 8.5+' },
                      { val: 9.0, label: '★ 9.0+' },
                    ].map((r) => (
                      <button
                        key={r.val}
                        onClick={() => setMinRating(r.val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          minRating === r.val
                            ? 'bg-[#19A7C7] text-white font-bold'
                            : 'bg-[#0C1E2E] text-[#8BA7B8] hover:text-[#E8F4F8] border border-[#19A7C7]/15'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Runtime filter */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA7B8] mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#19A7C7]" /> Thời lượng
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'under40', label: '< 40 phút' },
                      { id: 'under120', label: '< 2 tiếng' },
                      { id: 'over120', label: '> 2 tiếng' },
                    ].map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => setRuntimeFilter(rt.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          runtimeFilter === rt.id
                            ? 'bg-[#19A7C7] text-white font-bold'
                            : 'bg-[#0C1E2E] text-[#8BA7B8] hover:text-[#E8F4F8] border border-[#19A7C7]/15'
                        }`}
                      >
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year filter */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA7B8] mb-2">
                    Năm phát hành
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'new', label: 'Mới 2025–2026' },
                      { id: 'modern', label: '2020–2024' },
                      { id: 'classic', label: 'Trước 2020' },
                    ].map((yf) => (
                      <button
                        key={yf.id}
                        onClick={() => setYearFilter(yf.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          yearFilter === yf.id
                            ? 'bg-[#19A7C7] text-white font-bold'
                            : 'bg-[#0C1E2E] text-[#8BA7B8] hover:text-[#E8F4F8] border border-[#19A7C7]/15'
                        }`}
                      >
                        {yf.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI involvement */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA7B8] mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Nguồn gốc AI
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'ai_only', label: 'Chỉ phim AI' },
                      { id: 'human_only', label: 'Phim truyền thống' },
                    ].map((af) => (
                      <button
                        key={af.id}
                        onClick={() => setAiFilter(af.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          aiFilter === af.id
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-[#0C1E2E] text-[#8BA7B8] hover:text-[#E8F4F8] border border-[#19A7C7]/15'
                        }`}
                      >
                        {af.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mood Filter */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA7B8] mb-2">
                  Tâm trạng & Cảm xúc (Mood)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMood(m.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        selectedMood === m.id
                          ? 'bg-[#35C2C8] text-[#062B45] font-bold shadow-xs'
                          : 'bg-[#0C1E2E] text-[#8BA7B8] hover:text-[#E8F4F8] border border-[#19A7C7]/15'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Results Header ─── */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#8BA7B8]">
            {filteredItems.length > 0 ? (
              <>
                <span className="text-[#35C2C8] font-extrabold">{filteredItems.length}</span>
                {' '}tác phẩm{hasFilters ? ' phù hợp' : ' trong Biển Phim'}
              </>
            ) : (
              'Không tìm thấy tác phẩm phù hợp'
            )}
          </p>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#071525] rounded-xl border border-[#19A7C7]/15">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#19A7C7]/20 text-[#35C2C8]' : 'text-[#8BA7B8] hover:text-[#E8F4F8]'
              }`}
              aria-label="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#19A7C7]/20 text-[#35C2C8]' : 'text-[#8BA7B8] hover:text-[#E8F4F8]'
              }`}
              aria-label="Dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Grid / Empty State ─── */}
        {filteredItems.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'space-y-3'
          }>
            {filteredItems.map((item) =>
              viewMode === 'grid' ? (
                <MovieCard
                  key={item.id}
                  item={item}
                  onSelect={onSelectMedia}
                  onWhereToWatch={onOpenWhereToWatch}
                  onToggleSave={onToggleSave}
                  isSaved={savedItemIds.includes(item.id)}
                />
              ) : (
                /* List view row */
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-[#0C1E2E] rounded-2xl border border-[#19A7C7]/15 hover:border-[#19A7C7]/40 cursor-pointer transition-all group shadow-sm"
                  onClick={() => onSelectMedia(item)}
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-14 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-[#35C2C8] uppercase">{item.type}</span>
                      <span className="text-[10px] text-[#8BA7B8]">{item.year}</span>
                    </div>
                    <h3 className="font-bold text-sm text-[#E8F4F8] group-hover:text-[#35C2C8] transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#8BA7B8] line-clamp-2 mt-0.5">{item.synopsis}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {item.rating}
                    </div>
                    <span className="text-xs text-[#8BA7B8]">{item.runtime}</span>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-[#0C1E2E] rounded-3xl py-16 text-center border border-[#19A7C7]/15 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#0A1E30] flex items-center justify-center mx-auto mb-4">
              <Waves className="w-7 h-7 text-[#19A7C7]" />
            </div>
            <h3 className="font-bold text-lg text-[#E8F4F8] mb-2">
              Biển Phim chưa tìm thấy câu chuyện phù hợp
            </h3>
            <p className="text-sm text-[#8BA7B8] mb-5 max-w-xs mx-auto">
              Hãy thử nới lỏng bộ lọc hoặc sử dụng AI để tìm kiếm tự nhiên hơn.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-[#19A7C7] text-white font-semibold text-sm hover:bg-[#087EA4] transition-colors cursor-pointer"
            >
              Xóa bộ lọc & thử lại
            </button>
          </div>
        )}

        {/* Bottom padding for mobile bottom nav */}
        <div className="h-20 lg:h-0" />
      </div>
    </div>
  );
};
