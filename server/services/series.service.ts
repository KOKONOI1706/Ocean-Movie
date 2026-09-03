import { seriesRepository, SeriesFilterParams } from '../repositories/series.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class SeriesService {
  async getSeries(params: SeriesFilterParams) {
    return seriesRepository.findMany(params);
  }

  async getSeriesById(idOrSlug: string) {
    const series = await seriesRepository.findByIdOrSlug(idOrSlug);
    if (!series) {
      throw new NotFoundError(`Không tìm thấy series với mã/slug: "${idOrSlug}"`);
    }
    return series;
  }

  async getSeriesSeasons(idOrSlug: string) {
    const seasons = await seriesRepository.findSeasons(idOrSlug);
    if (!seasons) {
      throw new NotFoundError(`Không tìm thấy series với mã/slug: "${idOrSlug}"`);
    }
    return seasons;
  }

  async getSeriesSeasonByNumber(idOrSlug: string, seasonNumber: number) {
    const season = await seriesRepository.findSeasonByNumber(idOrSlug, seasonNumber);
    if (!season) {
      throw new NotFoundError(`Không tìm thấy mùa ${seasonNumber} của series: "${idOrSlug}"`);
    }
    return season;
  }
}

export const seriesService = new SeriesService();
