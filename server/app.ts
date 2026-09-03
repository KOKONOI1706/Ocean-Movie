import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { env } from './config/env.js';

export function createApp(): Express {
  const app = express();

  // Security Headers (configured to allow Vite dev scripts / images)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for local development with Vite
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Structured Request Logger
  app.use(requestLogger);

  // Rate Limiter for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Max 500 requests per 15 minutes per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
      },
    },
  });

  // Mount API
  app.use('/api', apiLimiter, apiRouter);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
