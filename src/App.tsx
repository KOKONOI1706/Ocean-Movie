import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  type Location,
} from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MovieRail } from './components/MovieRail';
import { MovieRailSkeleton } from './components/MovieRailSkeleton';
import { AIRecommendationRail } from './components/AIRecommendationRail';
import { HomeCollectionStrip } from './components/HomeCollectionStrip';
import { ExploreView } from './components/ExploreView';
import { CollectionsView } from './components/CollectionsView';
import { MyCinemaView } from './components/MyCinemaView';
import { MovieDetailPage } from './components/MovieDetailPage';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { AISearchModal } from './components/AISearchModal';
import { WhereToWatchModal } from './components/WhereToWatchModal';
import { UserProfilePage } from './components/UserProfilePage';
import { CreatorDetailModal } from './components/CreatorDetailModal';
import { BottomNav } from './components/BottomNav';

import { CINEMA_ITEMS } from './data/cinemaData';
import { MediaItem, SavedMediaItem, Creator } from './types';
import {
  discoverApi,
  watchlistApi,
  moviesApi,
  seriesApi,
} from './lib/api';

import { OceanDepthProvider } from './context/OceanDepthContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { OceanBackground } from './components/ocean/OceanBackground';
import { VerticalDepthIndicator } from './components/ocean/VerticalDepthIndicator';
import { DepthHUD } from './components/ocean/DepthHUD';
import { AIDiscoveryConsole } from './components/ocean/AIDiscoveryConsole';
import { OceanFooter } from './components/ocean/OceanFooter';

// ─── Fallback datasets from local cinemaData ─────────────────────────────────
const FALLBACK_TRENDING = CINEMA_ITEMS.filter((i) => i.isTrending || i.rating >= 8.5).slice(0, 12);
const FALLBACK_NEW = CINEMA_ITEMS.filter((i) => i.year >= 2024).slice(0, 10);
const FALLBACK_SERIES = CINEMA_ITEMS.filter((i) => i.type === 'series');
const FALLBACK_FOR_YOU = CINEMA_ITEMS.filter((i) => i.aiMatchScore && i.aiMatchScore >= 88).slice(0, 8);
const FALLBACK_DEEP_WATER = CINEMA_ITEMS.filter((i) => i.moods.includes('philosophical') || i.genres.includes('Mystery')).slice(0, 10);

// ─── Tab id <-> route path mapping ────────────────────────────────────────────
// Centralizes the mapping so nav components (Header/BottomNav) can keep using
// simple tab-id strings while the URL itself uses real path segments.
const TAB_PATHS: Record<string, string> = {
  discover: '/',
  auth: '/auth',
  login: '/auth',
  explore: '/explore',
  movies: '/movies',
  series: '/series',
  shorts: '/shorts',
  'ai-films': '/ai-films',
  collections: '/collections',
  'my-cinema': '/my-cinema',
  'ai-discovery': '/ai-discovery',
  profile: '/profile',
};

function pathToTab(pathname: string): string {
  if (pathname === '/') return 'discover';
  if (pathname.startsWith('/movie/')) return 'movie-detail';
  if (pathname.startsWith('/series/')) return 'series-detail';
  const segment = pathname.split('/')[1];
  return segment || 'discover';
}

