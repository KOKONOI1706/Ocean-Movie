import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MovieRail } from './components/MovieRail';
import { MovieRailSkeleton } from './components/MovieRailSkeleton';
import { AIRecommendationRail } from './components/AIRecommendationRail';
import { HomeCollectionStrip } from './components/HomeCollectionStrip';
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

import { CINEMA_ITEMS } from './data/cinemaData';
import { INITIAL_USER_TASTE } from './data/collectionsData';
import { MediaItem, SavedMediaItem, Creator } from './types';
import {
  discoverApi,
  watchlistApi,
  moviesApi,
  seriesApi,
} from './lib/api';

import { OceanDepthProvider } from './context/OceanDepthContext';
import { OceanBackground } from './components/ocean/OceanBackground';
import { VerticalDepthIndicator } from './components/ocean/VerticalDepthIndicator';
import { DepthHUD } from './components/ocean/DepthHUD';
import { AIDiscoveryConsole } from './components/ocean/AIDiscoveryConsole';
import { OceanFooter } from './components/ocean/OceanFooter';

// ─── Fallback datasets from local cinemaData ─────────────────────────────────
const FALLBACK_TRENDING   = CINEMA_ITEMS.filter((i) => i.isTrending || i.rating >= 8.5).slice(0, 12);
const FALLBACK_NEW        = CINEMA_ITEMS.filter((i) => i.year >= 2024).slice(0, 10);
const FALLBACK_SERIES     = CINEMA_ITEMS.filter((i) => i.type === 'series');
const FALLBACK_FOR_YOU    = CINEMA_ITEMS.filter((i) => i.aiMatchScore && i.aiMatchScore >= 88).slice(0, 8);
const FALLBACK_DEEP_WATER = CINEMA_ITEMS.filter((i) => i.moods.includes('philosophical') || i.genres.includes('Mystery')).slice(0, 10);

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('discover');

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [selectedMedia,   setSelectedMedia]   = useState<MediaItem | null>(null);
  const [seriesModalMedia, setSeriesModalMedia] = useState<MediaItem | null>(null);
  const [watchModalMedia, setWatchModalMedia] = useState<MediaItem | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isProfileOpen,   setIsProfileOpen]   = useState<boolean>(false);
  const [isSearchOpen,    setIsSearchOpen]    = useState<boolean>(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // ─── Content Rails (null = not yet loaded, shows skeleton) ─────────────────
  const [trendingList,    setTrendingList]    = useState<MediaItem[] | null>(null);
  const [newArrivalsList, setNewArrivalsList] = useState<MediaItem[] | null>(null);
  const [seriesList,      setSeriesList]      = useState<MediaItem[] | null>(null);
  const [forYouList,      setForYouList]      = useState<MediaItem[] | null>(null);
  const [deepWaterList,   setDeepWaterList]   = useState<MediaItem[] | null>(null);
  const [isLoadingRails,  setIsLoadingRails]  = useState(true);

  // ─── Watchlist & User State ────────────────────────────────────────────────
  const [savedItems, setSavedItems] = useState<SavedMediaItem[]>([
    { mediaId: 'frieren-journey',   savedAt: '2026-03-12', category: 'wishlist' },
    { mediaId: 'blade-runner-2049', savedAt: '2026-03-14', category: 'wishlist' },
    { mediaId: 'the-last-signal',   savedAt: '2026-03-15', category: 'wishlist' },
  ]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({
    interstellar:      9,
    dark:              10,
    'spirited-away':   10,
    'the-last-signal': 9,
  });

  // ─── Load backend data on mount ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const [trendingRes, newRes, forYouRes, seriesRes, hiddenRes] = await Promise.allSettled([
          discoverApi.getTrending(),
          discoverApi.getNewArrivals(),
          discoverApi.getRecommended(),
          seriesApi.getAll(),
          discoverApi.getHiddenGems(),
        ]);

        if (!isMounted) return;

        if (trendingRes.status === 'fulfilled') {
          const combined = [...trendingRes.value.movies, ...trendingRes.value.series];
          setTrendingList(combined.length > 0 ? combined : FALLBACK_TRENDING);
        } else {
          setTrendingList(FALLBACK_TRENDING);
        }

        if (newRes.status === 'fulfilled' && newRes.value.length > 0) {
          setNewArrivalsList(newRes.value);
        } else {
          setNewArrivalsList(FALLBACK_NEW);
        }

        if (forYouRes.status === 'fulfilled' && forYouRes.value.length > 0) {
          setForYouList(forYouRes.value);
        } else {
          setForYouList(FALLBACK_FOR_YOU);
        }

        if (seriesRes.status === 'fulfilled' && seriesRes.value.items.length > 0) {
          setSeriesList(seriesRes.value.items);
        } else {
          setSeriesList(FALLBACK_SERIES);
        }

        if (hiddenRes.status === 'fulfilled' && hiddenRes.value.length > 0) {
          setDeepWaterList(hiddenRes.value);
        } else {
          setDeepWaterList(FALLBACK_DEEP_WATER);
        }
      } catch (err) {
        console.warn('Backend discovery load error, falling back to local dataset:', err);
        setTrendingList(FALLBACK_TRENDING);
        setNewArrivalsList(FALLBACK_NEW);
        setForYouList(FALLBACK_FOR_YOU);
        setSeriesList(FALLBACK_SERIES);
        setDeepWaterList(FALLBACK_DEEP_WATER);
      } finally {
        if (isMounted) setIsLoadingRails(false);
      }
    }

    loadBackendData();

    // Load user watchlist from backend if authenticated
    async function loadWatchlist() {
      try {
        const dbWatchlist = await watchlistApi.getWatchlist();
        if (isMounted && dbWatchlist && dbWatchlist.length > 0) {
          setSavedItems(dbWatchlist);
        }
      } catch {
        // Fallback to local state — normal when not authenticated
      }
    }
    loadWatchlist();

    // Handle direct URL navigation (?movie=..., ?series=..., ?tab=...)
    const params = new URLSearchParams(window.location.search);
    const movieSlug  = params.get('movie');
    const seriesSlug = params.get('series');
    const tabParam   = params.get('tab');

    if (tabParam) setCurrentTab(tabParam);

    if (movieSlug) {
      moviesApi.getById(movieSlug)
        .then((m) => { if (isMounted && m) setSelectedMedia(m); })
        .catch(() => {
          const fallback = CINEMA_ITEMS.find((c) => c.id === movieSlug);
          if (isMounted && fallback) setSelectedMedia(fallback);
        });
    } else if (seriesSlug) {
      seriesApi.getById(seriesSlug)
        .then((s) => { if (isMounted && s) setSeriesModalMedia(s); })
        .catch(() => {
          const fallback = CINEMA_ITEMS.find((c) => c.id === seriesSlug);
          if (isMounted && fallback) setSeriesModalMedia(fallback);
        });
    }

    return () => { isMounted = false; };
  }, []);

  // ─── Event Handlers ────────────────────────────────────────────────────────
  const handleOpenSearch = (initialPrompt?: string) => {
    setSearchInitialQuery(initialPrompt || '');
    setIsSearchOpen(true);
  };

  const handleToggleSave = async (item: MediaItem) => {
    const isSaved = savedItems.some((s) => s.mediaId === item.id);
    const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);
    setSavedItems((prev) => {
      if (isSaved) return prev.filter((s) => s.mediaId !== item.id);
      return [...prev, { mediaId: item.id, savedAt: new Date().toISOString(), category: 'wishlist' }];
    });
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
    const item = (trendingList || FALLBACK_TRENDING).find((c) => c.id === itemId)
      || CINEMA_ITEMS.find((c) => c.id === itemId);
    if (item) handleToggleSave(item);
  };

  const handleRemoveSaved = async (mediaId: string) => {
    setSavedItems((prev) => prev.filter((s) => s.mediaId !== mediaId));
    try { await watchlistApi.remove(mediaId); } catch {}
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

  // Resolved (loaded or fallback) lists for rendering
  const trendingItems  = trendingList  ?? [];
  const newArrivals    = newArrivalsList ?? [];
  const seriesItems    = seriesList    ?? [];
  const forYouItems    = forYouList    ?? [];
  const deepWaterItems = deepWaterList ?? [];

  // Featured film for the hero — first trending, or first in fallback
  const featuredFilm = trendingItems[0]
    ?? CINEMA_ITEMS.find((c) => c.id === 'the-last-signal')
    ?? CINEMA_ITEMS[0];

  return (
    <div className="min-h-screen text-[#E8F4F8] font-sans flex flex-col antialiased relative selection:bg-[#19A7C7]/30 selection:text-white bg-[#030A14]">

      {/* ─── Dynamic Ocean Atmosphere ─── */}
      <OceanBackground />

      {/* ─── Left Scientific Vertical Depth Indicator (desktop only) ─── */}
      <VerticalDepthIndicator />

      {/* ─── Bathysphere Depth Gauge HUD (bottom-right, collapsible) ─── */}
      <DepthHUD />

      {/* ─── Minimal Cinematic Header ─── */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onOpenSearch={handleOpenSearch}
        onOpenProfile={() => setIsProfileOpen(true)}
        savedCount={savedItems.length}
      />

      {/* ─── Main Content ─── */}
      <main
        className="flex-1 pb-20 lg:pb-0 relative z-10 lg:pl-16 xl:pl-20"
        id="main-content"
      >

        {/* ======= DISCOVER / HOME TAB ======= */}
        {currentTab === 'discover' && (
          <div>

            {/* 1. Cinematic Full-Bleed Hero */}
            <div id="hero-section">
              <Hero
                featuredItem={featuredFilm}
                onSelectMedia={handleSelectMedia}
                onTriggerAISearch={handleOpenSearch}
              />
            </div>

            {/* 2. ĐANG THỊNH HÀNH — Surface level */}
            <div id="trending-section">
              {isLoadingRails ? (
                <MovieRailSkeleton count={5} />
              ) : (
                <MovieRail
                  title="ĐANG THỊNH HÀNH"
                  subtitle="Những tác phẩm được khám phá nhiều nhất trên toàn cầu"
                  items={trendingItems}
                  onSelectMedia={handleSelectMedia}
                  onToggleSave={handleToggleSaveById}
                  onWhereToWatch={(item) => setWatchModalMedia(item)}
                  onViewAll={() => handleNavigate('explore')}
                  savedItemIds={savedItemIds}
                  depthAccent="surface"
                />
              )}
            </div>

            {/* 3. ĐỀ XUẤT TỪ AI — Distinctive section */}
            <div id="ai-recommendations-section">
              {isLoadingRails ? (
                <MovieRailSkeleton count={5} />
              ) : (
                <AIRecommendationRail
                  items={forYouItems}
                  onSelectMedia={handleSelectMedia}
                  onToggleSave={handleToggleSaveById}
                  onWhereToWatch={(item) => setWatchModalMedia(item)}
                  onViewAll={() => handleNavigate('explore')}
                  savedItemIds={savedItemIds}
                />
              )}
            </div>

            {/* 4. MỚI CẬP NHẬT — Shallow depth */}
            <div id="new-arrivals-section">
              {isLoadingRails ? (
                <MovieRailSkeleton count={5} />
              ) : (
                <MovieRail
                  title="MỚI CẬP NHẬT"
                  subtitle="Những gì vừa xuất hiện trong đại dương"
                  items={newArrivals}
                  onSelectMedia={handleSelectMedia}
                  onToggleSave={handleToggleSaveById}
                  onWhereToWatch={(item) => setWatchModalMedia(item)}
                  onViewAll={() => handleNavigate('explore')}
                  savedItemIds={savedItemIds}
                  depthAccent="shallow"
                />
              )}
            </div>

            {/* 5. SERIES — Twilight depth */}
            <div id="series-section">
              {isLoadingRails ? (
                <MovieRailSkeleton count={5} />
              ) : (
                <MovieRail
                  title="SERIES"
                  subtitle="Những hành trình dài hơn"
                  items={seriesItems}
                  onSelectMedia={handleSelectMedia}
                  onToggleSave={handleToggleSaveById}
                  onWhereToWatch={(item) => setWatchModalMedia(item)}
                  onViewAll={() => handleNavigate('series')}
                  savedItemIds={savedItemIds}
                  depthAccent="twilight"
                />
              )}
            </div>

            {/* 6. BỘ SƯU TẬP — Editorial collection tiles */}
            <div id="collections-strip-section">
              <HomeCollectionStrip
                onNavigateCollections={() => handleNavigate('collections')}
              />
            </div>

            {/* 7. NHỮNG GÌ NẰM BÊN DƯỚI — Deep ocean / Hidden Gems */}
            <div id="hidden-gems-section">
              {isLoadingRails ? (
                <MovieRailSkeleton count={5} />
              ) : (
                <MovieRail
                  title="NHỮNG GÌ NẰM BÊN DƯỚI"
                  subtitle="Không phải câu chuyện nào cũng nằm trên mặt nước."
                  items={deepWaterItems}
                  onSelectMedia={handleSelectMedia}
                  onToggleSave={handleToggleSaveById}
                  onWhereToWatch={(item) => setWatchModalMedia(item)}
                  onViewAll={() => handleNavigate('explore')}
                  savedItemIds={savedItemIds}
                  depthAccent="deep"
                />
              )}
            </div>

            {/* 8. ĐỂ AI DẪN ĐƯỜNG — Interactive AI console */}
            <div id="ai-discovery-section">
              <AIDiscoveryConsole onSearch={handleOpenSearch} />
            </div>

            {/* 9. Deep Abyssal Footer — only in discover tab */}
            <OceanFooter onNavigate={handleNavigate} />
          </div>
        )}

        {/* ======= EXPLORE TAB ======= */}
        {currentTab === 'explore' && (
          <ExploreView
            initialType="all"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= PHIM TAB ======= */}
        {currentTab === 'movies' && (
          <ExploreView
            initialType="movie"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= SERIES TAB ======= */}
        {currentTab === 'series' && (
          <ExploreView
            initialType="series"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= PHIM NGẮN TAB ======= */}
        {currentTab === 'shorts' && (
          <ExploreView
            initialType="short"
            onSelectMedia={handleSelectMedia}
            onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
            onToggleSave={handleToggleSaveById}
            savedItemIds={savedItemIds}
          />
        )}

        {/* ======= AI FILMS TAB ======= */}
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

        {/* ======= Footer for non-discover tabs ======= */}
        {currentTab !== 'discover' && (
          <OceanFooter onNavigate={handleNavigate} />
        )}
      </main>

      {/* ─── Mobile Bottom Navigation ─── */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onOpenSearch={() => handleOpenSearch()}
        onOpenProfile={() => setIsProfileOpen(true)}
        savedCount={savedItems.length}
      />

      {/* ================= MODALS ================= */}

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

      <WhereToWatchModal
        item={watchModalMedia}
        onClose={() => setWatchModalMedia(null)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        tasteProfile={INITIAL_USER_TASTE}
      />

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
