import { PrismaClient, MediaType, AvailabilityType, WatchlistCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CINEMA_ITEMS, MOOD_CATEGORIES } from '../src/data/cinemaData.js';
import { EDITORIAL_COLLECTIONS, CREATORS_DATA, INITIAL_USER_TASTE } from '../src/data/collectionsData.js';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function mapMediaType(typeStr: string): MediaType {
  switch (typeStr?.toLowerCase()) {
    case 'series':
      return MediaType.SERIES;
    case 'short':
      return MediaType.SHORT;
    case 'ai_film':
      return MediaType.AI_FILM;
    case 'documentary':
      return MediaType.DOCUMENTARY;
    case 'anime':
      return MediaType.ANIME;
    default:
      return MediaType.MOVIE;
  }
}

function mapAvailabilityType(typeStr: string): AvailabilityType {
  switch (typeStr?.toLowerCase()) {
    case 'free':
      return AvailabilityType.FREE;
    case 'rent':
      return AvailabilityType.RENT;
    case 'buy':
      return AvailabilityType.BUY;
    default:
      return AvailabilityType.SUBSCRIPTION;
  }
}

export async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Demo Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@bienphim.vn' },
    update: {},
    create: {
      email: 'demo@bienphim.vn',
      username: 'duycuong',
      displayName: INITIAL_USER_TASTE.name || 'Nguyễn Duy Cương',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      role: 'USER',
      preference: {
        create: {
          favoriteGenres: INITIAL_USER_TASTE.topGenres.map((g) => g.genre),
          favoriteMoods: INITIAL_USER_TASTE.favoriteMoods,
          preferredProviders: INITIAL_USER_TASTE.activeStreamingServices,
          editorialSummary: INITIAL_USER_TASTE.editorialSummary
        }
      }
    }
  });
  console.log(`👤 User seeded: ${user.email} (password: password123)`);

  // 2. Seed Moods
  const moodMap = new Map<string, string>(); // slug -> id
  for (const m of MOOD_CATEGORIES) {
    const moodRecord = await prisma.mood.upsert({
      where: { slug: m.id },
      update: {
        name: m.title,
        subtitle: m.subtitle,
        manifesto: m.manifesto,
        accentQuote: m.accentQuote
      },
      create: {
        name: m.title,
        slug: m.id,
        subtitle: m.subtitle,
        manifesto: m.manifesto,
        accentQuote: m.accentQuote
      }
    });
    moodMap.set(m.id, moodRecord.id);
  }
  console.log(`🌊 Seeded ${moodMap.size} Mood categories`);

  // 3. Seed Creators
  const creatorMap = new Map<string, string>(); // slug -> id
  for (const c of CREATORS_DATA) {
    const creatorRecord = await prisma.creator.upsert({
      where: { slug: c.id },
      update: {
        name: c.name,
        role: c.role,
        portrait: c.portrait,
        bio: c.bio,
        bornLocation: c.bornLocation,
        manifesto: c.manifesto,
        filmsCount: c.filmsCount,
        followers: c.followers,
        views: c.views,
        toolsUsed: c.toolsUsed || [],
        knownFor: c.knownFor || []
      },
      create: {
        name: c.name,
        slug: c.id,
        role: c.role,
        portrait: c.portrait,
        bio: c.bio,
        bornLocation: c.bornLocation,
        manifesto: c.manifesto,
        filmsCount: c.filmsCount,
        followers: c.followers,
        views: c.views,
        toolsUsed: c.toolsUsed || [],
        knownFor: c.knownFor || []
      }
    });
    creatorMap.set(c.id, creatorRecord.id);
  }

  // 4. Seed Streaming Providers
  const providerMap = new Map<string, string>(); // name -> id
  const allProviders = new Set<string>();
  for (const item of CINEMA_ITEMS) {
    for (const opt of item.streamingOptions || []) {
      if (opt.provider) allProviders.add(opt.provider.trim());
    }
  }

  for (const pName of allProviders) {
    const pSlug = slugify(pName);
    const pRecord = await prisma.provider.upsert({
      where: { slug: pSlug },
      update: { name: pName },
      create: {
        name: pName,
        slug: pSlug,
        websiteUrl: `https://${pSlug}.com`
      }
    });
    providerMap.set(pName, pRecord.id);
  }
  console.log(`📺 Seeded ${providerMap.size} Providers`);

  // 5. Seed Genres (collected across all media)
  const genreMap = new Map<string, string>(); // name -> id
  const allGenres = new Set<string>();
  for (const item of CINEMA_ITEMS) {
    for (const g of item.genres || []) {
      if (g) allGenres.add(g.trim());
    }
  }

  for (const gName of allGenres) {
    const gSlug = slugify(gName);
    const gRecord = await prisma.genre.upsert({
      where: { slug: gSlug },
      update: { name: gName },
      create: {
        name: gName,
        slug: gSlug
      }
    });
    genreMap.set(gName, gRecord.id);
  }
  console.log(`🎭 Seeded ${genreMap.size} Genres`);

  // 6. Seed Movies and Series
  let moviesCount = 0;
  let seriesCount = 0;
  let seasonsCount = 0;
  let episodesCount = 0;

  const movieMap = new Map<string, string>(); // item.id -> db id
  const seriesMap = new Map<string, string>(); // item.id -> db id

  for (const item of CINEMA_ITEMS) {
    const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);

    // If item has a director/creator, ensure creator exists
    let directorId: string | null = null;
    if (item.director) {
      const dSlug = item.directorId || slugify(item.director);
      if (!creatorMap.has(dSlug)) {
        const newCreator = await prisma.creator.upsert({
          where: { slug: dSlug },
          update: { name: item.director },
          create: {
            name: item.director,
            slug: dSlug,
            role: 'Đạo diễn',
            bio: `Đạo diễn của tác phẩm ${item.title}`
          }
        });
        creatorMap.set(dSlug, newCreator.id);
      }
      directorId = creatorMap.get(dSlug)!;
    }

    if (isSeries) {
      // Create Series
      const seriesRecord = await prisma.series.upsert({
        where: { slug: item.id },
        update: {
          title: item.title,
          originalTitle: item.originalTitle,
          tagline: item.tagline,
          synopsis: item.synopsis,
          startYear: item.year,
          rating: item.rating,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          monochromePosterUrl: item.monochromePosterUrl,
          editorialQuote: item.editorialQuote,
          isCoverFeature: item.isCoverFeature || false,
          isTrending: item.isTrending || false
        },
        create: {
          slug: item.id,
          title: item.title,
          originalTitle: item.originalTitle,
          tagline: item.tagline,
          synopsis: item.synopsis,
          startYear: item.year,
          rating: item.rating,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          monochromePosterUrl: item.monochromePosterUrl,
          editorialQuote: item.editorialQuote,
          isCoverFeature: item.isCoverFeature || false,
          isTrending: item.isTrending || false
        }
      });
      seriesMap.set(item.id, seriesRecord.id);
      seriesCount++;

      // Connect Genres
      for (const gName of item.genres || []) {
        const gId = genreMap.get(gName);
        if (gId) {
          await prisma.seriesGenre.upsert({
            where: { seriesId_genreId: { seriesId: seriesRecord.id, genreId: gId } },
            update: {},
            create: { seriesId: seriesRecord.id, genreId: gId }
          });
        }
      }

      // Connect Moods
      for (const mId of item.moods || []) {
        const moodDbId = moodMap.get(mId);
        if (moodDbId) {
          await prisma.seriesMood.upsert({
            where: { seriesId_moodId: { seriesId: seriesRecord.id, moodId: moodDbId } },
            update: {},
            create: { seriesId: seriesRecord.id, moodId: moodDbId }
          });
        }
      }

      // Connect Creator
      if (directorId) {
        await prisma.seriesCreator.upsert({
          where: { seriesId_creatorId_role: { seriesId: seriesRecord.id, creatorId: directorId, role: 'Director' } },
          update: {},
          create: { seriesId: seriesRecord.id, creatorId: directorId, role: 'Director' }
        });
      }

      // Connect Availability
      for (const opt of item.streamingOptions || []) {
        const pId = providerMap.get(opt.provider?.trim());
        if (pId) {
          await prisma.availability.create({
            data: {
              providerId: pId,
              seriesId: seriesRecord.id,
              region: opt.region || 'Global',
              type: mapAvailabilityType(opt.type),
              url: opt.url || 'https://bienphim.vn',
              price: opt.price,
              badge: opt.badge
            }
          });
        }
      }

      // Connect Subtitles
      for (const sub of item.subtitlesAvailable || []) {
        await prisma.subtitle.create({
          data: {
            seriesId: seriesRecord.id,
            language: sub.language,
            isAiAssisted: sub.isAiAssisted || false,
            sampleOriginal: sub.sampleDialogue?.original,
            sampleTranslated: sub.sampleDialogue?.translated
          }
        });
      }

      // AI Insight
      if (item.aiMattersAnalysis || item.whyYouMayLike) {
        await prisma.aIInsight.upsert({
          where: { seriesId: seriesRecord.id },
          update: {},
          create: {
            seriesId: seriesRecord.id,
            aiMatchScore: item.aiMatchScore,
            whyYouMayLike: item.whyYouMayLike,
            themes: item.aiMattersAnalysis?.themes,
            mood: item.aiMattersAnalysis?.mood,
            visualStyle: item.aiMattersAnalysis?.visualStyle,
            narrativeStyle: item.aiMattersAnalysis?.narrativeStyle,
            emotionalIntensity: item.aiMattersAnalysis?.emotionalIntensity,
            audienceFit: item.aiMattersAnalysis?.audienceFit
          }
        });
      }

      // Seasons and Episodes
      for (const s of item.seasons || []) {
        const seasonRecord = await prisma.season.upsert({
          where: { seriesId_seasonNumber: { seriesId: seriesRecord.id, seasonNumber: s.seasonNumber } },
          update: {
            title: s.title,
            year: s.year,
            episodeCount: s.episodes?.length || s.episodeCount || 0
          },
          create: {
            seriesId: seriesRecord.id,
            seasonNumber: s.seasonNumber,
            title: s.title,
            year: s.year,
            episodeCount: s.episodes?.length || s.episodeCount || 0
          }
        });
        seasonsCount++;

        for (const ep of s.episodes || []) {
          const epRecord = await prisma.episode.upsert({
            where: { seasonId_episodeNumber: { seasonId: seasonRecord.id, episodeNumber: ep.episodeNumber } },
            update: {
              title: ep.title,
              overview: ep.synopsis || '',
              runtimeMinutes: parseInt(ep.runtime) || 45,
              airDate: ep.airDate,
              thumbnailUrl: ep.thumbnail,
              aiRecap: ep.aiRecap,
              keyCharacters: ep.keyCharacters || [],
              majorThemes: ep.majorThemes || [],
              emotionalTone: ep.emotionalTone,
              importantEvents: ep.importantEvents || [],
              beforeYouWatchNote: ep.beforeYouWatchNote
            },
            create: {
              seasonId: seasonRecord.id,
              episodeNumber: ep.episodeNumber,
              title: ep.title,
              overview: ep.synopsis || '',
              runtimeMinutes: parseInt(ep.runtime) || 45,
              airDate: ep.airDate,
              thumbnailUrl: ep.thumbnail,
              aiRecap: ep.aiRecap,
              keyCharacters: ep.keyCharacters || [],
              majorThemes: ep.majorThemes || [],
              emotionalTone: ep.emotionalTone,
              importantEvents: ep.importantEvents || [],
              beforeYouWatchNote: ep.beforeYouWatchNote
            }
          });
          episodesCount++;

          // If episode has progress, add demo progress
          if (ep.playbackProgress) {
            await prisma.watchProgress.upsert({
              where: { userId_episodeId: { userId: user.id, episodeId: epRecord.id } },
              update: { percentage: ep.playbackProgress },
              create: {
                userId: user.id,
                episodeId: epRecord.id,
                percentage: ep.playbackProgress,
                durationSeconds: (parseInt(ep.runtime) || 45) * 60,
                progressSeconds: Math.floor(((parseInt(ep.runtime) || 45) * 60 * ep.playbackProgress) / 100),
                completed: ep.playbackProgress >= 95
              }
            });
          }
        }
      }
    } else {
      // Create Movie
      const movieRecord = await prisma.movie.upsert({
        where: { slug: item.id },
        update: {
          title: item.title,
          originalTitle: item.originalTitle,
          tagline: item.tagline,
          synopsis: item.synopsis,
          year: item.year,
          runtimeMinutes: item.runtimeMinutes || 100,
          rating: item.rating,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          monochromePosterUrl: item.monochromePosterUrl,
          type: mapMediaType(item.type),
          isCoverFeature: item.isCoverFeature || false,
          isTrending: item.isTrending || false,
          editorialQuote: item.editorialQuote,
          isAiFilm: item.aiInvolvement?.isAiFilm || item.type === 'ai_film',
          toolsUsed: item.aiInvolvement?.toolsUsed || [],
          promptDirector: item.aiInvolvement?.promptDirector,
          workflowNotes: item.aiInvolvement?.workflowNotes
        },
        create: {
          slug: item.id,
          title: item.title,
          originalTitle: item.originalTitle,
          tagline: item.tagline,
          synopsis: item.synopsis,
          year: item.year,
          runtimeMinutes: item.runtimeMinutes || 100,
          rating: item.rating,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          monochromePosterUrl: item.monochromePosterUrl,
          type: mapMediaType(item.type),
          isCoverFeature: item.isCoverFeature || false,
          isTrending: item.isTrending || false,
          editorialQuote: item.editorialQuote,
          isAiFilm: item.aiInvolvement?.isAiFilm || item.type === 'ai_film',
          toolsUsed: item.aiInvolvement?.toolsUsed || [],
          promptDirector: item.aiInvolvement?.promptDirector,
          workflowNotes: item.aiInvolvement?.workflowNotes
        }
      });
      movieMap.set(item.id, movieRecord.id);
      moviesCount++;

      // Connect Genres
      for (const gName of item.genres || []) {
        const gId = genreMap.get(gName);
        if (gId) {
          await prisma.movieGenre.upsert({
            where: { movieId_genreId: { movieId: movieRecord.id, genreId: gId } },
            update: {},
            create: { movieId: movieRecord.id, genreId: gId }
          });
        }
      }

      // Connect Moods
      for (const mId of item.moods || []) {
        const moodDbId = moodMap.get(mId);
        if (moodDbId) {
          await prisma.movieMood.upsert({
            where: { movieId_moodId: { movieId: movieRecord.id, moodId: moodDbId } },
            update: {},
            create: { movieId: movieRecord.id, moodId: moodDbId }
          });
        }
      }

      // Connect Director
      if (directorId) {
        await prisma.movieCreator.upsert({
          where: { movieId_creatorId_role: { movieId: movieRecord.id, creatorId: directorId, role: 'Director' } },
          update: {},
          create: { movieId: movieRecord.id, creatorId: directorId, role: 'Director' }
        });
      }

      // Connect Actors
      for (const actor of item.cast || []) {
        const aSlug = slugify(actor);
        let aId = creatorMap.get(aSlug);
        if (!aId) {
          const newActor = await prisma.creator.upsert({
            where: { slug: aSlug },
            update: { name: actor },
            create: { name: actor, slug: aSlug, role: 'Diễn viên' }
          });
          aId = newActor.id;
          creatorMap.set(aSlug, aId);
        }
        await prisma.movieCreator.upsert({
          where: { movieId_creatorId_role: { movieId: movieRecord.id, creatorId: aId, role: 'Actor' } },
          update: {},
          create: { movieId: movieRecord.id, creatorId: aId, role: 'Actor' }
        });
      }

      // Connect Availability
      for (const opt of item.streamingOptions || []) {
        const pId = providerMap.get(opt.provider?.trim());
        if (pId) {
          await prisma.availability.create({
            data: {
              providerId: pId,
              movieId: movieRecord.id,
              region: opt.region || 'Global',
              type: mapAvailabilityType(opt.type),
              url: opt.url || 'https://bienphim.vn',
              price: opt.price,
              badge: opt.badge
            }
          });
        }
      }

      // Connect Subtitles
      for (const sub of item.subtitlesAvailable || []) {
        await prisma.subtitle.create({
          data: {
            movieId: movieRecord.id,
            language: sub.language,
            isAiAssisted: sub.isAiAssisted || false,
            sampleOriginal: sub.sampleDialogue?.original,
            sampleTranslated: sub.sampleDialogue?.translated
          }
        });
      }

      // Connect AI Insight
      if (item.aiMattersAnalysis || item.whyYouMayLike) {
        await prisma.aIInsight.upsert({
          where: { movieId: movieRecord.id },
          update: {},
          create: {
            movieId: movieRecord.id,
            aiMatchScore: item.aiMatchScore,
            whyYouMayLike: item.whyYouMayLike,
            themes: item.aiMattersAnalysis?.themes,
            mood: item.aiMattersAnalysis?.mood,
            visualStyle: item.aiMattersAnalysis?.visualStyle,
            narrativeStyle: item.aiMattersAnalysis?.narrativeStyle,
            emotionalIntensity: item.aiMattersAnalysis?.emotionalIntensity,
            audienceFit: item.aiMattersAnalysis?.audienceFit
          }
        });
      }
    }
  }
  console.log(`🎬 Seeded ${moviesCount} Movies, ${seriesCount} Series, ${seasonsCount} Seasons, and ${episodesCount} Episodes`);

  // 7. Seed Editorial Collections
  let collectionsCount = 0;
  for (const col of EDITORIAL_COLLECTIONS) {
    const colRecord = await prisma.collection.upsert({
      where: { slug: col.id },
      update: {
        title: col.title,
        subtitle: col.subtitle,
        curator: col.curator,
        issue: col.issue,
        heroImage: col.heroImage,
        description: col.description,
        tags: col.tags
      },
      create: {
        slug: col.id,
        title: col.title,
        subtitle: col.subtitle,
        curator: col.curator,
        issue: col.issue,
        heroImage: col.heroImage,
        description: col.description,
        tags: col.tags
      }
    });
    collectionsCount++;

    // Link movies / series in order
    let order = 0;
    for (const itemId of col.itemIds) {
      if (movieMap.has(itemId)) {
        await prisma.collectionMovie.upsert({
          where: { collectionId_movieId: { collectionId: colRecord.id, movieId: movieMap.get(itemId)! } },
          update: { order },
          create: { collectionId: colRecord.id, movieId: movieMap.get(itemId)!, order }
        });
      } else if (seriesMap.has(itemId)) {
        await prisma.collectionSeries.upsert({
          where: { collectionId_seriesId: { collectionId: colRecord.id, seriesId: seriesMap.get(itemId)! } },
          update: { order },
          create: { collectionId: colRecord.id, seriesId: seriesMap.get(itemId)!, order }
        });
      }
      order++;
    }
  }
  console.log(`📚 Seeded ${collectionsCount} Editorial Collections`);

  // 8. Seed Initial Watchlist & Ratings for Demo User
  const initialSavedItems = ['frieren-journey', 'blade-runner-2049', 'the-last-signal'];
  for (const itemId of initialSavedItems) {
    if (movieMap.has(itemId)) {
      await prisma.watchlist.upsert({
        where: { userId_movieId: { userId: user.id, movieId: movieMap.get(itemId)! } },
        update: {},
        create: { userId: user.id, movieId: movieMap.get(itemId)!, category: WatchlistCategory.WISHLIST }
      });
    } else if (seriesMap.has(itemId)) {
      await prisma.watchlist.upsert({
        where: { userId_seriesId: { userId: user.id, seriesId: seriesMap.get(itemId)! } },
        update: {},
        create: { userId: user.id, seriesId: seriesMap.get(itemId)!, category: WatchlistCategory.WISHLIST }
      });
    }
  }

  // Initial ratings
  const initialRatings: Record<string, number> = {
    interstellar: 9,
    dark: 10,
    'spirited-away': 10,
    'the-last-signal': 9
  };
  for (const [itemId, score] of Object.entries(initialRatings)) {
    if (movieMap.has(itemId)) {
      await prisma.rating.upsert({
        where: { userId_movieId: { userId: user.id, movieId: movieMap.get(itemId)! } },
        update: { score },
        create: { userId: user.id, movieId: movieMap.get(itemId)!, score }
      });
    } else if (seriesMap.has(itemId)) {
      await prisma.rating.upsert({
        where: { userId_seriesId: { userId: user.id, seriesId: seriesMap.get(itemId)! } },
        update: { score },
        create: { userId: user.id, seriesId: seriesMap.get(itemId)!, score }
      });
    }
  }
  console.log(`⭐ Seeded initial watchlist & ratings for user ${user.username}`);
  console.log('✅ Seed finished successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
