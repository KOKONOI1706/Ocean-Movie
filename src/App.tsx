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
import { BottomNav } from './components/BottomNav';
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
  Waves,
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

  // Watchlist state (using unified 'category' field matching SavedMediaItem)
  const [savedItems, setSavedItems] = useState<SavedMediaItem[]>([
    { mediaId: 'frieren-journey',  savedAt: '2026-03-12', category: 'wishlist' },
    { mediaId: 'blade-runner-2049', savedAt: '2026-03-14', category: 'wishlist' },
    { mediaId: 'the-last-signal',  savedAt: '2026-03-15', category: 'wishlist' },
  ]);

  const [userRatings, setUserRatings] = useState<Record<string, number>>({
    interstellar:        9,
    dark:                10,
    'spirited-away':     10,
    'the-last-signal':   9,
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
      }
      return [
        ...prev,
        { mediaId: item.id, savedAt: new Date().toISOString(), category: 'wishlist' },
      ];
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

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savedItemIds = savedItems.map((s) => s.mediaId);

  // ─── Categorized content rails ───
  const trendingItems    = CINEMA_ITEMS.filter((i) => i.isTrending || i.rating >= 8.6);
  const newArrivals      = CINEMA_ITEMS.filter((i) => i.year >= 2025).slice(0, 8);
  const seriesItems      = CINEMA_ITEMS.filter((i) => i.type === 'series');
  const animeItems       = CINEMA_ITEMS.filter((i) => i.type === 'anime' || i.genres.includes('Animation'));
  const shortFilms       = CINEMA_ITEMS.filter((i) => i.type === 'short' || (i.runtimeMinutes > 0 && i.runtimeMinutes <= 40));
  const aiFilms          = CINEMA_ITEMS.filter((i) => i.type === 'ai_film' || i.aiInvolvement?.isAiFilm);
  const deepWaterItems   = CINEMA_ITEMS.filter((i) => i.moods.includes('philosophical') || i.genres.includes('Mystery'));
  const forYouItems      = CINEMA_ITEMS.filter((i) => i.aiMatchScore && i.aiMatchScore >= 90).slice(0, 8);

  const featuredFilm = CINEMA_ITEMS.find((c) => c.id === 'the-last-signal') || CINEMA_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#060F1A] text-[#E8F4F8] font-sans flex flex-col antialiased">
      {/* ─── Header ─── */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onOpenSearch={handleOpenSearch}
        onOpenProfile={() => setIsProfileOpen(true)}
        savedCount={savedItems.length}
      />

      {/* ─── Main Content ─── */}
      <main className="flex-1 pb-20 lg:pb-0" id="main-content">

        {/* ======= DISCOVER / HOME TAB ======= */}
        {currentTab === 'discover' && (
          <div>
            {/* Hero Section */}
            <Hero
              featuredItem={featuredFilm}
              onSelectMedia={handleSelectMedia}
              onTriggerAISearch={handleOpenSearch}
            />

            {/* AI Feature Section — USP */}
            <AIFeatureSection
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onOpenAISearchModal={handleOpenSearch}
              savedItemIds={savedItemIds}
              catalog={CINEMA_ITEMS}
            />

            {/* ─── Content Rails with visual variety matching Section 10 ─── */}

            {/* Rail 1: ĐANG NỔI (Trending) */}
            <MovieRail
              title="ĐANG NỔI — Sóng Điện Ảnh Thịnh Hành"
              subtitle="Những tác phẩm đang tạo nên làn sóng thảo luận và đánh giá cao trên toàn cầu"
              items={trendingItems}
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onWhereToWatch={(item) => setWatchModalMedia(item)}
              onViewAll={() => handleNavigate('explore')}
              savedItemIds={savedItemIds}
              icon={<TrendingUp className="w-5 h-5 text-[#35C2C8]" />}
              accentVariant="default"
            />

            {/* Rail 2: MỚI CẬP BẾN (New Arrivals) */}
            <MovieRail
              title="MỚI CẬP BẾN — Làn Gió Điện Ảnh 2025–2026"
              subtitle="Các tác phẩm vừa hoàn thành hải trình và cập bến nền tảng, đón chào người xem đầu tiên"
              items={newArrivals}
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onWhereToWatch={(item) => setWatchModalMedia(item)}
              onViewAll={() => handleNavigate('explore')}
              savedItemIds={savedItemIds}
              icon={<Waves className="w-5 h-5 text-[#19A7C7]" />}
              accentVariant="sand"
            />

            {/* Rail 3: PHÙ HỢP VỚI BẠN (AI Personalized Recommendation with Explanations) */}
            <div className="bg-[#05111D] py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
                <div className="bg-gradient-to-r from-[#0C1E2E] via-[#082236] to-[#0C1E2E] p-4 sm:p-5 rounded-2xl border border-[#19A7C7]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#19A7C7]/20 flex items-center justify-center text-[#35C2C8] shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#19A7C7] text-white text-[10px] font-bold uppercase tracking-wider">
                          94% PHÙ HỢP
                        </span>
                        <span className="text-xs text-[#35C2C8] font-bold">Theo AI</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#E8F4F8] mt-1 font-medium">
                        "Bạn thường thích sci-fi có nhịp chậm, giàu cảm xúc và chủ đề về sự gắn kết con người giữa vũ trụ bao la."
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenSearch('Đề xuất phim phù hợp gu của tôi')}
                    className="px-4 py-2 rounded-xl bg-[#087EA4] hover:bg-[#19A7C7] text-white text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    Hỏi AI lý do →
                  </button>
                </div>
              </div>

              <MovieRail
                title="PHÙ HỢP VỚI BẠN — Gợi Ý Cá Nhân Hóa"
                subtitle="Đề xuất điện ảnh dựa trên nhịp điệu cảm xúc, thẩm mỹ thị giác và các câu chuyện bạn đã yêu thích"
                items={forYouItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => handleNavigate('explore')}
                savedItemIds={savedItemIds}
                icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                accentVariant="navy"
              />
            </div>

            {/* Rail 4: VÙNG NƯỚC SÂU (Deep Water - Philosophical & Contemplative) */}
            <MovieRail
              title="VÙNG NƯỚC SÂU — Chiêm Nghiệm & Triết Học"
              subtitle="Điện ảnh chậm, giàu ẩn dụ và khơi gợi những suy tư về thời gian, ký ức và sự hiện hữu của con người"
              items={deepWaterItems}
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onWhereToWatch={(item) => setWatchModalMedia(item)}
              onViewAll={() => handleNavigate('explore')}
              savedItemIds={savedItemIds}
              icon={<Moon className="w-5 h-5 text-[#35C2C8]" />}
              accentVariant="default"
            />

            {/* Rail 5: PHIM NGẮN (Short Films) */}
            <MovieRail
              title="PHIM NGẮN — Khoảng Lặng Dưới 40 Phút"
              subtitle="Khoảng lặng điện ảnh súc tích cho những buổi tối cần thư giãn nhanh và trải nghiệm sâu"
              items={shortFilms}
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onWhereToWatch={(item) => setWatchModalMedia(item)}
              onViewAll={() => handleNavigate('explore')}
              savedItemIds={savedItemIds}
              icon={<Film className="w-5 h-5 text-[#19A7C7]" />}
              accentVariant="sand"
            />

            {/* Rail 6: SERIES ĐÁNG BINGE (Binge-Worthy Series) */}
            <MovieRail
              title="SERIES ĐÁNG BINGE — Cuốn Hút & Liền Mạch"
              subtitle="Những hải trình truyền hình kịch tính, nhiều lớp lang và khó dứt ra một khi đã bắt đầu"
              items={seriesItems}
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onWhereToWatch={(item) => setWatchModalMedia(item)}
              onViewAll={() => handleNavigate('explore')}
              savedItemIds={savedItemIds}
              icon={<Tv className="w-5 h-5 text-[#35C2C8]" />}
              accentVariant="default"
            />

            {/* Rail 7: BIỂN AI (AI Generative Films) */}
            <MovieRail
              title="BIỂN AI — Điện Ảnh Kỷ Nguyên Mới"
              subtitle="Các tác phẩm thể nghiệm kết hợp trí tuệ nhân tạo, đồ họa generative và thị giác tương lai"
              items={aiFilms}
              onSelectMedia={handleSelectMedia}
              onToggleSave={handleToggleSaveById}
              onWhereToWatch={(item) => setWatchModalMedia(item)}
              onViewAll={() => handleNavigate('explore')}
              savedItemIds={savedItemIds}
              icon={<Zap className="w-5 h-5 text-purple-400" />}
              accentVariant="navy"
            />
          </div>
        )}

        {/* ======= EXPLORE TAB (All) ======= */}
        {currentTab === 'explore' && (
          <ExploreView
            initialType="all"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= PHIM (Movies Only) ======= */}
        {currentTab === 'movies' && (
          <ExploreView
            initialType="movie"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= SERIES (Series Only) ======= */}
        {currentTab === 'series' && (
          <ExploreView
            initialType="series"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= PHIM NGẮN (Shorts Only) ======= */}
        {currentTab === 'shorts' && (
          <ExploreView
            initialType="short"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= AI FILMS (AI Films Only) ======= */}
        {currentTab === 'ai-films' && (
          <ExploreView
            initialType="ai_film"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= COLLECTIONS TAB ======= */}
        {currentTab === 'collections' && (
          <CollectionsView
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= MY CINEMA TAB ======= */}
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

      {/* ─── Footer ─── */}
      <Footer onNavigate={handleNavigate} />

      {/* ─── Mobile Bottom Navigation ─── */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onOpenSearch={() => handleOpenSearch()}
        onOpenProfile={() => setIsProfileOpen(true)}
        savedCount={savedItems.length}
      />

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
