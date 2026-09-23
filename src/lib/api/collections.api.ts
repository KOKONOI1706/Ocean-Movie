import { apiClient } from './client.js';
import { transformBackendMovie, transformBackendSeries } from './transformers.js';
import { EditorialCollection, MediaItem } from '../../types.js';

export interface CollectionWithItems {
  collection: EditorialCollection;
  items: MediaItem[];
}

export function transformBackendCollection(col: any): CollectionWithItems {
  const movieItems = (col.movies || [])
    .map((entry: any) => transformBackendMovie(entry.movie || entry))
    .filter(Boolean);
  const seriesItems = (col.series || [])
    .map((entry: any) => transformBackendSeries(entry.series || entry))
    .filter(Boolean);
  const items = [...movieItems, ...seriesItems] as MediaItem[];

  return {
    collection: {
      id: col.slug || col.id,
      title: col.title,
      subtitle: col.subtitle || '',
      curator: col.curator || '',
      issue: col.issue || '',
      heroImage: col.heroImage,
      description: col.description,
      tags: col.tags || [],
      itemIds: items.map((item) => item.id),
    },
    items,
  };
}

export const collectionsApi = {
  async getAll(): Promise<CollectionWithItems[]> {
    const res = await apiClient.get<any[]>('/collections');
    return (res.data || []).map(transformBackendCollection);
  },

  async getById(idOrSlug: string): Promise<CollectionWithItems> {
    const res = await apiClient.get<any>(`/collections/${idOrSlug}`);
    return transformBackendCollection(res.data);
  },
};
