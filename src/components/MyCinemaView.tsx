import React, { useState, useEffect } from 'react';
import { MediaItem, SavedMediaItem, UserTasteProfile, Creator } from '../types';
import { CINEMA_ITEMS } from '../data/cinemaData';
import { CREATORS_DATA, INITIAL_USER_TASTE } from '../data/collectionsData';
import { progressApi, watchlistApi } from '../lib/api';
import { Compass, Bookmark, Clock, Star, Play, Sparkles, CheckCircle2, UserCheck, ArrowRight, Trash2, Layers } from 'lucide-react';
import { MovieCard } from './MovieCard';

interface MyCinemaViewProps {
  savedItems: SavedMediaItem[];
  userRatings: Record<string, number>;
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  onRemoveSaved: (mediaId: string) => void;
  onOpenCreator: (creator: Creator) => void;
}

export const MyCinemaView: React.FC<MyCinemaViewProps> = ({
  savedItems,
  userRatings,
  onSelectMedia,
  onOpenWhereToWatch,
  onRemoveSaved,
  onOpenCreator
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'continue' | 'list' | 'ratings' | 'creators'>('continue');
  const [tasteProfile] = useState<UserTasteProfile>(INITIAL_USER_TASTE);
  const [followedCreators, setFollowedCreators] = useState<string[]>(['elena-vance', 'baran-bo-odar']);
  const [liveProgress, setLiveProgress] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    progressApi
      .getAll()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setLiveProgress(data);
        }
      })
      .catch((err) => console.warn('Could not load user progress from API:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Continue Watching items with progress (from live database or curated fallbacks)
  const continueWatchingItems = liveProgress.length > 0
    ? liveProgress.map((p) => {
        if (p.episode) {
          const series = p.episode.season?.series;
          const media = CINEMA_ITEMS.find((c) => c.id === series?.slug || c.id === series?.id) || {
            id: series?.slug || p.episode.id,
            title: series?.title || p.episode.title,
            originalTitle: series?.title,
            type: 'series' as const,
            genres: ['Drama', 'Sci-Fi'],
            moods: ['curious'],
            rating: 9.0,
            year: 2026,
            posterUrl: series?.posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
            backdropUrl: series?.backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
            synopsis: p.episode.overview,
            runtime: `${p.episode.runtimeMinutes} min`,
            runtimeMinutes: p.episode.runtimeMinutes,
          };
          return {
            media,
            season: p.episode.season?.seasonNumber || 1,
            episode: p.episode.episodeNumber || 1,
            episodeTitle: p.episode.title,
            progress: p.percentage || 0,
          };
        }
        const movie = p.movie;
        const media = CINEMA_ITEMS.find((c) => c.id === movie?.slug || c.id === movie?.id) || {
          id: movie?.slug || p.id,
          title: movie?.title,
          originalTitle: movie?.title,
          type: 'movie' as const,
          genres: ['Sci-Fi'],
          moods: ['curious'],
          rating: 8.8,
          year: 2026,
          posterUrl: movie?.posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
          backdropUrl: movie?.backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
          synopsis: '',
          runtime: `${movie?.runtimeMinutes || 100} min`,
          runtimeMinutes: movie?.runtimeMinutes || 100,
        };
        return {
          media,
          season: 1,
          episode: 1,
          episodeTitle: media.title,
          progress: p.percentage || 0,
        };
      })
    : [
        {
          media: CINEMA_ITEMS.find((c) => c.id === 'frieren-journey'),
          season: 1,
          episode: 2,
          episodeTitle: 'Không phải vì tôi muốn',
          progress: 85
        },
        {
          media: CINEMA_ITEMS.find((c) => c.id === 'dark'),
          season: 2,
          episode: 4,
          episodeTitle: 'Double Lives',
          progress: 65
        },
        {
          media: CINEMA_ITEMS.find((c) => c.id === 'severance'),
          season: 1,
          episode: 2,
          episodeTitle: 'Half Loop',
          progress: 45
        }
      ].filter((i): i is { media: MediaItem; season: number; episode: number; episodeTitle: string; progress: number } => Boolean(i.media));

  const savedMediaList = (savedItems || [])
    .map((saved) => CINEMA_ITEMS.find((c) => c && c.id === saved.mediaId))
    .filter(Boolean) as MediaItem[];

  const ratedMediaList = (Object.entries(userRatings || {}) as [string, number][])
    .map(([id, rating]) => {
      const media = CINEMA_ITEMS.find((c) => c && c.id === id);
      return media ? { media, rating: Number(rating) } : null;
    })
    .filter(Boolean) as { media: MediaItem; rating: number }[];

  const toggleFollowCreator = (creatorId: string) => {
    setFollowedCreators((prev) =>
      prev.includes(creatorId) ? prev.filter((id) => id !== creatorId) : [...prev, creatorId]
    );
  };

  return (
    <div className="w-full bg-[#F6F1E7] text-[#062B45] py-10 sm:py-14 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Ocean Page Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#087EA4]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF8FC] text-[#087EA4] text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>HẢI TRÌNH ĐIỆN ẢNH CỦA BẠN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#062B45] tracking-tight">
              Hải Trình Của Tôi
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Nơi lưu trữ những hòn đảo câu chuyện bạn đã ghé thăm, các tập phim đang theo dõi và tác giả truyền cảm hứng.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#FAF8F5] p-3 rounded-2xl border border-gray-100 self-start md:self-auto">
            <div className="text-center px-2">
              <span className="text-xl font-bold text-[#062B45] block">
                {savedMediaList.length}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">Đã lưu</span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center px-2">
              <span className="text-xl font-bold text-[#087EA4] block">
                {continueWatchingItems.length}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">Đang xem</span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center px-2">
              <span className="text-xl font-bold text-[#19A7C7] block">
                {ratedMediaList.length || 8}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">Đã đánh giá</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-[#087EA4]/15 pb-2">
          {[
            { id: 'continue', label: `Đang xem dở (${continueWatchingItems.length})` },
            { id: 'list', label: `Danh sách đã lưu (${savedMediaList.length})` },
            { id: 'ratings', label: `Đã xem & Đánh giá (${ratedMediaList.length || 8})` },
            { id: 'creators', label: `Đạo diễn theo dõi (${followedCreators.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-[#087EA4] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-[#EAF8FC] border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SUBTAB: CONTINUE WATCHING */}
        {activeSubTab === 'continue' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#062B45]">
              Tiếp tục hải trình đang dang dở
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {continueWatchingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#087EA4] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    <img
                      src={item.media.backdropUrl || item.media.posterUrl}
                      alt={item.media.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                    <button
                      onClick={() => onSelectMedia(item.media)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 text-[#087EA4] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </button>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                      <div
                        className="h-full bg-[#19A7C7]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[11px] font-bold text-[#087EA4] uppercase tracking-wider block">
                      Mùa {item.season} · Tập {item.episode} ({item.progress}%)
                    </span>
                    <h3 className="font-bold text-sm text-[#062B45] group-hover:text-[#087EA4] transition-colors">
                      {item.episodeTitle}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      Tác phẩm: {item.media.title}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => onSelectMedia(item.media)}
                        className="text-xs font-semibold text-[#087EA4] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem tiếp ngay</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: WATCHLIST */}
        {activeSubTab === 'list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#062B45]">
                Danh sách tác phẩm đã lưu ({savedMediaList.length})
              </h2>
            </div>

            {savedMediaList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {savedMediaList.map((item) => (
                  <div key={item.id} className="relative group">
                    <MovieCard
                      item={item}
                      onSelect={onSelectMedia}
                      onWhereToWatch={onOpenWhereToWatch}
                      isSaved={true}
                    />
                    <button
                      onClick={() => onRemoveSaved(item.id)}
                      className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Bỏ khỏi danh sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300 space-y-3">
                <Bookmark className="w-8 h-8 text-gray-400 mx-auto" />
                <h3 className="font-bold text-base text-gray-700">
                  Hải trình của bạn chưa lưu tác phẩm nào
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Hãy nhấn biểu tượng dấu cộng (+) hoặc nút "Lưu vào Hải trình" tại bất kỳ bộ phim nào để dễ dàng theo dõi lại.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB: RATINGS & HISTORY */}
        {activeSubTab === 'ratings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#062B45]">
              Lịch sử đã xem & Đánh giá cá nhân
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(ratedMediaList.length > 0
                ? ratedMediaList
                : CINEMA_ITEMS.slice(0, 6).map((m, i) => ({ media: m, rating: 9 - (i % 2) }))
              ).map(({ media, rating }, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectMedia(media)}
                  className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-[#087EA4] shadow-xs flex items-center gap-4 cursor-pointer transition-all"
                >
                  <img
                    src={media.posterUrl}
                    alt={media.title}
                    className="w-14 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#062B45] truncate">
                      {media.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {media.year} · {media.genres[0]}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rating} / 10 cá nhân</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: FOLLOWED CREATORS */}
        {activeSubTab === 'creators' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#062B45]">
              Đạo diễn & Nhà làm phim bạn đang theo dõi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CREATORS_DATA.map((creator) => {
                const isFollowed = followedCreators.includes(creator.id);
                return (
                  <div
                    key={creator.id}
                    className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-[#087EA4] shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={creator.portrait}
                        alt={creator.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#19A7C7]/30"
                      />
                      <div>
                        <h3 className="font-bold text-base text-[#062B45]">
                          {creator.name}
                        </h3>
                        <p className="text-xs text-[#087EA4] font-medium">
                          {creator.role}
                        </p>
                        <span className="text-[11px] text-gray-400">
                          {creator.bornLocation}
                        </span >
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 italic">
                      {creator.manifesto}
                    </p>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => onOpenCreator(creator)}
                        className="text-xs font-semibold text-[#087EA4] hover:underline cursor-pointer"
                      >
                        Xem hồ sơ tác giả →
                      </button>

                      <button
                        onClick={() => toggleFollowCreator(creator.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          isFollowed
                            ? 'bg-[#EAF8FC] text-[#087EA4] border border-[#19A7C7]/30'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isFollowed ? 'Đang theo dõi' : '+ Theo dõi'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
