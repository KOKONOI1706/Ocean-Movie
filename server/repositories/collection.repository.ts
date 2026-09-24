import { prisma } from '../config/prisma.js';
import { publicMovie, publicSeason, publicSeries } from './visibility.js';

export class CollectionRepository {
  async findMany() {
    return prisma.collection.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        movies: {
          where: { movie: publicMovie },
          orderBy: { order: 'asc' },
          include: {
            movie: {
              include: {
                genres: { include: { genre: true } },
                availability: { include: { provider: true } },
              },
            },
          },
        },
        series: {
          where: { series: publicSeries },
          orderBy: { order: 'asc' },
          include: {
            series: {
              include: {
                genres: { include: { genre: true } },
                availability: { include: { provider: true } },
                seasons: { where: publicSeason, select: { id: true, seasonNumber: true, episodeCount: true } },
              },
            },
          },
        },
      },
    });
  }

  async findByIdOrSlug(idOrSlug: string) {
    return prisma.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        movies: {
          where: { movie: publicMovie },
          orderBy: { order: 'asc' },
          include: {
            movie: {
              include: {
                genres: { include: { genre: true } },
                availability: { include: { provider: true } },
                creators: { include: { creator: true } },
              },
            },
          },
        },
        series: {
          where: { series: publicSeries },
          orderBy: { order: 'asc' },
          include: {
            series: {
              include: {
                genres: { include: { genre: true } },
                availability: { include: { provider: true } },
                creators: { include: { creator: true } },
                seasons: { where: publicSeason, select: { id: true, seasonNumber: true, episodeCount: true } },
              },
            },
          },
        },
      },
    });
  }
}

export const collectionRepository = new CollectionRepository();
