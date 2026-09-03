import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { interactionController } from '../controllers/interaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateProfileSchema, updatePreferencesSchema } from '../validators/auth.validator.js';
import { watchlistAddSchema, updateProgressSchema } from '../validators/interaction.validator.js';

export const userRouter = Router();

// All /me routes require authentication
userRouter.use(requireAuth);

// Profile
userRouter.get('/', userController.getMe);
userRouter.patch('/', validateBody(updateProfileSchema), userController.updateMe);

// Preferences
userRouter.get('/preferences', userController.getPreferences);
userRouter.put('/preferences', validateBody(updatePreferencesSchema), userController.updatePreferences);

// Watchlist
userRouter.get('/watchlist', interactionController.getWatchlist);
userRouter.post('/watchlist', validateBody(watchlistAddSchema), interactionController.addToWatchlist);
userRouter.delete('/watchlist/:mediaId', interactionController.removeFromWatchlist);

// Progress
userRouter.get('/progress', interactionController.getProgress);
userRouter.get('/progress/:episodeId', interactionController.getEpisodeProgress);
userRouter.put('/progress/:id', validateBody(updateProgressSchema), interactionController.updateProgress);

// History
userRouter.get('/history', interactionController.getHistory);
userRouter.post('/history', interactionController.recordHistory);
userRouter.delete('/history/:id', interactionController.deleteHistory);

// Ratings
userRouter.get('/ratings', interactionController.getUserRatings);
