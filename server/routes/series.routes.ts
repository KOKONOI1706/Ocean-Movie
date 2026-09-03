import { Router } from 'express';
import { seriesController } from '../controllers/series.controller.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { seriesQuerySchema } from '../validators/movie.validator.js';

export const seriesRouter = Router();

seriesRouter.get('/', validateQuery(seriesQuerySchema), seriesController.getSeries);
seriesRouter.get('/:id', seriesController.getSeriesById);
seriesRouter.get('/:id/seasons', seriesController.getSeriesSeasons);
seriesRouter.get('/:id/seasons/:seasonNumber', seriesController.getSeriesSeasonByNumber);
