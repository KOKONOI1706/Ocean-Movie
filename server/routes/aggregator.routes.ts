import { Router } from 'express';
import { aggregatorController } from '../controllers/aggregator.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  ingestBodySchema,
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
