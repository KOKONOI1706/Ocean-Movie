import React from 'react';
import { MediaItem } from '../types';
import { Sparkles, Cpu, ArrowRight, Layers } from 'lucide-react';

interface NewCinemaSectionProps {
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
}

export const NewCinemaSection: React.FC<NewCinemaSectionProps> = ({
  items,
  onSelectMedia,
  onOpenWhereToWatch
}) => {
  const aiFilms = items.filter(i => i.aiInvolvement?.isAiFilm);

  return (
    <section className="w-full bg-[#F4F1EA] text-[#1A1A1A] border-b border-[#1A1A1A] py-16 sm:py-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b-2 border-[#1A1A1A] pb-6 mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 font-sans text-[11px] tracking-[0.25em] text-[#9D170C] font-bold uppercase mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>[ SYNTHETIC PRAXIS // SPECIAL FOLIO ]</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-6xl font-black tracking-tight uppercase">
              THE NEW CINEMA
            </h2>
            <p className="font-serif text-lg sm:text-xl italic text-[#68655E] mt-2 max-w-2xl">
              Films shaped by generative intelligence, independent creators, and experimental storytellers.
            </p>
          </div>
          <div className="font-sans text-[10px] tracking-widest text-[#68655E] uppercase border border-[#1A1A1A] p-3 max-w-xs bg-[#EAE6DC]/40">
            <span className="font-bold text-[#9D170C] block mb-1">TRANSPARENCY CHARTER:</span>
            ALL WORKS CATALOGED IN THIS SECTION DOCUMENT THEIR PROMPT ARCHITECTURE, LATENT MODELS, AND OPTICAL PASSES.
          </div>
        </div>

        {/* Spread Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {aiFilms.map((film, idx) => (
            <div
              key={film.id}
              className="border border-[#1A1A1A] bg-[#FAF8F5] flex flex-col justify-between group hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
            >
              <div>
                {/* Media Image */}
                <div
                  className="relative aspect-[16/10] overflow-hidden cursor-pointer bg-[#1A1A1A]"
                  onClick={() => onSelectMedia(film)}
                >
                  <img
                    src={film.backdropUrl}
                    alt={film.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="absolute top-3 left-3 bg-[#9D170C] text-[#F4F1EA] font-sans text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold">
                    SYNTHETIC LAB
                  </div>

                  <div className="absolute bottom-3 right-3 bg-[#1A1A1A] text-[#F4F1EA] font-sans text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold">
                    {film.runtime}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6">
                  <div className="flex items-center justify-between font-sans text-[10px] text-[#68655E] uppercase tracking-widest mb-1.5 font-medium">
                    <span>PROMPT DIR. {film.aiInvolvement?.promptDirector}</span>
                    <span>{film.year}</span>
                  </div>

                  <h3
                    onClick={() => onSelectMedia(film)}
                    className="font-serif text-2xl font-bold uppercase tracking-tight text-[#1A1A1A] group-hover:text-[#9D170C] transition-colors cursor-pointer mb-2"
                  >
                    {film.title}
                  </h3>

                  <p className="font-sans text-xs text-[#1A1A1A]/80 leading-relaxed mb-4">
                    {film.synopsis}
                  </p>

                  {/* AI Tools Involvement Badge List */}
                  <div className="space-y-2 border-t border-[#1A1A1A]/15 pt-3">
                    <span className="font-sans text-[9px] tracking-widest text-[#9D170C] font-bold uppercase block">
                      NEURAL TOOLCHAIN:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {film.aiInvolvement?.toolsUsed.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="font-sans text-[9px] px-2 py-0.5 bg-[#F4F1EA] border border-[#1A1A1A]/20 text-[#1A1A1A]"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Note */}
                  <div className="mt-3 p-2.5 bg-[#EAE6DC]/60 border-l-2 border-[#9D170C] text-[10px] font-sans text-[#68655E]">
                    <span className="font-bold text-[#1A1A1A]">METHODOLOGY: </span>
                    {film.aiInvolvement?.workflowNotes}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-4 border-t border-[#1A1A1A] bg-[#F4F1EA] flex items-center justify-between">
                <button
                  onClick={() => onSelectMedia(film)}
                  className="font-sans text-[10px] tracking-widest uppercase font-bold text-[#1A1A1A] group-hover:text-[#9D170C] flex items-center gap-1 cursor-pointer"
                >
                  <span>READ LAB NOTES</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onOpenWhereToWatch(film)}
                  className="font-sans text-[9px] tracking-widest uppercase px-3 py-1 bg-[#1A1A1A] text-[#F4F1EA] hover:bg-[#9D170C] transition-colors cursor-pointer font-bold"
                >
                  WATCH STREAM
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
