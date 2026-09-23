export type MediaType = 'movie' | 'series' | 'short' | 'ai_film' | 'documentary' | 'anime';

export interface StreamingOption {
  provider: string;
  type: 'subscription' | 'rent' | 'buy' | 'free';
  price?: string;
  region: string;
  url: string;
  badge: string;
}

export type StreamType = 'hls' | 'file' | 'embed';

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  runtime: string;
  airDate: string;
  thumbnail: string;
  synopsis: string;
  aiRecap: string;
  keyCharacters: string[];
  majorThemes: string[];
  emotionalTone: string;
  importantEvents: string[];
  beforeYouWatchNote: string;
  playbackProgress?: number; // 0-100
  streamUrl?: string;
  streamType?: StreamType;
  sourceName?: string;
}

export interface Season {
  seasonNumber: number;
  title: string;
  year: number;
  episodeCount: number;
  episodes: Episode[];
}

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  tagline: string;
  year: number;
  type: MediaType;
  director: string;
  directorId?: string;
  cast: string[];
  genres: string[];
  moods: string[];
  runtime: string; // e.g., "169 min" or "4 Seasons"
  runtimeMinutes: number;
  rating: number; // e.g., 8.7
  editorialQuote: string;
  synopsis: string;
  backdropUrl: string;
  posterUrl: string;
  monochromePosterUrl: string;
  trailerYoutubeId?: string;
  isCoverFeature?: boolean;
  isTrending?: boolean;

  // AI Insights
  aiMatchScore?: number; // e.g. 96
  whyYouMayLike: string;
  aiMattersAnalysis: {
    themes: string;
    mood: string;
    visualStyle: string;
    narrativeStyle: string;
    emotionalIntensity: string; // e.g. "High - Somber & Expansive"
    audienceFit: string;
  };

  // AI Film specific
  aiInvolvement?: {
    isAiFilm: boolean;
    toolsUsed: string[]; // e.g. "Sora", "Midjourney v6", "ElevenLabs", "Runway Gen-3"
    promptDirector: string;
    workflowNotes: string;
  };

  // Streaming availability
  streamingOptions: StreamingOption[];

  // In-app stream (crawled films)
  streamUrl?: string;
  streamType?: StreamType;
  sourceName?: string;

  // Series specific
  seasons?: Season[];

  // Subtitle translations available
  subtitlesAvailable: {
    language: string;
    isAiAssisted: boolean;
    sampleDialogue?: { original: string; translated: string };
  }[];
}

export interface MoodCategory {
  id: string;
  title: string;
  subtitle: string;
  manifesto: string;
  accentQuote: string;
  mediaIds: string[];
}

export interface EditorialCollection {
  id: string;
  title: string;
  subtitle: string;
  curator: string;
  issue: string;
  heroImage: string;
  description: string;
  tags: string[];
  itemIds: string[];
}

export interface Creator {
  id: string;
  name: string;
  role: string; // "Auteur / AI Filmmaker", "Director & Screenwriter"
  portrait: string;
  bio: string;
  bornLocation: string;
  manifesto: string;
  filmsCount: number;
  followers: number;
  views: string;
  toolsUsed?: string[];
  knownFor: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
}

export interface UserPreferences {
  favoriteGenres: string[];
  favoriteMoods: string[];
  favoriteLanguages: string[];
  preferredRuntime?: string | null;
  preferredContentTypes: string[];
  preferredProviders: string[];
}

export type SavedCategory = 'wishlist' | 'watching' | 'watched' | 'favorite';

export interface SavedMediaItem {
  mediaId: string;
  savedAt: string;
  category: SavedCategory;
  userRating?: number;
  userNote?: string;
  progressSeason?: number;
  progressEpisode?: number;
  progressPercentage?: number;
}
