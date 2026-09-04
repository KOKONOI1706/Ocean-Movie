import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { EDITORIAL_COLLECTIONS } from '../data/collectionsData.js';

interface HomeCollectionStripProps {
  onNavigateCollections: () => void;
}

// Pick 4 featured collections for the homepage strip
const FEATURED_COLLECTION_IDS = [
  'late-night-cinema',
  'thought-provoking',
  'hidden-gems-deep-sea',
  'sci-fi-open-sea',
];

export const HomeCollectionStrip: React.FC<HomeCollectionStripProps> = ({
  onNavigateCollections,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const featured = FEATURED_COLLECTION_IDS.map((id) =>
    EDITORIAL_COLLECTIONS.find((c) => c.id === id)
  ).filter(Boolean) as typeof EDITORIAL_COLLECTIONS;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.07 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (featured.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="py-10 sm:py-14 select-none relative"
      aria-label="Bộ sưu tập biên tập"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div
          className={`flex items-end justify-between mb-6 gap-4 transition-all duration-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="relative pl-3">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-violet-400 to-blue-700 rounded-full" />
            <div className="text-[10px] font-mono tracking-[0.14em] text-violet-400/70 uppercase mb-0.5">
              Editorial
            </div>
            <h2 className="text-sm sm:text-base font-sans font-bold text-white uppercase tracking-[0.1em]">
              BỘ SƯU TẬP
            </h2>
            <p className="text-[12px] text-gray-500 font-sans font-light mt-0.5">
              Những câu chuyện được biên tập viên tuyển chọn kỹ lưỡng.
            </p>
          </div>

          <button
            onClick={onNavigateCollections}
            className="text-[11px] text-violet-400/80 hover:text-violet-300 transition-colors font-medium flex items-center gap-1 cursor-pointer font-sans tracking-wide shrink-0"
            aria-label="Xem tất cả bộ sưu tập"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 2×2 grid on desktop, horizontal scroll on mobile */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          {featured.map((col, i) => (
            <button
              key={col.id}
              onClick={onNavigateCollections}
              className="collection-tile group relative rounded-lg overflow-hidden aspect-[4/3] sm:aspect-[3/2] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label={`Xem bộ sưu tập: ${col.title}`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {/* Background image */}
              <img
                src={col.heroImage}
                alt={col.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'brightness(0.35) saturate(1.1)' }}
              />

              {/* Overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030A14]/95 via-[#030A14]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030A14]/80" />
              {/* Hover tint */}
              <div className="absolute inset-0 bg-cyan-950/0 group-hover:bg-cyan-950/15 transition-colors duration-400" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4">
                {/* Tags */}
                {col.tags?.[0] && (
                  <div className="mb-1.5 text-[9px] font-mono tracking-[0.14em] text-cyan-400/70 uppercase">
                    {col.tags[0]}
                  </div>
                )}

                {/* Title */}
                <h3 className="font-serif text-sm sm:text-base text-white font-normal leading-tight tracking-tight group-hover:text-cyan-200 transition-colors line-clamp-2">
                  {col.title}
                </h3>

                {/* Curator */}
                <div className="mt-1 text-[9px] font-sans text-gray-400/70 tracking-wide">
                  {col.curator}
                </div>

                {/* Hover arrow */}
                <div className="mt-2 flex items-center gap-1 text-[10px] font-sans text-cyan-400/0 group-hover:text-cyan-300/90 transition-colors duration-300 tracking-wider uppercase font-medium">
                  <span>Khám phá</span>
                  <ArrowRight className="w-2.5 h-2.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