// ─── Shared helper: resolve a MediaItem by its slug (route param) ───────────
// Tries the backend first, falls back to the local dataset — mirrors the old
// query-param bootstrap logic, just keyed off useParams() instead of
// URLSearchParams.
function useMediaBySlug(
  slug: string | undefined,
  fetcher: (slug: string) => Promise<MediaItem | null | undefined>,
): { item: MediaItem | null; loading: boolean } {
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetcher(slug)
      .then((result) => {
        if (!isMounted) return;
        setItem(result ?? CINEMA_ITEMS.find((c) => c.id === slug) ?? null);
      })
      .catch(() => {
        if (isMounted) setItem(CINEMA_ITEMS.find((c) => c.id === slug) ?? null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { item, loading };
}

// ─── /movie/:slug ─────────────────────────────────────────────────────────────
interface MovieDetailRouteProps {
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  onOpenSeriesDetail: (item: MediaItem) => void;
  savedItemIds: string[];
  onToggleSave: (item: MediaItem) => void;
}

function MovieDetailRoute({
  onSelectMedia,
  onOpenWhereToWatch,
  onOpenSeriesDetail,
  savedItemIds,
  onToggleSave,
}: MovieDetailRouteProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { item, loading } = useMediaBySlug(slug, (s) => moviesApi.getById(s));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  if (loading) return null;
  if (!item) return <Navigate to="/" replace />;

  return (
    <MovieDetailPage
      item={item}
      onBack={() => {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      onSelectMedia={onSelectMedia}
      onOpenWhereToWatch={onOpenWhereToWatch}
      onOpenSeriesDetail={onOpenSeriesDetail}
      isSaved={savedItemIds.includes(item.id)}
      onToggleSave={onToggleSave}
    />
  );
}

// ─── /series/:slug (rendered as an overlay on top of a background route) ────
interface SeriesDetailRouteProps {
  onOpenWhereToWatch: (item: MediaItem) => void;
  savedItemIds: string[];
  onToggleSave: (item: MediaItem) => void;
  onUpdateEpisodeProgress: (episodeId: string, percentage: number) => void;
  hasBackgroundLocation: boolean;
}

function SeriesDetailRoute({
  onOpenWhereToWatch,
  savedItemIds,
  onToggleSave,
  onUpdateEpisodeProgress,
  hasBackgroundLocation,
}: SeriesDetailRouteProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { item } = useMediaBySlug(slug, (s) => seriesApi.getById(s));

  if (!item) return null;

  const handleClose = () => {
    if (hasBackgroundLocation) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <SeriesDetailModal
      item={item}
      onClose={handleClose}
      onOpenWhereToWatch={onOpenWhereToWatch}
      isSaved={savedItemIds.includes(item.id)}
      onToggleSave={onToggleSave}
      onUpdateEpisodeProgress={onUpdateEpisodeProgress}
    />
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = pathToTab(location.pathname);
  const { user } = useAuth();

  // A series detail route can be opened either as a real overlay (navigated to
  // from within the app, carrying `state.backgroundLocation`) or loaded
  // directly (shared link / refresh) — in which case we fall back to Discover
  // as the page rendered behind the modal.
  const navState = location.state as { backgroundLocation?: Location } | null;
  const isDirectSeriesLoad = currentTab === 'series-detail' && !navState?.backgroundLocation;
  const backgroundLocation: Location | null =
    navState?.backgroundLocation ??
    (isDirectSeriesLoad
      ? ({ pathname: '/', search: '', hash: '', state: null, key: 'default' } as Location)
      : null);

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [watchModalMedia, setWatchModalMedia] = useState<MediaItem | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // ─── Content Rails (null = not yet loaded, shows skeleton) ─────────────────
  const [trendingList, setTrendingList] = useState<MediaItem[] | null>(null);
  const [newArrivalsList, setNewArrivalsList] = useState<MediaItem[] | null>(null);
  const [seriesList, setSeriesList] = useState<MediaItem[] | null>(null);
  const [forYouList, setForYouList] = useState<MediaItem[] | null>(null);
  const [deepWaterList, setDeepWaterList] = useState<MediaItem[] | null>(null);
  const [isLoadingRails, setIsLoadingRails] = useState(true);

  // ─── Watchlist & User State ────────────────────────────────────────────────
  const [savedItems, setSavedItems] = useState<SavedMediaItem[]>([
    { mediaId: 'frieren-journey', savedAt: '2026-03-12', category: 'wishlist' },
    { mediaId: 'blade-runner-2049', savedAt: '2026-03-14', category: 'wishlist' },
    { mediaId: 'the-last-signal', savedAt: '2026-03-15', category: 'wishlist' },
  ]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({
    interstellar: 9,
    dark: 10,
    'spirited-away': 10,
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

    return () => {
      isMounted = false;
    };
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
    try { await watchlistApi.remove(mediaId); } catch { }
  };

  const handleUpdateEpisodeProgress = (episodeId: string, percentage: number) => {
    console.log(`Updated episode ${episodeId} to ${percentage}%`);
  };

  // Navigate to a movie's full page (/movie/:slug) or open a series overlay
  // (/series/:slug) on top of whatever page we're currently on.
  const handleSelectMedia = (item: MediaItem) => {
    const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);
    if (isSeries) {
      navigate(`/series/${item.id}`, { state: { backgroundLocation: location } });
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  // Related-series link from inside the movie detail page: matches the old
  // behaviour of dropping back to Discover with the series overlay on top.
  const handleOpenSeriesFromMovieDetail = (item: MediaItem) => {
    navigate(`/series/${item.id}`, {
      state: { backgroundLocation: { pathname: '/', search: '', hash: '', state: null, key: 'default' } },
    });
  };

  const handleNavigate = (tab: string) => {
    navigate(TAB_PATHS[tab] ?? '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savedItemIds = savedItems.map((s) => s.mediaId);

  // Resolved (loaded or fallback) lists for rendering
  const trendingItems = trendingList ?? [];
  const newArrivals = newArrivalsList ?? [];
  const seriesItems = seriesList ?? [];
  const forYouItems = forYouList ?? [];
  const deepWaterItems = deepWaterList ?? [];

  // Featured film for the hero — first trending, or first in fallback
  const featuredFilm = trendingItems[0]
    ?? CINEMA_ITEMS.find((c) => c.id === 'the-last-signal')
    ?? CINEMA_ITEMS[0];

  if (currentTab === 'auth') {
    return (
      <LoginPage
        onBack={() => handleNavigate('discover')}
        onSuccess={() => handleNavigate('discover')}
        onNavigate={handleNavigate}
      />
    );
  }

  const discoverContent = (
    <div>

      {/* 1. Cinematic Full-Bleed Hero */}
      <div id="hero-section">
        <Hero
          featuredItem={featuredFilm}
          featuredItems={trendingItems.length > 0 ? trendingItems : FALLBACK_TRENDING}
          onSelectMedia={handleSelectMedia}
          onTriggerAISearch={handleOpenSearch}
          onToggleSave={handleToggleSave}
          savedItemIds={savedItemIds}
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
  );

  // The location used to resolve the "page" Routes — when a series overlay is
  // open, this is the page behind it rather than the overlay's own URL.
  const pageLocation = backgroundLocation ?? location;

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
        currentTab={pathToTab(pageLocation.pathname)}
        onSelectTab={handleNavigate}
        onOpenSearch={handleOpenSearch}
        onOpenProfile={() => handleNavigate('profile')}
        savedCount={savedItems.length}
      />

      {/* ─── Main Content ─── */}
      <main
        className="flex-1 pb-20 relative"
        id="main-content"
      >
        <Routes location={pageLocation}>
          <Route path="/" element={discoverContent} />

          <Route
            path="/movie/:slug"
            element={(
              <MovieDetailRoute
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onOpenSeriesDetail={handleOpenSeriesFromMovieDetail}
                savedItemIds={savedItemIds}
                onToggleSave={handleToggleSave}
              />
            )}
          />

          <Route
            path="/explore"
            element={(
              <ExploreView
                initialType="all"
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onToggleSave={handleToggleSaveById}
                savedItemIds={savedItemIds}
              />
            )}
          />

          <Route
            path="/movies"
            element={(
              <ExploreView
                initialType="movie"
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onToggleSave={handleToggleSaveById}
                savedItemIds={savedItemIds}
              />
            )}
          />

          <Route
            path="/series"
            element={(
              <ExploreView
                initialType="series"
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onToggleSave={handleToggleSaveById}
                savedItemIds={savedItemIds}
              />
            )}
          />

          <Route
            path="/shorts"
            element={(
              <ExploreView
                initialType="short"
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onToggleSave={handleToggleSaveById}
                savedItemIds={savedItemIds}
              />
            )}
          />

          <Route
            path="/ai-films"
            element={(
              <ExploreView
                initialType="ai_film"
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onToggleSave={handleToggleSaveById}
                savedItemIds={savedItemIds}
              />
            )}
          />

          <Route
            path="/collections"
            element={(
              <CollectionsView
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onToggleSave={handleToggleSaveById}
                savedItemIds={savedItemIds}
              />
            )}
          />

          <Route
            path="/my-cinema"
            element={(
              <MyCinemaView
                savedItems={savedItems}
                userRatings={userRatings}
                onSelectMedia={handleSelectMedia}
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                onRemoveSaved={handleRemoveSaved}
                onOpenCreator={(creator) => setSelectedCreator(creator)}
              />
            )}
          />

          <Route
            path="/ai-discovery"
            element={(
              <div className="py-12 min-h-[70vh] flex items-center justify-center">
                <AIDiscoveryConsole onSearch={handleOpenSearch} />
              </div>
            )}
          />

          <Route
            path="/profile"
            element={
              user ? (
                <UserProfilePage
                  savedCount={savedItems.length}
                  ratedCount={Object.keys(userRatings).length}
                />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* ======= Footer for non-discover routes ======= */}
        {pageLocation.pathname !== '/' && (
          <OceanFooter onNavigate={handleNavigate} />
        )}
      </main>

      {/* ─── Mobile Bottom Navigation ─── */}
      <BottomNav
        currentTab={pathToTab(pageLocation.pathname)}
        onSelectTab={handleNavigate}
        onOpenSearch={() => handleOpenSearch()}
        onOpenProfile={() => handleNavigate('profile')}
        savedCount={savedItems.length}
      />

      {/* ================= MODALS ================= */}

      {/* ─── /series/:slug overlay ─── */}
      {backgroundLocation && (
        <Routes>
          <Route
            path="/series/:slug"
            element={(
              <SeriesDetailRoute
                onOpenWhereToWatch={(item) => setWatchModalMedia(item)}
                savedItemIds={savedItemIds}
                onToggleSave={handleToggleSave}
                onUpdateEpisodeProgress={handleUpdateEpisodeProgress}
                hasBackgroundLocation={Boolean(navState?.backgroundLocation)}
              />
            )}
          />
        </Routes>
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
    <AuthProvider>
      <OceanDepthProvider>
        <AppContent />
      </OceanDepthProvider>
    </AuthProvider>
  );
}

export default App;
