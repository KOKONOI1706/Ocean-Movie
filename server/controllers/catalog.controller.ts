import { Request, Response, NextFunction } from 'express';
import { movieAdminService } from '../services/catalog/movie-admin.service.js';
import { seriesAdminService } from '../services/catalog/series-admin.service.js';
import { genreAdminService } from '../services/catalog/genre-admin.service.js';
import { auditActor } from '../services/audit.service.js';
import { apiPaginated, apiSuccess } from '../utils/response.js';

/** Actor plus current (database) role, for services that check per-action permissions. */
const staff = (req: Request) => ({ ...auditActor(req), role: req.user!.role });

/** Wrap a handler: resolve its value into the success envelope, pass errors on. */
function handle(fn: (req: Request) => Promise<unknown>, status = 200) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return apiSuccess(res, await fn(req), status);
    } catch (err) {
      next(err);
    }
  };
}

function handleList(fn: (req: Request) => Promise<{ items: unknown[]; pagination: Parameters<typeof apiPaginated>[2] }>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, pagination } = await fn(req);
      return apiPaginated(res, items, pagination);
    } catch (err) {
      next(err);
    }
  };
}

const query = (req: Request) => req.query as any;

export const catalogController = {
  listMovies: handleList((req) => movieAdminService.list(query(req))),
  getMovie: handle((req) => movieAdminService.get(req.params.id)),
  createMovie: handle((req) => movieAdminService.create(auditActor(req), req.body), 201),
  updateMovie: handle((req) => movieAdminService.update(auditActor(req), req.params.id, req.body)),
  deleteMovie: handle((req) => movieAdminService.remove(staff(req), req.params.id, query(req).hard)),
  bulkMovies: handle((req) => movieAdminService.bulk(staff(req), req.body.ids, req.body.action)),

  listSeries: handleList((req) => seriesAdminService.list(query(req))),
  getSeriesTree: handle((req) => seriesAdminService.tree(req.params.id)),
  createSeries: handle((req) => seriesAdminService.create(auditActor(req), req.body), 201),
  updateSeries: handle((req) => seriesAdminService.update(auditActor(req), req.params.id, req.body)),
  deleteSeries: handle((req) => seriesAdminService.remove(staff(req), req.params.id, query(req).hard)),
  bulkSeries: handle((req) => seriesAdminService.bulk(staff(req), req.body.ids, req.body.action)),

  createSeason: handle((req) => seriesAdminService.createSeason(auditActor(req), req.params.id, req.body), 201),
  updateSeason: handle((req) => seriesAdminService.updateSeason(auditActor(req), req.params.id, req.body)),
  publishSeason: handle((req) => seriesAdminService.publishSeason(auditActor(req), req.params.id, req.body.publishStatus, req.body.cascade)),
  deleteSeason: handle((req) => seriesAdminService.deleteSeason(auditActor(req), req.params.id)),
  reorderEpisodes: handle((req) => seriesAdminService.reorderEpisodes(auditActor(req), req.params.id, req.body.episodeIds)),

  createEpisode: handle((req) => seriesAdminService.createEpisode(auditActor(req), req.params.id, req.body), 201),
  updateEpisode: handle((req) => seriesAdminService.updateEpisode(auditActor(req), req.params.id, req.body)),
  deleteEpisode: handle((req) => seriesAdminService.deleteEpisode(auditActor(req), req.params.id)),

  listGenres: handle(() => genreAdminService.list()),
  createGenre: handle((req) => genreAdminService.create(auditActor(req), req.body.name), 201),
  renameGenre: handle((req) => genreAdminService.rename(auditActor(req), req.params.id, req.body.name)),
  deleteGenre: handle((req) => genreAdminService.remove(auditActor(req), req.params.id)),
};
