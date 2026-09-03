import { Router } from 'express';
import { movieController } from '../controllers/movie.controller.js';
import { interactionController } from '../controllers/interaction.controller.js';
import { validateQuery, validateBody } from '../middleware/validate.middleware.js';
import { movieQuerySchema } from '../validators/movie.validator.js';
import { ratingSchema } from '../validators/interaction.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const movieRouter = Router();

movieRouter.get('/', validateQuery(movieQuerySchema), movieController.getMovies);
movieRouter.get('/:id', movieController.getMovieById);

// Movie ratings
movieRouter.get('/:id/ratings', interactionController.getMovieRatings);
movieRouter.post('/:id/ratings', requireAuth, validateBody(ratingSchema), interactionController.rateMovie);
movieRouter.delete('/:id/ratings', requireAuth, interactionController.deleteMovieRating);
