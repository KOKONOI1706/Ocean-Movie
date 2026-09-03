import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { apiSuccess } from '../utils/response.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return apiSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return apiSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      return apiSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response, _next: NextFunction) {
    return apiSuccess(res, { message: 'Đăng xuất thành công' }, 200);
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      return apiSuccess(res, user, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
