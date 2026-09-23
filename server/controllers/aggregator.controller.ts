import { Request, Response, NextFunction } from 'express';
import { aggregatorService } from '../aggregator/aggregator.service.js';
import { parseEpisodeTitle, parseMovieTitle } from '../aggregator/normalizer.js';
import { apiSuccess } from '../utils/response.js';

export class AggregatorController {
  async parse(req: Request, res: Response, next: NextFunction) {
    try {
      const results = (req.body.titles as string[]).map((title) => {
        const episode = parseEpisodeTitle(title);
        return { title, kind: episode ? 'episode' : 'movie', parsed: episode ?? parseMovieTitle(title) };
      });
      return apiSuccess(res, results);
    } catch (err) {
      next(err);
    }
  }

  async ingest(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, sourceName, mode, movieType } = req.body;
      const report = await aggregatorService.ingest(items, { sourceName, mode, movieType });
      return apiSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  }

  async scrape(req: Request, res: Response, next: NextFunction) {
    try {
      const { urls, sourceName, mode, movieType } = req.body;
      const report = await aggregatorService.scrapeUrls(urls, { sourceName, mode, movieType });
      return apiSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, sources, limit, sourceName, mode, movieType } = req.body;
      const report = await aggregatorService.search(query, sources, limit, { sourceName, mode, movieType });
      return apiSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  }

  async listSources(_req: Request, res: Response, next: NextFunction) {
    try {
      return apiSuccess(res, aggregatorService.listSources());
    } catch (err) {
      next(err);
    }
  }
}

export const aggregatorController = new AggregatorController();
