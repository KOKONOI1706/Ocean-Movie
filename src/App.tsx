import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AIFeatureSection } from './components/AIFeatureSection';
import { MovieRail } from './components/MovieRail';
import { ExploreView } from './components/ExploreView';
import { CollectionsView } from './components/CollectionsView';
import { MyCinemaView } from './components/MyCinemaView';
import { MovieDetailModal } from './components/MovieDetailModal';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { AISearchModal } from './components/AISearchModal';
import { WhereToWatchModal } from './components/WhereToWatchModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CreatorDetailModal } from './components/CreatorDetailModal';
import { Footer } from './components/Footer';

import { CINEMA_ITEMS } from './data/cinemaData';
import { INITIAL_USER_TASTE } from './data/collectionsData';
import { MediaItem, SavedMediaItem, Creator } from './types';
import {
  Sparkles,
  Compass,
  Tv,
  Film,
  Moon,
  Zap,
  TrendingUp,
  Heart,
  Layers,
  Waves
} from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('discover');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [seriesModalMedia, setSeriesModalMedia] = useState<MediaItem | null>(null);
  const [watchModalMedia, setWatchModalMedia] = useState<MediaItem | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // Local Storage / State for My Cinema (Watchlist)
  const [savedItems, setSavedItems] = useState<SavedMediaItem[]>([
    { mediaId: 'frieren-journey', savedAt: '2026-03-12', category: 'wishlist' },
    { mediaId: 'blade-runner-2049', savedAt: '2026-03-14', category: 'wishlist' },
    { mediaId: 'the-last-signal', savedAt: '2026-03-15', category: 'wishlist' }
  ]);

  const [userRatings, setUserRatings] = useState<Record<string, number>>({
    interstellar: 9,
    dark: 10,
    'spirited-away': 10,
    'the-last-signal': 9
  });

  const handleOpenSearch = (initialPrompt?: string) => {
    setSearchInitialQuery(initialPrompt || '');
    setIsSearchOpen(true);
  };

  const handleToggleSave = (item: MediaItem) => {
    setSavedItems((prev) => {
      const exists = prev.some((s) => s.mediaId === item.id);
      if (exists) {
        return prev.filter((s) => s.mediaId !== item.id);
      } else {
        return [
          ...prev,
          { mediaId: item.id, savedAt: new Date().toISOString(), category: 'wishlist' }
        ];
      }
    });
  };

  const handleToggleSaveById = (itemId: string) => {
    const item = CINEMA_ITEMS.find((c) => c.id === itemId);
    if (item) handleToggleSave(item);
  };

  const handleRemoveSaved = (mediaId: string) => {
    setSavedItems((prev) => prev.filter((s) => s.mediaId !== mediaId));
  };

  const handleUpdateEpisodeProgress = (episodeId: string, percentage: number) => {
    console.log(`Updated episode ${episodeId} to ${percentage}%`);
  };

  const handleSelectMedia = (item: MediaItem) => {
    if (item.type === 'series' || (item.seasons && item.seasons.length > 0)) {
      setSeriesModalMedia(item);
    } else {
      setSelectedMedia(item);
    }
  };

  const savedItemIds = savedItems.map((s) => s.mediaId);

  // Categorized content rails
  const trendingItems = CINEMA_ITEMS.filter((i) => i.isTrending || i.rating >= 8.6);
  const seriesItems = CINEMA_ITEMS.filter((i) => i.type === 'series');
  const animeItems = CINEMA_ITEMS.filter(
    (i) => i.type === 'anime' || i.genres.includes('Animation')
  );
  const shortFilms = CINEMA_ITEMS.filter(
    (i) => i.type === 'short' || i.runtimeMinutes <= 40
  );
  const aiFilms = CINEMA_ITEMS.filter(
    (i) => i.type === 'ai_film' || i.aiInvolvement?.isAiFilm
  );
  const deepWaterItems = CINEMA_ITEMS.filter(
    (i) => i.moods.includes('philosophical') || i.genres.includes('Mystery')
  );

  const featuredFilm = CINEMA_ITEMS.find((c) => c.id === 'the-last-signal') || CINEMA_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#F6F1E7] text-[#062B45] font-sans flex flex-col antialiased">
      {/* Ocean Cinema Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={handleOpenSearch}
        onOpenProfile={() => setIsProfileOpen(true)}
        savedCount={savedItems.length}
      />

      {/* Main Views */}
      <main className="flex-1">
        {/* TAB: DISCOVER / HOME */}
        {currentTab === 'discover' && (
          <div className="space-y-4">
            {/* Cinematic Hero with AI Search bar */}
            <Hero
              featuredItem={featuredFilm}
              onSelectMedia={handleSelectMedia}
              onTriggerAISearch={handleOpenSearch}
            />

            {/* AI Natural Language Feature Section */}
            <AIFeatureSection
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onOpenAISearchModal={handleOpenSearch}
              savedItemIds={savedItemIds}
              catalog={CINEMA_ITEMS}
            />

            {/* Content Rails */}
            <div className="space-y-2 py-4">
              {/* Rail 1: Sóng Nổi */}
              <MovieRail
                title="Sóng Nổi — Phim Được Quan Tâm Nhất"
                subtitle="Những tác phẩm đang tạo nên làn sóng thảo luận và đánh giá cao trên toàn cầu"
                items={trendingItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => setCurrentTab('explore')}
                savedItemIds={savedItemIds}
                icon={<TrendingUp className="w-5 h-5 text-[#087EA4]" />}
              />

              {/* Rail 2: Series Được Quan Tâm */}
              <MovieRail
                title="Series Nhiều Mùa & Cuốn Hút"
                subtitle="Những hải trình truyền hình kịch tính, lớp lang và khó dứt ra một khi đã bắt đầu"
                items={seriesItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => setCurrentTab('explore')}
                savedItemIds={savedItemIds}
                icon={<Tv className="w-5 h-5 text-[#19A7C7]" />}
              />

              {/* Rail 3: Anime Tuyển Chọn */}
              <MovieRail
                title="Anime Tuyển Chọn — Miền Đất Kỳ Ảo"
                subtitle="Chuyến du ngoạn vào tâm hồn, phép màu kỳ diệu và những câu chuyện lay động"
                items={animeItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => setCurrentTab('explore')}
                savedItemIds={savedItemIds}
                icon={<Sparkles className="w-5 h-5 text-amber-500" />}
              />

              {/* Rail 4: Đảo Ngắn */}
              <MovieRail
                title="Đảo Ngắn — Phim Ngắn Dưới 30 Phút"
                subtitle="Khoảng lặng điện ảnh súc tích cho những buổi tối cần thư giãn nhanh"
                items={shortFilms}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => setCurrentTab('explore')}
                savedItemIds={savedItemIds}
                icon={<Film className="w-5 h-5 text-[#087EA4]" />}
              />

              {/* Rail 5: Biển AI */}
              <MovieRail
                title="Biển AI — Điện Ảnh Kỷ Nguyên Mới"
                subtitle="Các tác phẩm thể nghiệm kết hợp trí tuệ nhân tạo, đồ họa generative và thị giác tương lai"
                items={aiFilms}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => setCurrentTab('explore')}
                savedItemIds={savedItemIds}
                icon={<Zap className="w-5 h-5 text-purple-600" />}
              />

              {/* Rail 6: Vùng Nước Sâu */}
              <MovieRail
                title="Vùng Nước Sâu — Chiêm Nghiệm & Triết Học"
                subtitle="Điện ảnh chậm, giàu ẩn dụ và khơi gợi những suy tư về thời gian và sự hiện hữu"
                items={deepWaterItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => setCurrentTab('explore')}
                savedItemIds={savedItemIds}
                icon={<Moon className="w-5 h-5 text-[#062B45]" />}
              />
            </div>
          </div>
        )}

        {/* TAB: EXPLORE / KHÁM PHÁ */}
        {currentTab === 'explore' && (
          <ExploreView
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* TAB: COLLECTIONS / BỘ SƯU TẬP */}
        {currentTab === 'collections' && (
          <CollectionsView
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* TAB: MY CINEMA / HẢI TRÌNH CỦA TÔI */}
        {currentTab === 'my-cinema' && (
          <MyCinemaView
            savedItems={savedItems}
            userRatings={userRatings}
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onRemoveSaved={handleRemoveSaved}
            onOpenCreator={(creator) => setSelectedCreator(creator)}
          />
        )}
      </main>

      {/* Ocean Cinema Footer */}
      <Footer onNavigate={(tab) => setCurrentTab(tab)} />

      {/* ================= MODALS ================= */}

      {/* Movie Detail Modal */}
      {selectedMedia && (
        <MovieDetailModal
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onSelectMedia={handleSelectMedia}
          onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
          onOpenSeriesDetail={(item) => {
            setSelectedMedia(null);
            setSeriesModalMedia(item);
          }}
          isSaved={savedItemIds.includes(selectedMedia.id)}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* Series Detail Modal */}
      {seriesModalMedia && (
        <SeriesDetailModal
          item={seriesModalMedia}
          onClose={() => setSeriesModalMedia(null)}
          onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
          isSaved={savedItemIds.includes(seriesModalMedia.id)}
          onToggleSave={handleToggleSave}
          onUpdateEpisodeProgress={handleUpdateEpisodeProgress}
        />
      )}

      {/* AI Search Modal */}
      <AISearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(item) => {
          setIsSearchOpen(false);
          handleSelectMedia(item);
        }}
        onOpenWhereToWatch={(item) => {
          setIsSearchOpen(false);
          setWatchModalMedia(item);
        }}
        initialQuery={searchInitialQuery}
      />

      {/* Where to Watch Modal */}
      <WhereToWatchModal
        item={watchModalMedia}
        onClose={() => setWatchModalMedia(null)}
      />

      {/* User Taste Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        tasteProfile={INITIAL_USER_TASTE}
      />

      {/* Creator Detail Modal */}
      <CreatorDetailModal
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
        onSelectMedia={(item) => {
          setSelectedCreator(null);
          handleSelectMedia(item);
        }}
      />
    </div>
  );
}

export default App;
