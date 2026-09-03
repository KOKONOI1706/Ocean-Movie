import { Request, Response, NextFunction } from 'express';
import { collectionService } from '../services/collection.service.js';
import { apiSuccess } from '../utils/response.js';

export class CollectionController {
  async getCollections(_req: Request, res: Response, next: NextFunction) {
    try {
      const collections = await collectionService.getCollections();
      return apiSuccess(res, collections);
    } catch (err) {
      next(err);
    }
  }

  async getCollectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await collectionService.getCollectionById(req.params.id);
      return apiSuccess(res, collection);
    } catch (err) {
      next(err);
    }
  }
}

export const collectionController = new CollectionController();
