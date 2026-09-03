import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        next(new ValidationError('Dữ liệu yêu cầu không hợp lệ', issues));
      } else {
        next(err);
      }
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        next(new ValidationError('Tham số truy vấn không hợp lệ', issues));
      } else {
        next(err);
      }
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = (await schema.parseAsync(req.params)) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        next(new ValidationError('Tham số đường dẫn không hợp lệ', issues));
      } else {
        next(err);
      }
    }
  };
}
