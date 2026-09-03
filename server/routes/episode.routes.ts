import { Router } from 'express';
import { episodeController } from '../controllers/episode.controller.js';

export const episodeRouter = Router();

episodeRouter.get('/:id', episodeController.getEpisodeById);
episodeRouter.get('/season/:seasonId', episodeController.getEpisodesBySeasonId);
