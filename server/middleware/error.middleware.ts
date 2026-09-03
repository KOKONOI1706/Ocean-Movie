import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { apiError } from '../utils/response.js';
import { env } from '../config/env.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return apiError(res, err.code, err.message, err.statusCode, err.details);
  }

  // Handle Prisma Known Request Errors
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const pErr = err as { code: string; meta?: Record<string, unknown>; message: string };
    if (pErr.code === 'P2002') {
      return apiError(res, 'DUPLICATE_ENTRY', 'Dữ liệu này đã tồn tại trong hệ thống', 409, pErr.meta);
    }
    if (pErr.code === 'P2025') {
      return apiError(res, 'RECORD_NOT_FOUND', 'Bản ghi không tồn tại trong cơ sở dữ liệu', 404);
    }
  }

  const message = err instanceof Error ? err.message : 'Lỗi hệ thống không xác định';
  console.error('💥 Unhandled Exception:', err);

  const details = env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : undefined;
  return apiError(res, 'INTERNAL_SERVER_ERROR', message, 500, details);
}
