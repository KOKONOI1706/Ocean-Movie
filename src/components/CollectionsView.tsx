import React, { useState, useEffect } from 'react';
import { EDITORIAL_COLLECTIONS } from '../data/collectionsData';
import { CINEMA_ITEMS } from '../data/cinemaData';
import { MediaItem, EditorialCollection } from '../types';
import { Compass } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { collectionsApi, CollectionWithItems } from '../lib/api';

interface CollectionsViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  savedItemIds?: string[];
}

function fallbackBundles(): CollectionWithItems[] {
  return EDITORIAL_COLLECTIONS.map((collection) => ({
    collection,
    items: (collection.itemIds || [])
      .map((id) => CINEMA_ITEMS.find((c) => c.id === id))
      .filter(Boolean) as MediaItem[],
  }));
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  onSelectMedia,
  onOpenWhereToWatch,
  onToggleSave,
  savedItemIds = [],
}) => {
  const [bundles, setBundles] = useState<CollectionWithItems[]>(fallbackBundles);
  const [selectedId, setSelectedId] = useState<string>(EDITORIAL_COLLECTIONS[0]?.id);

  useEffect(() => {
    let mounted = true;
    collectionsApi
      .getAll()
      .then((rows) => {
        if (!mounted || !rows.length) return;
        setBundles(rows);
        setSelectedId(rows[0].collection.id);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selected = bundles.find((b) => b.collection.id === selectedId) || bundles[0];
  const selectedCollection = selected?.collection;
  const collectionFilms = selected?.items || [];

  if (!selectedCollection) return null;

  return (
    <div className="w-full text-[#E8F4F8] py-10 sm:py-14 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">
              <Compass className="w-3.5 h-3.5" />
              <span>Editorial collections</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-white tracking-tight">
              Bộ sưu tập
            </h1>
            <p className="text-sm text-white/55 max-w-xl leading-relaxed">
              Những cụm tác phẩm được giám tuyển quanh tâm trạng, chủ đề, và dòng hải lưu điện ảnh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bundles.map(({ collection }) => {
            const isSelected = selectedCollection.id === collection.id;
            return (
              <button
                key={collection.id}
                onClick={() => setSelectedId(collection.id)}
                className={`group relative min-h-[200px] overflow-hidden rounded-md text-left border transition-all ${
                  isSelected
                    ? 'border-cyan-400/40 shadow-[0_12px_40px_rgba(8,126,164,0.2)]'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                <img
                  src={collection.heroImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: 'brightness(0.42) saturate(1.05)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030A14] via-[#030A14]/40 to-transparent" />
                <div className="relative flex h-full min-h-[200px] flex-col justify-end p-4">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/80 mb-1">
                    {collection.issue}
                  </span>
                  <h3 className="font-serif text-xl text-white leading-tight">{collection.title}</h3>
                  <span className="mt-2 text-[11px] text-white/50">
                    {collection.itemIds.length} tác phẩm
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-8">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3 text-xs text-cyan-200/70">
              <span>Giám tuyển: {selectedCollection.curator}</span>
              <span className="text-white/20">·</span>
              <span>{selectedCollection.issue}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight">
              {selectedCollection.title}
            </h2>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed">
              {selectedCollection.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {collectionFilms.map((item) => (
              <MovieCard
                key={item.id}
                item={item}
                onSelect={onSelectMedia}
                onWhereToWatch={onOpenWhereToWatch}
                onToggleSave={onToggleSave}
                isSaved={savedItemIds.includes(item.id)}
                aspectRatio="poster"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
