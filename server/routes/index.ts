import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { movieRouter } from './movie.routes.js';
import { seriesRouter } from './series.routes.js';
import { episodeRouter } from './episode.routes.js';
import { discoverRouter } from './discover.routes.js';
import { searchRouter } from './search.routes.js';
import { collectionRouter } from './collection.routes.js';
import { aiRouter } from './ai.routes.js';
import { prisma } from '../config/prisma.js';
import { aiController } from '../controllers/ai.controller.js';

export const apiRouter = Router();

// Health Check Endpoint
apiRouter.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  return res.json({
    status: 'ok',
    database: dbStatus,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount /api/v1 sub-routers
export const v1Router = Router();
v1Router.use('/auth', authRouter);
v1Router.use('/me', userRouter);
v1Router.use('/movies', movieRouter);
v1Router.use('/series', seriesRouter);
v1Router.use('/episodes', episodeRouter);
v1Router.use('/discover', discoverRouter);
v1Router.use('/search', searchRouter);
v1Router.use('/collections', collectionRouter);
v1Router.use('/ai', aiRouter);

apiRouter.use('/v1', v1Router);

// Backward compatibility for legacy prototype endpoints
apiRouter.post('/ai-search', aiController.search);
apiRouter.post('/film-insight', aiController.getFilmInsight);
