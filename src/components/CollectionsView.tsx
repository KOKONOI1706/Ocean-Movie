import React, { useState } from 'react';
import { EDITORIAL_COLLECTIONS } from '../data/collectionsData';
import { CINEMA_ITEMS } from '../data/cinemaData';
import { MediaItem, EditorialCollection } from '../types';
import { Compass, Sparkles, Layers, BookOpen, ArrowRight } from 'lucide-react';
import { MovieCard } from './MovieCard';

interface CollectionsViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  onToggleSave?: (id: string) => void;
  savedItemIds?: string[];
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  onSelectMedia,
  onOpenWhereToWatch,
  onToggleSave,
  savedItemIds = []
}) => {
  const [selectedCollection, setSelectedCollection] = useState<EditorialCollection>(
    EDITORIAL_COLLECTIONS[0]
  );

  const collectionFilms = (selectedCollection?.itemIds || [])
    .map((id) => CINEMA_ITEMS.find((c) => c && c.id === id))
    .filter(Boolean) as MediaItem[];

  return (
    <div className="w-full text-[#E8F4F8] py-10 sm:py-14 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="rounded-3xl p-6 sm:p-8 bg-[#071728]/70 backdrop-blur-xl border border-[#35C2C8]/20 shadow-[0_0_30px_rgba(8,126,164,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#087EA4]/20 border border-[#35C2C8]/30 text-[#35C2C8] text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>QUẦN ĐẢO ĐIỆN ẢNH TUYỂN CHỌN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Bộ Sưu Tập Biển Phim
            </h1>
            <p className="text-sm text-[#8BA7B8] max-w-xl leading-relaxed">
              Những cụm tác phẩm được giám tuyển tỉ mỉ xoay quanh các chủ đề sâu sắc, tâm trạng hoặc phong cách thị giác độc đáo.
            </p>
          </div>
        </div>

        {/* Collection Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EDITORIAL_COLLECTIONS.map((col) => {
            const isSelected = selectedCollection.id === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setSelectedCollection(col)}
                className={`p-5 rounded-2xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#087EA4]/30 via-[#0B2035]/80 to-[#071728] text-white border-[#35C2C8]/60 shadow-[0_0_25px_rgba(53,194,200,0.25)] -translate-y-1'
                    : 'bg-[#0B2035]/40 text-[#E8F4F8] border-[#19A7C7]/20 hover:border-[#35C2C8]/40 hover:bg-[#0F2A45]/60 hover:-translate-y-0.5'
                }`}
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                    isSelected ? 'text-[#35C2C8]' : 'text-[#87CEDB]'
                  }`}
                >
                  {col.issue}
                </span>
                <h3 className="font-extrabold text-base leading-snug text-white">
                  {col.title}
                </h3>
                <span
                  className={`text-xs mt-2 block ${
                    isSelected ? 'text-cyan-100/70' : 'text-[#8BA7B8]'
                  }`}
                >
                  {col.itemIds.length} tác phẩm tuyển chọn
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Collection Showcase */}
        <div className="bg-[#071728]/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-[#35C2C8]/20 shadow-[0_0_40px_rgba(0,0,0,0.6)] space-y-8">
          <div className="border-b border-[#19A7C7]/20 pb-6 space-y-3">
            <div className="flex items-center gap-3 text-xs text-[#35C2C8] font-semibold">
              <span>Giám tuyển: {selectedCollection.curator}</span>
              <span className="text-white/20">·</span>
              <span>{selectedCollection.issue}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {selectedCollection.title}
            </h2>

            <p className="text-sm sm:text-base text-[#8BA7B8] max-w-3xl leading-relaxed">
              {selectedCollection.description}
            </p>

            {selectedCollection.manifestoExcerpt && (
              <blockquote className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#087EA4]/15 to-[#0B2035]/40 border-l-4 border-[#35C2C8] text-xs sm:text-sm text-cyan-100/90 italic shadow-sm">
                “{selectedCollection.manifestoExcerpt}”
              </blockquote>
            )}
          </div>

          {/* Films in this collection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#35C2C8]/80">
              Các tác phẩm trong bộ sưu tập ({collectionFilms.length})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {collectionFilms.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  onSelect={onSelectMedia}
                  onWhereToWatch={onOpenWhereToWatch}
                  onToggleSave={onToggleSave}
                  isSaved={savedItemIds.includes(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
