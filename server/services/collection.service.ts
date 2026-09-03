import { collectionRepository } from '../repositories/collection.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class CollectionService {
  async getCollections() {
    return collectionRepository.findMany();
  }

  async getCollectionById(idOrSlug: string) {
    const col = await collectionRepository.findByIdOrSlug(idOrSlug);
    if (!col) {
      throw new NotFoundError(`Không tìm thấy bộ sưu tập: "${idOrSlug}"`);
    }
    return col;
  }
}

export const collectionService = new CollectionService();
