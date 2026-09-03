import React, { useRef } from 'react';
import { MediaItem } from '../types';
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react';

interface TrendingStripProps {
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
}

export const TrendingStrip: React.FC<TrendingStripProps> = ({
  items,
  onSelectMedia
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full bg-[#F4F1EA] text-[#1A1A1A] border-b border-[#1A1A1A] py-16">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8">
        {/* Editorial Masthead Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-[#1A1A1A] pb-4 mb-8 gap-4">
          <div>
            <span className="font-sans text-[11px] tracking-[0.25em] text-[#9D170C] font-bold uppercase block mb-1">
              [ CHRONICLE // DISPATCH ]
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight uppercase">
              TRENDING IN THE ARCHIVE
            </h2>
          </div>

          {/* Minimal Editorial Scroll Navigation */}
          <div className="flex items-center gap-2">
            <span className="font-sans text-[10px] tracking-widest text-[#68655E] uppercase mr-3 font-medium">
              HORIZONTAL STRIP
            </span>
            <button
              onClick={() => scroll('left')}
              className="p-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F4F1EA] transition-colors cursor-pointer"
              title="Previous"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F4F1EA] transition-colors cursor-pointer"
              title="Next"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Film Strip */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectMedia(item)}
              className="min-w-[280px] sm:min-w-[340px] flex-shrink-0 group cursor-pointer border border-[#1A1A1A] bg-[#FAF8F5] hover:bg-[#1A1A1A] hover:text-[#F4F1EA] transition-all duration-300 snap-start"
            >
              {/* Large Poster Imagery with strict print crop */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#1A1A1A]">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100"
                  referrerPolicy="no-referrer"
                />
                
                {/* Index number stamp */}
                <div className="absolute top-3 left-3 bg-[#F4F1EA] text-[#1A1A1A] font-mono text-[10px] font-bold px-2 py-0.5 border border-[#1A1A1A]">
                  Nº 0{idx + 1}
                </div>

                {/* Duration indicator */}
                <div className="absolute bottom-3 right-3 bg-[#9D170C] text-[#F4F1EA] font-sans text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold">
                  {item.runtime}
                </div>
              </div>

              {/* Compressed Editorial Metadata */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between font-sans text-[10px] uppercase tracking-widest text-[#68655E] group-hover:text-[#EAE6DC]">
                  <span>{item.year}</span>
                  <span>{item.genres[0]}</span>
                </div>

                <h3 className="font-serif text-xl font-bold uppercase tracking-tight leading-tight line-clamp-1 group-hover:text-[#F4F1EA] transition-colors">
                  {item.title}
                </h3>

                <p className="font-serif text-xs italic text-[#68655E] group-hover:text-[#EAE6DC]/80 line-clamp-2">
                  "{item.tagline}"
                </p>

                <div className="pt-2 border-t border-[#1A1A1A]/15 group-hover:border-[#F4F1EA]/20 flex items-center justify-between font-sans text-[9px] uppercase tracking-widest text-[#9D170C] group-hover:text-[#F4F1EA] font-bold">
                  <span>{item.type.replace('_', ' ')}</span>
                  <span>VIEW DOSSIER →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
