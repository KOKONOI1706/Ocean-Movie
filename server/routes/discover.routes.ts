import { Router } from 'express';
import { discoverController } from '../controllers/discover.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

export const discoverRouter = Router();

discoverRouter.get('/trending', discoverController.getTrending);
discoverRouter.get('/new', discoverController.getNew);
discoverRouter.get('/hidden-gems', discoverController.getHiddenGems);
discoverRouter.get('/short-films', discoverController.getShortFilms);
discoverRouter.get('/ai-films', discoverController.getAiFilms);
discoverRouter.get('/recommended', optionalAuth, discoverController.getRecommended);
