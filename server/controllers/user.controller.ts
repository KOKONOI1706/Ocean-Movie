import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { apiSuccess } from '../utils/response.js';

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getProfile(req.user!.userId);
      return apiSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updateProfile(req.user!.userId, req.body);
      return apiSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await userService.getPreferences(req.user!.userId);
      return apiSuccess(res, prefs);
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updatePreferences(req.user!.userId, req.body);
      return apiSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
