import { prisma } from '../config/prisma.js';

export class EpisodeRepository {
  async findById(episodeId: string) {
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        season: {
          include: {
            series: {
              include: {
                availability: { include: { provider: true } },
              },
            },
          },
        },
        subtitles: true,
        aiInsight: true,
      },
    });

    if (!episode) return null;

    // Find previous and next episode in the same season
    const [prevEpisode, nextEpisode] = await Promise.all([
      prisma.episode.findFirst({
        where: {
          seasonId: episode.seasonId,
          episodeNumber: episode.episodeNumber - 1,
        },
        select: { id: true, episodeNumber: true, title: true },
      }),
      prisma.episode.findFirst({
        where: {
          seasonId: episode.seasonId,
          episodeNumber: episode.episodeNumber + 1,
        },
        select: { id: true, episodeNumber: true, title: true },
      }),
    ]);

    return {
      episode,
      previousEpisode: prevEpisode,
      nextEpisode: nextEpisode,
    };
  }

  async findBySeasonId(seasonId: string) {
    return prisma.episode.findMany({
      where: { seasonId },
      orderBy: { episodeNumber: 'asc' },
      include: {
        subtitles: true,
      },
    });
  }
}

export const episodeRepository = new EpisodeRepository();
