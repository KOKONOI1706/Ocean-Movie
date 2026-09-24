import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { env } from './config/env.js';
import { apiError } from './utils/response.js';

export function createApp(): Express {
  const app = express();
  const isProduction = env.NODE_ENV === 'production';

  // Security Headers
  app.use(
    helmet({
      // CSP is disabled in development because Vite's dev server relies on
      // inline/eval'd scripts for HMR that a real policy would block.
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"], // app uses inline style={} extensively
              imgSrc: ["'self'", 'data:', 'https:'],
              fontSrc: ["'self'", 'https:', 'data:'],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              frameAncestors: ["'self'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS — only the configured production origin is trusted once deployed;
  // localhost fallbacks are for local development only.
  app.use(
    cors({
      origin: isProduction
        ? [env.CORS_ORIGIN]
        : [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
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

  // Unknown API routes get a JSON 404 instead of falling through to the SPA
  // (an empty/HTML 404 the client can't read). In dev this usually means the
  // server process predates a new route and needs restarting.
  app.use('/api', (req, res) =>
    apiError(res, 'NOT_FOUND', `Không tìm thấy API: ${req.method} ${req.originalUrl}`, 404)
  );

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
