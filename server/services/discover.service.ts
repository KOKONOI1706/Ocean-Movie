import { movieRepository } from '../repositories/movie.repository.js';
import { seriesRepository } from '../repositories/series.repository.js';
import { prisma } from '../config/prisma.js';

export class DiscoverService {
  async getTrending() {
    const [movies, series] = await Promise.all([
      movieRepository.findTrending(10),
      seriesRepository.findMany({ isTrending: true, limit: 10 }),
    ]);

    return {
      movies,
      series: series.items,
    };
  }

  async getNewArrivals() {
    return movieRepository.findNew(12);
  }

  async getHiddenGems() {
    return movieRepository.findHiddenGems(10);
  }

  async getShortFilms() {
    return movieRepository.findShortFilms(10);
  }

  async getAiFilms() {
    return movieRepository.findAiFilms(10);
  }

  async getRecommended(userId?: string) {
    if (userId) {
      // Find user preferences or ratings
      const preference = await prisma.userPreference.findUnique({
        where: { userId },
      });

      const userRatings = await prisma.rating.findMany({
        where: { userId },
        include: {
          movie: { include: { genres: { include: { genre: true } } } },
          series: { include: { genres: { include: { genre: true } } } },
        },
      });

      // Extract user preferred genres
      const favoredGenreSlugs = new Set<string>();
      for (const r of userRatings) {
        if (r.score >= 8) {
          r.movie?.genres.forEach((g) => favoredGenreSlugs.add(g.genre.slug));
          r.series?.genres.forEach((g) => favoredGenreSlugs.add(g.genre.slug));
        }
      }

      if (favoredGenreSlugs.size > 0 || (preference?.favoriteGenres && preference.favoriteGenres.length > 0)) {
        const queryGenres = Array.from(favoredGenreSlugs);
        const candidates = await prisma.movie.findMany({
          where: {
            OR: [
              { genres: { some: { genre: { slug: { in: queryGenres } } } } },
              { rating: { gte: 8.5 } },
            ],
          },
          take: 10,
          orderBy: { rating: 'desc' },
          include: {
            genres: { include: { genre: true } },
            availability: { include: { provider: true } },
            aiInsight: true,
          },
        });
        return candidates;
      }
    }

    // Default top curated recommendations
    return prisma.movie.findMany({
      where: {
        OR: [{ isCoverFeature: true }, { rating: { gte: 8.8 } }],
      },
      take: 10,
      orderBy: { rating: 'desc' },
      include: {
        genres: { include: { genre: true } },
        availability: { include: { provider: true } },
        aiInsight: true,
      },
    });
  }
}

export const discoverService = new DiscoverService();
