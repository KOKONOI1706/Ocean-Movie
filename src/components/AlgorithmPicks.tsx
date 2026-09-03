import React from 'react';
import { MediaItem } from '../types';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface AlgorithmPicksProps {
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
}

export const AlgorithmPicks: React.FC<AlgorithmPicksProps> = ({
  items,
  onSelectMedia,
  onOpenWhereToWatch
}) => {
  // Sort or filter high match scores
  const recommendedItems = items.filter(i => (i.aiMatchScore || 0) >= 92).slice(0, 3);

  return (
    <section className="w-full bg-[#1A1A1A] text-[#F4F1EA] border-b border-[#F4F1EA]/20 py-16 sm:py-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#F4F1EA]/20 pb-4 mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 font-sans text-[11px] tracking-[0.25em] text-[#9D170C] font-bold uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>[ NEURAL SYNAPSE // RECOMMENDATION DISPATCH ]</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight uppercase">
              THE ALGORITHM THINKS YOU'LL LIKE
            </h2>
          </div>
          <div className="font-sans text-xs text-[#EAE6DC]/70 max-w-md text-left lg:text-right">
            CALCULATED ACROSS YOUR AFFINITY FOR EXISTENTIAL SCI-FI, SLOW BURN TEMPOS, AND ANALOG AUDIO SCULPTING.
          </div>
        </div>

        {/* Editorial Recommendation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {recommendedItems.map((item) => (
            <div
              key={item.id}
              className="border border-[#F4F1EA]/20 bg-[#222222] p-6 flex flex-col justify-between group hover:border-[#9D170C] transition-colors"
            >
              <div>
                {/* Top Bar: Match Percentage & Type */}
                <div className="flex items-center justify-between border-b border-[#F4F1EA]/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-black italic text-[#9D170C]">
                      {item.aiMatchScore}%
                    </span>
                    <span className="font-sans text-[10px] tracking-widest text-[#EAE6DC]/60 uppercase font-medium">
                      CONFIDENCE
                    </span>
                  </div>
                  <span className="font-sans text-[10px] tracking-widest px-2 py-0.5 bg-[#F4F1EA]/10 text-[#F4F1EA] uppercase font-bold">
                    {item.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Poster / Stills */}
                <div
                  className="relative aspect-[16/9] overflow-hidden cursor-pointer mb-4 bg-[#1A1A1A]"
                  onClick={() => onSelectMedia(item)}
                >
                  <img
                    src={item.backdropUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-[#1A1A1A]/90 text-[#F4F1EA] font-sans text-[9px] px-2 py-0.5 uppercase font-bold">
                    {item.runtime}
                  </div>
                </div>

                {/* Title & Director */}
                <div className="font-sans text-[10px] text-[#EAE6DC]/60 uppercase tracking-widest mb-1">
                  DIR. {item.director} · {item.year}
                </div>
                <h3
                  onClick={() => onSelectMedia(item)}
                  className="font-serif text-2xl font-bold uppercase tracking-tight text-[#F4F1EA] hover:text-[#9D170C] transition-colors cursor-pointer mb-3"
                >
                  {item.title}
                </h3>

                {/* AI Rationale Block */}
                <div className="p-3 bg-[#1A1A1A] border-l-2 border-[#9D170C] mb-4">
                  <span className="font-sans text-[9px] tracking-widest text-[#9D170C] uppercase block font-bold mb-1">
                    YOU MAY LIKE THIS BECAUSE:
                  </span>
                  <p className="font-serif text-xs italic text-[#EAE6DC]/90 leading-relaxed">
                    "{item.whyYouMayLike}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#F4F1EA]/10 flex items-center justify-between">
                <button
                  onClick={() => onSelectMedia(item)}
                  className="font-sans text-[10px] tracking-widest uppercase text-[#F4F1EA] group-hover:text-[#9D170C] flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>STUDY DOSSIER</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onOpenWhereToWatch(item)}
                  className="font-sans text-[9px] tracking-widest uppercase px-3 py-1.5 bg-[#F4F1EA] text-[#1A1A1A] hover:bg-[#9D170C] hover:text-[#F4F1EA] font-bold transition-colors cursor-pointer"
                >
                  WHERE TO WATCH
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
