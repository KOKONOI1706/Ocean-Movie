import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MediaItem } from '../../types.js';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js';
import { FeaturedMovie } from './FeaturedMovie.js';
import { MovieArtwork } from './MovieArtwork.js';
import { FloatingMovieCarousel } from './FloatingMovieCarousel.js';
import { CarouselEngine } from './carouselEngine.js';

export interface HeroSectionProps {
  items: MediaItem[];
  fallbackItem?: MediaItem;
  onSelectMedia: (item: MediaItem) => void;
  onTriggerAISearch?: (query?: string) => void;
  onToggleSave?: (item: MediaItem) => void;
  savedItemIds?: string[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  items,
  fallbackItem,
  onSelectMedia,
  onTriggerAISearch,
  onToggleSave,
  savedItemIds = [],
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const engineRef = useRef<CarouselEngine | null>(null);
  const catalog = useMemo(() => {
    const source = items.length > 0 ? items : fallbackItem ? [fallbackItem] : [];
    const seen = new Set<string>();
    return source.filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return Boolean(item.posterUrl);
    }).slice(0, 12);
  }, [items, fallbackItem]);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleActiveChange = useCallback((index: number) => {
    setActiveIndex((prev) => (prev === index ? prev : index));
  }, []);

  const active = catalog[activeIndex] || catalog[0];

  if (!active) return null;

  return (
    <section
      className="relative min-h-[92vh] sm:min-h-screen overflow-hidden"
      aria-label="Phim nổi bật — Biển Phim"
    >
      {/* Full-bleed background — covers entire section width */}
      <div className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden" aria-hidden="true">
        <AnimatePresence mode="sync">
          <motion.img
            key={active.id}
            src={active.backdropUrl || active.posterUrl}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: 'brightness(0.38) saturate(1.1)' }}
          />
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        <div className="animate-light-ray-1 absolute top-0 left-[18%] h-full w-[220px] bg-gradient-to-b from-cyan-200/10 via-cyan-400/5 to-transparent" />
        <div className="animate-light-ray-2 absolute top-0 left-[48%] h-full w-[160px] bg-gradient-to-b from-cyan-100/8 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030A14]/90 via-[#030A14]/35 to-transparent lg:w-[58%]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030A14] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[92vh] sm:min-h-screen max-w-[1400px] flex-col justify-end px-5 pb-8 pt-24 sm:px-8 lg:justify-center lg:px-12 lg:pb-16 lg:pt-20">
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5 xl:col-span-4 lg:mb-8">
            <FeaturedMovie
              item={active}
              isSaved={savedItemIds.includes(active.id)}
              onWatch={() => onSelectMedia(active)}
              onToggleSave={onToggleSave ? () => onToggleSave(active) : undefined}
              onTriggerAISearch={onTriggerAISearch ? () => onTriggerAISearch() : undefined}
            />
          </div>

          <div className="relative lg:col-span-7 xl:col-span-8">
            <div className="relative mx-auto w-full max-w-3xl lg:mr-0 lg:ml-8">
              <MovieArtwork item={active} quote={active.editorialQuote} />
              <div className="relative -mt-10 sm:-mt-16 lg:absolute lg:-bottom-6 lg:-right-4 lg:mt-0 lg:w-[108%] xl:w-[112%]">
                <FloatingMovieCarousel
                  items={catalog}
                  activeIndex={activeIndex}
                  reducedMotion={reducedMotion}
                  onActiveChange={handleActiveChange}
                  onSelect={onSelectMedia}
                  engineRef={engineRef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        Phim đang khám phá: {active.title}
      </span>
    </section>
  );
};
