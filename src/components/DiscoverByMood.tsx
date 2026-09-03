import React, { useState } from 'react';
import { MOOD_CATEGORIES, CINEMA_ITEMS } from '../data/cinemaData';
import { MoodCategory, MediaItem } from '../types';
import { ArrowRight, Sparkles } from 'lucide-react';

interface DiscoverByMoodProps {
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
}

export const DiscoverByMood: React.FC<DiscoverByMoodProps> = ({
  onSelectMedia,
  onOpenWhereToWatch
}) => {
  const [activeMoodId, setActiveMoodId] = useState<string>('lonely');

  const currentMood = MOOD_CATEGORIES.find(m => m.id === activeMoodId) || MOOD_CATEGORIES[0];
  const matchedFilms = CINEMA_ITEMS.filter(item => item.moods.includes(activeMoodId));

  return (
    <section className="w-full bg-[#F4F1EA] text-[#1A1A1A] border-b border-[#1A1A1A] py-16 sm:py-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#1A1A1A] pb-4 mb-10 gap-4">
          <div>
            <span className="font-sans text-[11px] tracking-[0.25em] text-[#9D170C] font-bold uppercase block mb-1">
              [ PSYCHIC CARTOGRAPHY // FOLIO II ]
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight uppercase">
              DISCOVER BY MOOD
            </h2>
          </div>
          <p className="font-serif text-sm italic text-[#68655E] max-w-md">
            “Cinema is not a genre checklist. It is an emotional frequency waiting to synchronize with your interior monologue.”
          </p>
        </div>

        {/* Mood Headlines Selector (Magazine Spreads) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-y border-[#1A1A1A] bg-[#FAF8F5]">
          {MOOD_CATEGORIES.map((mood) => {
            const isSelected = mood.id === activeMoodId;
            return (
              <button
                key={mood.id}
                onClick={() => setActiveMoodId(mood.id)}
                className={`p-4 sm:p-5 text-left border-r border-[#1A1A1A]/20 last:border-r-0 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-[#F4F1EA]'
                    : 'hover:bg-[#EAE6DC] text-[#1A1A1A]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-0 left-0 right-0 h-1 bg-[#9D170C]"></span>
                )}
                <span className={`font-sans text-[9px] tracking-[0.2em] uppercase block mb-2 font-bold ${
                  isSelected ? 'text-[#9D170C]' : 'text-[#68655E]'
                }`}>
                  SECTION {mood.id.toUpperCase()}
                </span>
                <span className="font-serif text-base sm:text-lg lg:text-xl font-bold uppercase tracking-tight block leading-tight">
                  {mood.title}
                </span>
                <span className={`font-sans text-[9px] tracking-wider uppercase block mt-2 truncate ${
                  isSelected ? 'text-[#F4F1EA]/70' : 'text-[#68655E]'
                }`}>
                  {mood.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Mood Manifesto Spread */}
        <div className="my-8 p-6 sm:p-8 bg-[#FAF8F5] border border-[#1A1A1A] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <span className="font-sans text-[10px] tracking-[0.2em] text-[#9D170C] font-bold uppercase block mb-2">
              [ CURATORIAL MANIFESTO // {currentMood.title} ]
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold uppercase text-[#1A1A1A] leading-snug mb-2">
              {currentMood.manifesto}
            </p>
            <p className="font-serif text-base italic text-[#9D170C]">
              {currentMood.accentQuote}
            </p>
          </div>
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#1A1A1A]/20 pt-4 lg:pt-0 lg:pl-6 text-right">
            <span className="font-sans text-[10px] tracking-widest text-[#68655E] uppercase block font-medium">
              CATALOG VOLUME
            </span>
            <span className="font-serif text-4xl font-black text-[#1A1A1A] block my-1">
              {matchedFilms.length} TITLES
            </span>
            <span className="font-sans text-[9px] tracking-widest text-[#9D170C] uppercase font-bold">
              AI MATCH THRESHOLD ≥ 90%
            </span>
          </div>
        </div>

        {/* Asymmetric Curated Films Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {matchedFilms.map((item, index) => (
            <div
              key={item.id}
              className={`group flex flex-col justify-between border border-[#1A1A1A] bg-[#FAF8F5] transition-all hover:shadow-[4px_4px_0px_0px_#1A1A1A] ${
                index === 0 ? 'md:col-span-2 md:row-span-1' : ''
              }`}
            >
              {/* Media Still */}
              <div
                className="relative overflow-hidden cursor-pointer bg-[#1A1A1A]"
                onClick={() => onSelectMedia(item)}
              >
                <img
                  src={index === 0 ? item.backdropUrl : item.posterUrl}
                  alt={item.title}
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100 ${
                    index === 0 ? 'aspect-[16/9]' : 'aspect-[3/4]'
                  }`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-[#1A1A1A] text-[#F4F1EA] font-sans text-[9px] px-2 py-0.5 uppercase tracking-widest border border-[#F4F1EA]/20 font-bold">
                  {item.year} · {item.type.replace('_', ' ').toUpperCase()}
                </div>
                <div className="absolute top-3 right-3 bg-[#9D170C] text-[#F4F1EA] font-sans text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold">
                  {item.runtime}
                </div>
              </div>

              {/* Editorial Description */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-sans text-[10px] text-[#68655E] uppercase tracking-widest mb-1.5 font-medium">
                    <span>DIR. {item.director}</span>
                    <span className="text-[#9D170C] font-bold">{item.aiMatchScore != null ? `${item.aiMatchScore}% MATCH` : '—'}</span>
                  </div>
                  <h3
                    onClick={() => onSelectMedia(item)}
                    className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#1A1A1A] hover:text-[#9D170C] transition-colors cursor-pointer mb-2"
                  >
                    {item.title}
                  </h3>
                  <p className="font-serif text-xs italic text-[#68655E] line-clamp-2 mb-4">
                    "{item.tagline}"
                  </p>
                </div>

                <div className="border-t border-[#1A1A1A]/15 pt-3 flex items-center justify-between">
                  <button
                    onClick={() => onSelectMedia(item)}
                    className="font-sans text-[10px] tracking-widest uppercase font-bold text-[#1A1A1A] group-hover:text-[#9D170C] flex items-center gap-1 cursor-pointer"
                  >
                    <span>EXPLORE ESSAY</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onOpenWhereToWatch(item)}
                    className="font-sans text-[9px] tracking-widest uppercase px-2 py-1 bg-[#1A1A1A] text-[#F4F1EA] hover:bg-[#9D170C] transition-colors cursor-pointer font-bold"
                  >
                    WATCH
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
