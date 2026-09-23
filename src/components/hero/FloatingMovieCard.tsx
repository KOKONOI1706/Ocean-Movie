import React, { forwardRef, memo } from 'react';
import { MediaItem } from '../../types.js';

interface FloatingMovieCardProps {
  item: MediaItem;
  onActivate: () => void;
  onOpen: () => void;
}

export const FloatingMovieCard = memo(
  forwardRef<HTMLButtonElement, FloatingMovieCardProps>(function FloatingMovieCard(
    { item, onActivate, onOpen },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        data-carousel-card="true"
        data-movie-id={item.id}
        onClick={onOpen}
        onFocus={onActivate}
        className="absolute left-0 top-0 origin-center cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70"
        style={{
          width: 92,
          height: 138,
          willChange: 'transform, opacity, filter',
        }}
        aria-label={`${item.title}, ${item.year}`}
      >
        <span className="relative block h-full w-full overflow-hidden rounded-[5px] bg-[#041018]">
          <img
            src={item.posterUrl}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover pointer-events-none"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-1.5 pb-1.5 pt-6">
            <span className="block truncate font-serif text-[10px] leading-tight text-white">
              {item.title}
            </span>
            <span className="font-mono text-[8px] tracking-wider text-white/60">{item.year}</span>
          </span>
        </span>
      </button>
    );
  })
);
