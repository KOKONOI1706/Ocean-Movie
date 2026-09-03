import { searchRepository } from '../repositories/search.repository.js';

export class SearchService {
  async search(query: string, limit: number = 20) {
    return searchRepository.searchAcrossAll(query, limit);
  }
}

export const searchService = new SearchService();
