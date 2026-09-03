import React, { useState, useEffect } from 'react';
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
  discoverApi,
  watchlistApi,
  moviesApi,
  seriesApi,
} from './lib/api';
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

import { OceanDepthProvider } from './context/OceanDepthContext';
import { OceanBackground } from './components/ocean/OceanBackground';
import { VerticalDepthIndicator } from './components/ocean/VerticalDepthIndicator';
import { DepthHUD } from './components/ocean/DepthHUD';
import { AIDiscoveryConsole } from './components/ocean/AIDiscoveryConsole';
import { OceanFooter } from './components/ocean/OceanFooter';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('discover');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [seriesModalMedia, setSeriesModalMedia] = useState<MediaItem | null>(null);
  const [watchModalMedia, setWatchModalMedia] = useState<MediaItem | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // API State for Rails
  const [trendingList, setTrendingList] = useState<MediaItem[]>(() =>
    CINEMA_ITEMS.filter((i) => i.isTrending || i.rating >= 8.6)
  );
  const [newArrivalsList, setNewArrivalsList] = useState<MediaItem[]>(() =>
    CINEMA_ITEMS.filter((i) => i.year >= 2025).slice(0, 8)
  );
  const [seriesList, setSeriesList] = useState<MediaItem[]>(() =>
    CINEMA_ITEMS.filter((i) => i.type === 'series')
  );
  const [shortFilmsList, setShortFilmsList] = useState<MediaItem[]>(() =>
    CINEMA_ITEMS.filter((i) => i.type === 'short' || (i.runtimeMinutes > 0 && i.runtimeMinutes <= 40))
  );
  const [aiFilmsList, setAiFilmsList] = useState<MediaItem[]>(() =>
    CINEMA_ITEMS.filter((i) => i.type === 'ai_film' || i.aiInvolvement?.isAiFilm)
  );
  const [forYouList, setForYouList] = useState<MediaItem[]>(() =>
    CINEMA_ITEMS.filter((i) => i.aiMatchScore && i.aiMatchScore >= 90).slice(0, 8)
  );

  // Watchlist state synced with backend API
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

  // Load content rails from backend API on mount
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const [trendingRes, newRes, shortsRes, aiRes, forYouRes, seriesRes] = await Promise.allSettled([
          discoverApi.getTrending(),
          discoverApi.getNewArrivals(),
          discoverApi.getShortFilms(),
          discoverApi.getAiFilms(),
          discoverApi.getRecommended(),
          seriesApi.getAll(),
        ]);

        if (!isMounted) return;

        if (trendingRes.status === 'fulfilled' && trendingRes.value.movies.length > 0) {
          setTrendingList([...trendingRes.value.movies, ...trendingRes.value.series]);
        }
        if (newRes.status === 'fulfilled' && newRes.value.length > 0) {
          setNewArrivalsList(newRes.value);
        }
        if (shortsRes.status === 'fulfilled' && shortsRes.value.length > 0) {
          setShortFilmsList(shortsRes.value);
        }
        if (aiRes.status === 'fulfilled' && aiRes.value.length > 0) {
          setAiFilmsList(aiRes.value);
        }
        if (forYouRes.status === 'fulfilled' && forYouRes.value.length > 0) {
          setForYouList(forYouRes.value);
        }
        if (seriesRes.status === 'fulfilled' && seriesRes.value.items.length > 0) {
          setSeriesList(seriesRes.value.items);
        }
      } catch (err) {
        console.warn('Backend discovery load error, using initial mock:', err);
      }

      // Load user watchlist from DB if authenticated or demo token available
      try {
        const dbWatchlist = await watchlistApi.getWatchlist();
        if (isMounted && dbWatchlist && dbWatchlist.length > 0) {
          setSavedItems(dbWatchlist);
        }
      } catch (_err) {
        // Fallback to local state
      }
    }

    loadBackendData();

    // Check URL parameters for direct link routing (?movie=..., ?series=..., ?tab=...)
    const params = new URLSearchParams(window.location.search);
    const movieSlug = params.get('movie');
    const seriesSlug = params.get('series');
    const tabParam = params.get('tab');

    if (tabParam) {
      setCurrentTab(tabParam);
    }

    if (movieSlug) {
      moviesApi
        .getById(movieSlug)
        .then((m) => {
          if (isMounted && m) setSelectedMedia(m);
        })
        .catch(() => {
          const fallback = CINEMA_ITEMS.find((c) => c.id === movieSlug);
          if (isMounted && fallback) setSelectedMedia(fallback);
        });
    } else if (seriesSlug) {
      seriesApi
        .getById(seriesSlug)
        .then((s) => {
          if (isMounted && s) setSeriesModalMedia(s);
        })
        .catch(() => {
          const fallback = CINEMA_ITEMS.find((c) => c.id === seriesSlug);
          if (isMounted && fallback) setSeriesModalMedia(fallback);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenSearch = (initialPrompt?: string) => {
    setSearchInitialQuery(initialPrompt || '');
    setIsSearchOpen(true);
  };

  const handleToggleSave = async (item: MediaItem) => {
    const isSaved = savedItems.some((s) => s.mediaId === item.id);
    const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);

    // Optimistic UI update
    setSavedItems((prev) => {
      if (isSaved) return prev.filter((s) => s.mediaId !== item.id);
      return [
        ...prev,
        { mediaId: item.id, savedAt: new Date().toISOString(), category: 'wishlist' },
      ];
    });

    // Backend database persistence
    try {
      if (isSaved) {
        await watchlistApi.remove(item.id);
      } else {
        await watchlistApi.add(item.id, isSeries, 'WISHLIST');
      }
    } catch (err) {
      console.warn('Failed to sync watchlist to database:', err);
    }
  };

  const handleToggleSaveById = (itemId: string) => {
    const item =
      trendingList.find((c) => c.id === itemId) ||
      CINEMA_ITEMS.find((c) => c.id === itemId);
    if (item) handleToggleSave(item);
  };

  const handleRemoveSaved = async (mediaId: string) => {
    setSavedItems((prev) => prev.filter((s) => s.mediaId !== mediaId));
    try {
      await watchlistApi.remove(mediaId);
    } catch (err) {
      console.warn('Failed to remove from database watchlist:', err);
    }
  };

  const handleUpdateEpisodeProgress = (episodeId: string, percentage: number) => {
    console.log(`Updated episode ${episodeId} to ${percentage}%`);
  };

  const handleSelectMedia = (item: MediaItem) => {
    const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);
    const url = new URL(window.location.href);
    if (isSeries) {
      setSeriesModalMedia(item);
      url.searchParams.set('series', item.id);
      url.searchParams.delete('movie');
    } else {
      setSelectedMedia(item);
      url.searchParams.set('movie', item.id);
      url.searchParams.delete('series');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseModals = () => {
    setSelectedMedia(null);
    setSeriesModalMedia(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('movie');
    url.searchParams.delete('series');
    window.history.pushState({}, '', url.toString());
  };

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'discover') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savedItemIds = savedItems.map((s) => s.mediaId);

  // ─── Categorized content rails mapped to Ocean Depth Descent ───
  const trendingItems    = trendingList;
  const newArrivals      = newArrivalsList;
  const seriesItems      = seriesList;
  const animeItems       = CINEMA_ITEMS.filter((i) => i.type === 'anime' || i.genres.includes('Animation'));
  const shortFilms       = shortFilmsList;
  const aiFilms          = aiFilmsList;
  const deepWaterItems   = CINEMA_ITEMS.filter((i) => i.moods.includes('philosophical') || i.genres.includes('Mystery'));
  const forYouItems      = forYouList;

  const featuredFilm = trendingList[0] || CINEMA_ITEMS.find((c) => c.id === 'the-last-signal') || CINEMA_ITEMS[0];

  return (
    <div className="min-h-screen text-[#E8F4F8] font-sans flex flex-col antialiased relative selection:bg-[#19A7C7]/30 selection:text-white bg-[#030A14]">
      {/* Dynamic Ocean Atmosphere & Vintage Marine Life Engine */}
      <OceanBackground />

      {/* Left Scientific Vertical Depth Indicator (Matching Reference Image) */}
      <VerticalDepthIndicator />

      {/* Bathysphere Depth Gauge HUD (Bottom right, collapsible) */}
      <DepthHUD />

      {/* ─── Minimal Cinematic Header ─── */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onOpenSearch={handleOpenSearch}
        onOpenProfile={() => setIsProfileOpen(true)}
        savedCount={savedItems.length}
      />

      {/* ─── Main Content Container (Padded left for depth indicator) ─── */}
      <main className="flex-1 pb-20 lg:pb-0 relative z-10 lg:pl-16 xl:pl-20" id="main-content">

        {/* ======= DISCOVER / HOME TAB ======= */}
        {currentTab === 'discover' && (
          <div>
            {/* 1. Cinematic Hero with Whale & Telemetry */}
            <div id="hero-section">
              <Hero
                featuredItem={featuredFilm}
                onSelectMedia={handleSelectMedia}
                onTriggerAISearch={handleOpenSearch}
              />
            </div>

            {/* 2. ĐANG THỊNH HÀNH (Trending) */}
            <div id="trending-section">
              <MovieRail
                title="ĐANG THỊNH HÀNH"
                subtitle="Những tác phẩm được khám phá nhiều nhất trên toàn cầu"
                items={trendingItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => handleNavigate('explore')}
                savedItemIds={savedItemIds}
                aspectRatio="landscape"
              />
            </div>

            {/* 3. ĐỀ XUẤT TỪ AI (Dành riêng cho bạn) */}
            <div id="ai-recommendations-section">
              <MovieRail
                title="ĐỀ XUẤT TỪ AI"
                subtitle="Dành riêng cho bạn"
                items={forYouItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => handleNavigate('explore')}
                savedItemIds={savedItemIds}
                aspectRatio="landscape"
                showAiBadge={true}
              />
            </div>

            {/* 4. MỚI CẬP NHẬT (Những gì vừa xuất hiện trong đại dương) */}
            <div id="new-arrivals-section">
              <MovieRail
                title="MỚI CẬP NHẬT"
                subtitle="Những gì vừa xuất hiện trong đại dương"
                items={newArrivals}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => handleNavigate('explore')}
                savedItemIds={savedItemIds}
                aspectRatio="landscape"
              />
            </div>

            {/* 5. SERIES (Những hành trình dài hơn) */}
            <div id="series-section">
              <MovieRail
                title="SERIES"
                subtitle="Những hành trình dài hơn"
                items={seriesItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => handleNavigate('series')}
                savedItemIds={savedItemIds}
                aspectRatio="landscape"
              />
            </div>

            {/* 6. NHỮNG GÌ NẰM BÊN DƯỚI (Deep Ocean / Hidden Gems) */}
            <div id="hidden-gems-section">
              <MovieRail
                title="NHỮNG GÌ NẰM BÊN DƯỚI"
                subtitle="Không phải câu chuyện nào cũng nằm trên mặt nước."
                items={deepWaterItems}
                onSelectMedia={handleSelectMedia}
                onToggleSave={handleToggleSaveById}
                onWhereToWatch={(item) => setWatchModalMedia(item)}
                onViewAll={() => handleNavigate('explore')}
                savedItemIds={savedItemIds}
                aspectRatio="landscape"
              />
            </div>

            {/* 7. ĐỂ AI DẪN ĐƯỜNG (Interactive AI Console) */}
            <div id="ai-discovery-section">
              <AIDiscoveryConsole onSearch={handleOpenSearch} />
            </div>

            {/* 8. Deep Abyssal Footer */}
            <OceanFooter onNavigate={handleNavigate} />
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

        {/* ======= AI DISCOVERY TAB ======= */}
        {currentTab === 'ai-discovery' && (
          <div className="py-12 min-h-[70vh] flex items-center justify-center">
            <AIDiscoveryConsole onSearch={handleOpenSearch} />
          </div>
        )}
      </main>

      {/* ─── Deep Ocean Editorial Footer ─── */}
      <OceanFooter onNavigate={handleNavigate} />

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
          onClose={handleCloseModals}
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
          onClose={handleCloseModals}
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

export function App() {
  return (
    <OceanDepthProvider>
      <AppContent />
    </OceanDepthProvider>
  );
}

export default App;
