import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function apiSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function apiPaginated<T>(res: Response, data: T[], pagination: PaginationMeta, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}

export function apiError(res: Response, code: string, message: string, statusCode: number = 500, details?: unknown) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
