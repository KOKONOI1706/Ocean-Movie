import React, { useCallback, useEffect, useRef } from 'react';
import { MediaItem } from '../../types.js';
import { AnimatePresence, motion } from 'motion/react';

interface MovieArtworkProps {
  item: MediaItem;
  quote?: string;
}

export const MovieArtwork: React.FC<MovieArtworkProps> = ({ item, quote }) => {
  const src = item.backdropUrl || item.posterUrl;

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (item.posterUrl && el.src !== item.posterUrl) {
      el.src = item.posterUrl;
    }
  }, [item.posterUrl]);

  return (
    <div className="relative w-full aspect-[16/9] max-h-[52vh] lg:max-h-none">
      <div
        className="absolute -inset-8 rounded-[28px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(25,167,199,0.16) 0%, transparent 68%)',
          filter: 'blur(12px)',
        }}
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[14px] shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <AnimatePresence mode="sync">
          <motion.img
            key={item.id}
            src={src}
            alt=""
            onError={handleError}
            initial={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="relative aspect-[16/9] w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(3,10,20,0.55) 0%, transparent 38%), linear-gradient(180deg, transparent 50%, rgba(3,10,20,0.55) 100%)',
          }}
        />
      </div>
      {quote && (
        <p className="hidden xl:block absolute -right-2 -top-10 max-w-[220px] text-right font-serif text-sm italic leading-relaxed text-white/55">
          {quote}
        </p>
      )}
    </div>
  );
};
