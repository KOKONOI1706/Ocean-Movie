import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    // Do not log static assets or noisy endpoints in console
    if (!originalUrl.startsWith('/@') && !originalUrl.startsWith('/src/')) {
      const level = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';
      console.log(`${level} [${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    }
  });

  next();
}
