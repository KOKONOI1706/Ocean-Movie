import React, { useState } from 'react';
import { MediaItem, MediaType } from '../types';
import { CINEMA_ITEMS } from '../data/cinemaData';
import { Compass, Filter, Search, Sparkles, Film, Tv, Clock, Star } from 'lucide-react';
import { MovieCard } from './MovieCard';

interface ExploreViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  savedItemIds?: string[];
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onSelectMedia,
  onOpenWhereToWatch,
  onToggleSave,
  savedItemIds = []
}) => {
  const [selectedType, setSelectedType] = useState<'all' | MediaType>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const genres = [
    'all',
    'Sci-Fi',
    'Drama',
    'Mystery',
    'Animation',
    'Romance',
    'Fantasy',
    'Adventure',
    'Thriller'
  ];

  const filteredItems = CINEMA_ITEMS.filter((item) => {
    // Type filter
    if (selectedType !== 'all' && item.type !== selectedType) {
      return false;
    }
    // Genre filter
    if (selectedGenre !== 'all' && !item.genres.includes(selectedGenre)) {
      return false;
    }
    // Search query
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDirector = item.director?.toLowerCase().includes(q);
      const matchGenre = item.genres.some((g) => g.toLowerCase().includes(q));
      const matchSynopsis = item.synopsis?.toLowerCase().includes(q);
      if (!matchTitle && !matchDirector && !matchGenre && !matchSynopsis) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="w-full bg-[#F6F1E7] text-[#062B45] py-10 sm:py-14 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#087EA4]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF8FC] text-[#087EA4] text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>KHO TÀNG ĐIỆN ẢNH VÔ TẬN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#062B45] tracking-tight">
              Khám Phá Biển Phim
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Lọc theo thể loại, định dạng phim, series, anime hoặc thời lượng để tìm kiếm hòn đảo tiếp theo trên hải trình của bạn.
            </p>
          </div>

          {/* Quick Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Tìm tên phim, đạo diễn..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-[#087EA4]"
            />
          </div>
        </div>

        {/* Filters bar */}
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 shrink-0">
              Định dạng:
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'movie', label: 'Phim điện ảnh' },
              { id: 'series', label: 'Series truyền hình' },
              { id: 'anime', label: 'Anime tuyển chọn' },
              { id: 'short', label: 'Phim ngắn (<40p)' },
              { id: 'ai_film', label: 'Phim AI & Generative' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-[#087EA4] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-gray-600 hover:bg-[#EAF8FC] border border-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Genre Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 shrink-0">
              Thể loại:
            </span>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedGenre === g
                    ? 'bg-[#062B45] text-white font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {g === 'all' ? 'Tất cả thể loại' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Movie Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>Tìm thấy {filteredItems.length} tác phẩm</span>
            {(selectedType !== 'all' || selectedGenre !== 'all' || searchFilter) && (
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedGenre('all');
                  setSearchFilter('');
                }}
                className="text-[#087EA4] font-semibold hover:underline cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  onSelect={onSelectMedia}
                  onWhereToWatch={onOpenWhereToWatch}
                  onToggleSave={onToggleSave}
                  isSaved={savedItemIds.includes(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
              <Film className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="font-bold text-base text-gray-700">
                Không tìm thấy tác phẩm phù hợp
              </h3>
              <p className="text-xs text-gray-500">
                Hãy thử nới lỏng từ khóa tìm kiếm hoặc chọn lại thể loại khác.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
