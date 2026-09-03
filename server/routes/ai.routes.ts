import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { aiSearchSchema } from '../validators/ai.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const aiRouter = Router();

aiRouter.post('/search', validateBody(aiSearchSchema), aiController.search);
aiRouter.get('/films/:id/insight', aiController.getFilmInsight);
aiRouter.post('/films/:id/insight', aiController.getFilmInsight);
aiRouter.get('/series/:id/insight', aiController.getSeriesInsight);
aiRouter.get('/episodes/:id/recap', aiController.getEpisodeRecap);
aiRouter.get('/taste-profile', requireAuth, aiController.getTasteProfile);
