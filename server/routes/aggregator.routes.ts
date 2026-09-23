import { Router } from 'express';
import { aggregatorController, aggregatorLibraryController as library } from '../controllers/aggregator.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  idParamSchema,
  ingestBodySchema,
  libraryQuerySchema,
  mediaPatchSchema,
  parseBodySchema,
  scrapeBodySchema,
  searchBodySchema,
} from '../validators/aggregator.validator.js';

export const aggregatorRouter = Router();

// Scraping reaches out to third-party hosts and writes to the catalogue: staff only.
aggregatorRouter.use(requireAuth, requireRole('ADMIN', 'CURATOR'));

aggregatorRouter.get('/sources', aggregatorController.listSources);
aggregatorRouter.post('/parse', validateBody(parseBodySchema), aggregatorController.parse);
aggregatorRouter.post('/ingest', validateBody(ingestBodySchema), aggregatorController.ingest);
aggregatorRouter.post('/scrape', validateBody(scrapeBodySchema), aggregatorController.scrape);
aggregatorRouter.post('/search', validateBody(searchBodySchema), aggregatorController.search);

// Admin dashboard: stats and the crawled-content library
aggregatorRouter.get('/stats', library.stats);
aggregatorRouter.get('/library', validateQuery(libraryQuerySchema), library.list);
aggregatorRouter.patch('/movies/:id', validateParams(idParamSchema), validateBody(mediaPatchSchema), library.updateMovie);
aggregatorRouter.patch('/series/:id', validateParams(idParamSchema), validateBody(mediaPatchSchema), library.updateSeries);
aggregatorRouter.delete('/movies/:id/stream', validateParams(idParamSchema), library.removeMovieStream);
aggregatorRouter.delete('/episodes/:id/stream', validateParams(idParamSchema), library.removeEpisodeStream);
