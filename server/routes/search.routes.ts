import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { searchQuerySchema } from '../validators/movie.validator.js';

export const searchRouter = Router();

searchRouter.get('/', validateQuery(searchQuerySchema), searchController.search);
