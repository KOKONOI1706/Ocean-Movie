import { Request, Response, NextFunction } from 'express';
import { aggregatorService } from '../aggregator/aggregator.service.js';
import { parseEpisodeTitle, parseMovieTitle } from '../aggregator/normalizer.js';
import { libraryService } from '../aggregator/library.service.js';
import { apiPaginated, apiSuccess } from '../utils/response.js';
import { auditActor, auditService } from '../services/audit.service.js';
import type { IngestReport } from '../aggregator/aggregator.service.js';

/** What an import changed, small enough for the audit log (ids, not full payloads). */
function reportSummary(report: IngestReport) {
  return {
    seriesIds: report.series.map((s) => s.id),
    movieIds: report.movies.map((m) => m.id),
    episodesCreated: report.episodesCreated,
    episodesUpdated: report.episodesUpdated,
    skipped: report.skipped.length,
  };
}

export class AggregatorController {
  async parse(req: Request, res: Response, next: NextFunction) {
    try {
      // kind: 'episode' (explicit marker), 'ambiguous' (bare trailing number:
      // an episode in series mode, a film in auto mode) or 'movie'.
      const results = (req.body.titles as string[]).map((title) => {
        const episode = parseEpisodeTitle(title);
        const kind = episode ? (episode.explicit ? 'episode' : 'ambiguous') : 'movie';
        return { title, kind, episode, movie: parseMovieTitle(title) };
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
      await auditService.record(auditActor(req), {
        action: 'aggregator.ingest',
        resourceType: 'Import',
        before: { items: items.length, sourceName, mode, movieType },
        after: reportSummary(report),
      });
      return apiSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  }

  async scrape(req: Request, res: Response, next: NextFunction) {
    try {
      const { urls, sourceName, mode, movieType } = req.body;
      const report = await aggregatorService.scrapeUrls(urls, { sourceName, mode, movieType });
      await auditService.record(auditActor(req), {
        action: 'aggregator.scrape',
        resourceType: 'Import',
        before: { urls, sourceName, mode, movieType },
        after: reportSummary(report),
      });
      return apiSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, sources, limit, sourceName, mode, movieType } = req.body;
      const report = await aggregatorService.search(query, sources, limit, { sourceName, mode, movieType });
      await auditService.record(auditActor(req), {
        action: 'aggregator.search',
        resourceType: 'Import',
        before: { query, sources, limit, sourceName, mode, movieType },
        after: reportSummary(report),
      });
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

export class AggregatorLibraryController {
  async stats(_req: Request, res: Response, next: NextFunction) {
    try {
      return apiSuccess(res, await libraryService.stats());
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await libraryService.list(req.query as any);
      return apiPaginated(res, result.items as unknown[], result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async updateMovie(req: Request, res: Response, next: NextFunction) {
    try {
      return apiSuccess(res, await libraryService.updateMovie(auditActor(req), req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }

  async updateSeries(req: Request, res: Response, next: NextFunction) {
    try {
      return apiSuccess(res, await libraryService.updateSeries(auditActor(req), req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }

  async removeMovieStream(req: Request, res: Response, next: NextFunction) {
    try {
      return apiSuccess(res, await libraryService.removeMovieStream(auditActor(req), req.params.id));
    } catch (err) {
      next(err);
    }
  }

  async removeEpisodeStream(req: Request, res: Response, next: NextFunction) {
    try {
      return apiSuccess(res, await libraryService.removeEpisodeStream(auditActor(req), req.params.id));
    } catch (err) {
      next(err);
    }
  }
}

export const aggregatorLibraryController = new AggregatorLibraryController();

export const aggregatorController = new AggregatorController();
