import { MediaItem, Season, Episode } from '../../types.js';

export function transformBackendMovie(item: any): MediaItem {
  if (!item) return item;

  const genres = item.genres ? item.genres.map((g: any) => g.genre?.name || g.name || g) : [];
  const moods = item.moods ? item.moods.map((m: any) => m.mood?.slug || m.slug || m) : [];
  const director = item.creators?.find((c: any) => c.role === 'Director')?.creator?.name || item.director || 'Đạo diễn';
  const directorId = item.creators?.find((c: any) => c.role === 'Director')?.creator?.slug || item.directorId;
  const cast = item.creators?.filter((c: any) => c.role === 'Actor').map((c: any) => c.creator?.name) || item.cast || [];

  const streamingOptions = item.availability?.map((a: any) => ({
    provider: a.provider?.name || a.provider,
    type: a.type?.toLowerCase() || 'subscription',
    region: a.region || 'Global',
    url: a.url || 'https://bienphim.vn',
    badge: a.badge,
    price: a.price,
  })) || item.streamingOptions || [];

  const subtitlesAvailable = item.subtitles?.map((s: any) => ({
    language: s.language,
    isAiAssisted: s.isAiAssisted,
    sampleDialogue: s.sampleOriginal
      ? { original: s.sampleOriginal, translated: s.sampleTranslated }
      : undefined,
  })) || item.subtitlesAvailable || [];

  const aiMattersAnalysis = item.aiInsight
    ? {
        themes: item.aiInsight.themes,
        mood: item.aiInsight.mood,
        visualStyle: item.aiInsight.visualStyle,
        narrativeStyle: item.aiInsight.narrativeStyle,
        emotionalIntensity: item.aiInsight.emotionalIntensity,
        audienceFit: item.aiInsight.audienceFit,
      }
    : item.aiMattersAnalysis;

  const aiInvolvement = item.isAiFilm || item.toolsUsed?.length
    ? {
        isAiFilm: true,
        toolsUsed: item.toolsUsed || [],
        promptDirector: item.promptDirector,
        workflowNotes: item.workflowNotes,
      }
    : item.aiInvolvement;

  return {
    id: item.slug || item.id,
    title: item.title,
    originalTitle: item.originalTitle,
    tagline: item.tagline,
    year: item.year || item.startYear || 2026,
    type: (item.type?.toLowerCase() || 'movie') as any,
    director,
    directorId,
    cast,
    genres,
    moods,
    runtime: item.runtimeMinutes ? `${item.runtimeMinutes} min` : item.runtime || '100 min',
    runtimeMinutes: item.runtimeMinutes || 100,
    rating: item.rating || 8.5,
    editorialQuote: item.editorialQuote,
    synopsis: item.synopsis,
    backdropUrl: item.backdropUrl,
    posterUrl: item.posterUrl,
    monochromePosterUrl: item.monochromePosterUrl,
    isCoverFeature: item.isCoverFeature,
    isTrending: item.isTrending,
    aiMatchScore: item.aiInsight?.aiMatchScore || item.aiMatchScore || 92,
    whyYouMayLike: item.aiInsight?.whyYouMayLike || item.whyYouMayLike,
    aiMattersAnalysis,
    aiInvolvement,
    streamingOptions,
    subtitlesAvailable,
  };
}

export function transformBackendSeries(item: any): MediaItem {
  if (!item) return item;

  const genres = item.genres ? item.genres.map((g: any) => g.genre?.name || g.name || g) : [];
  const moods = item.moods ? item.moods.map((m: any) => m.mood?.slug || m.slug || m) : [];
  const director = item.creators?.find((c: any) => c.role === 'Creator' || c.role === 'Director')?.creator?.name || 'Showrunner';

  const streamingOptions = item.availability?.map((a: any) => ({
    provider: a.provider?.name || a.provider,
    type: a.type?.toLowerCase() || 'subscription',
    region: a.region || 'Global',
    url: a.url || 'https://bienphim.vn',
    badge: a.badge,
    price: a.price,
  })) || item.streamingOptions || [];

  const seasons: Season[] = item.seasons?.map((s: any) => ({
    seasonNumber: s.seasonNumber,
    title: s.title,
    year: s.year || item.startYear,
    episodeCount: s.episodes?.length || s.episodeCount || 0,
    episodes: s.episodes?.map((ep: any): Episode => ({
      id: ep.id,
      seasonNumber: s.seasonNumber,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      runtime: `${ep.runtimeMinutes || 45} min`,
      airDate: ep.airDate || '2026',
      synopsis: ep.overview,
      thumbnail: ep.thumbnailUrl,
      playbackProgress: ep.watchProgress?.[0]?.percentage || 0,
      aiRecap: ep.aiRecap,
      keyCharacters: ep.keyCharacters || [],
      majorThemes: ep.majorThemes || [],
      emotionalTone: ep.emotionalTone,
      importantEvents: ep.importantEvents || [],
      beforeYouWatchNote: ep.beforeYouWatchNote,
    })),
  })) || [];

  return {
    id: item.slug || item.id,
    title: item.title,
    originalTitle: item.originalTitle,
    tagline: item.tagline,
    year: item.startYear || 2026,
    type: 'series',
    director,
    genres,
    moods,
    runtime: `${seasons.length || 1} Mùa`,
    runtimeMinutes: 45,
    rating: item.rating || 9.0,
    editorialQuote: item.editorialQuote,
    synopsis: item.synopsis,
    backdropUrl: item.backdropUrl,
    posterUrl: item.posterUrl,
    monochromePosterUrl: item.monochromePosterUrl,
    isCoverFeature: item.isCoverFeature,
    isTrending: item.isTrending,
    aiMatchScore: item.aiInsight?.aiMatchScore || 95,
    whyYouMayLike: item.aiInsight?.whyYouMayLike,
    aiMattersAnalysis: item.aiInsight
      ? {
          themes: item.aiInsight.themes,
          mood: item.aiInsight.mood,
          visualStyle: item.aiInsight.visualStyle,
          narrativeStyle: item.aiInsight.narrativeStyle,
          emotionalIntensity: item.aiInsight.emotionalIntensity,
          audienceFit: item.aiInsight.audienceFit,
        }
      : undefined,
    streamingOptions,
    subtitlesAvailable: item.subtitles?.map((s: any) => ({
      language: s.language,
      isAiAssisted: s.isAiAssisted,
    })) || [],
    cast: item.creators?.filter((c: any) => c.role === 'Actor').map((c: any) => c.creator?.name) || [],
    seasons,
  };
}
