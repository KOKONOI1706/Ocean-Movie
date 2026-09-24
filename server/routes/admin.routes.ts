import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireMinRole, requireStaff } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { auditQuerySchema, roleChangeSchema, userIdParamSchema, userListQuerySchema } from '../validators/admin.validator.js';
import { catalogController as catalog } from '../controllers/catalog.controller.js';
import { metadataController as metadata } from '../controllers/metadata.controller.js';
import { metadataImportSchema, metadataPreviewSchema, metadataRefreshSchema, metadataSearchQuerySchema } from '../validators/metadata.validator.js';
import {
  bulkSchema,
  catalogIdParamSchema,
  catalogListQuerySchema,
  deleteQuerySchema,
  episodeCreateSchema,
  episodeOrderSchema,
  episodePatchSchema,
  genreSchema,
  movieCreateSchema,
  moviePatchSchema,
  publishSchema,
  seasonCreateSchema,
  seasonPatchSchema,
  seriesCreateSchema,
  seriesPatchSchema,
} from '../validators/catalog.validator.js';

export const adminRouter = Router();

// Every admin route: signed in, and a staff role according to the database (not the JWT).
adminRouter.use(requireStaff('CURATOR'));

adminRouter.get('/me', adminController.me);

adminRouter.get('/users', requireMinRole('ADMIN'), validateQuery(userListQuerySchema), adminController.listUsers);
adminRouter.patch(
  '/users/:id/role',
  requireMinRole('SUPER_ADMIN'),
  validateParams(userIdParamSchema),
  validateBody(roleChangeSchema),
  adminController.changeRole
);

adminRouter.get('/audit', requireMinRole('ADMIN'), validateQuery(auditQuerySchema), adminController.listAudit);

// ── Catalogue ─────────────────────────────────────────────────────────────
// CURATOR+: create, edit, publish/unpublish, feature, reorder.
// ADMIN+: archive (DELETE), bulk archive (checked in the service), delete seasons/episodes/genres.
// SUPER_ADMIN: permanent delete (DELETE ?hard=true, checked in the service).
const id = validateParams(catalogIdParamSchema);
const listQuery = validateQuery(catalogListQuerySchema);
const deleteQuery = validateQuery(deleteQuerySchema);
const adminOnly = requireMinRole('ADMIN');

adminRouter.get('/movies', listQuery, catalog.listMovies);
adminRouter.post('/movies', validateBody(movieCreateSchema), catalog.createMovie);
adminRouter.post('/movies/bulk', validateBody(bulkSchema), catalog.bulkMovies);
adminRouter.get('/movies/:id', id, catalog.getMovie);
adminRouter.patch('/movies/:id', id, validateBody(moviePatchSchema), catalog.updateMovie);
adminRouter.delete('/movies/:id', adminOnly, id, deleteQuery, catalog.deleteMovie);

adminRouter.get('/series', listQuery, catalog.listSeries);
adminRouter.post('/series', validateBody(seriesCreateSchema), catalog.createSeries);
adminRouter.post('/series/bulk', validateBody(bulkSchema), catalog.bulkSeries);
adminRouter.get('/series/:id', id, catalog.getSeriesTree);
adminRouter.patch('/series/:id', id, validateBody(seriesPatchSchema), catalog.updateSeries);
adminRouter.delete('/series/:id', adminOnly, id, deleteQuery, catalog.deleteSeries);
adminRouter.post('/series/:id/seasons', id, validateBody(seasonCreateSchema), catalog.createSeason);

adminRouter.patch('/seasons/:id', id, validateBody(seasonPatchSchema), catalog.updateSeason);
adminRouter.post('/seasons/:id/publish', id, validateBody(publishSchema), catalog.publishSeason);
adminRouter.put('/seasons/:id/episodes/order', id, validateBody(episodeOrderSchema), catalog.reorderEpisodes);
adminRouter.post('/seasons/:id/episodes', id, validateBody(episodeCreateSchema), catalog.createEpisode);
adminRouter.delete('/seasons/:id', adminOnly, id, catalog.deleteSeason);

adminRouter.patch('/episodes/:id', id, validateBody(episodePatchSchema), catalog.updateEpisode);
adminRouter.delete('/episodes/:id', adminOnly, id, catalog.deleteEpisode);

adminRouter.get('/genres', catalog.listGenres);
adminRouter.post('/genres', validateBody(genreSchema), catalog.createGenre);
adminRouter.patch('/genres/:id', id, validateBody(genreSchema), catalog.renameGenre);
adminRouter.delete('/genres/:id', adminOnly, id, catalog.deleteGenre);

// ── Metadata (CURATOR+) ───────────────────────────────────────────────────
adminRouter.get('/metadata/providers', metadata.providers);
adminRouter.get('/metadata/search', validateQuery(metadataSearchQuerySchema), metadata.search);
adminRouter.post('/metadata/preview', validateBody(metadataPreviewSchema), metadata.preview);
adminRouter.post('/metadata/import', validateBody(metadataImportSchema), metadata.import);
adminRouter.post('/metadata/refresh', validateBody(metadataRefreshSchema), metadata.refresh);
