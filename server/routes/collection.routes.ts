import { Router } from 'express';
import { collectionController } from '../controllers/collection.controller.js';

export const collectionRouter = Router();

collectionRouter.get('/', collectionController.getCollections);
collectionRouter.get('/:id', collectionController.getCollectionById);
