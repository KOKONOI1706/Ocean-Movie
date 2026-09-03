import React from 'react';
import { Sparkles, Play, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { MediaItem } from '../types';

interface EditorialFeatureProps {
  item: MediaItem;
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
}

export const EditorialFeature: React.FC<EditorialFeatureProps> = ({
  item,
  onSelectMedia,
  onOpenWhereToWatch
}) => {
  return (
    <section className="w-full bg-[#F4F1EA] text-[#1A1A1A] border-b border-[#1A1A1A] py-16 sm:py-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8">
        {/* Magazine Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-[#1A1A1A] pb-4 mb-12 gap-4">
          <div>
            <span className="font-sans text-[11px] tracking-[0.25em] text-[#9D170C] font-bold uppercase block mb-1">
              [ COVER STORY // MONOGRAPH ]
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight uppercase">
              THE FILM OF THE WEEK
            </h2>
          </div>
          <div className="font-sans text-[11px] tracking-widest text-[#68655E] uppercase text-left sm:text-right font-medium">
            <span>SELECTION Nº 01</span>
            <span className="mx-2">·</span>
            <span>ACCLAIM INDEX: 9.8 / 10</span>
          </div>
        </div>

        {/* Asymmetric Magazine Spread Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Dominant Photography & Film Still */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="relative group cursor-pointer overflow-hidden border border-[#1A1A1A] bg-[#1A1A1A]"
              onClick={() => onSelectMedia(item)}
            >
              <img
                src={item.backdropUrl}
                alt={item.title}
                className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-transparent to-transparent"></div>
              
              {/* Halftone / Grain badge */}
              <div className="absolute top-4 left-4 bg-[#F4F1EA] text-[#1A1A1A] px-3 py-1 font-sans text-[10px] tracking-widest uppercase border border-[#1A1A1A] font-bold">
                70MM ANALOG + GENERATIVE
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[#F4F1EA]">
                <div>
                  <span className="font-sans text-[10px] tracking-widest text-[#EAE6DC] uppercase block font-medium">
                    {item.director}
                  </span>
                  <p className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-tight">
                    {item.title}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-[#9D170C] text-[#F4F1EA] px-3 py-1.5 font-sans text-[10px] tracking-widest uppercase font-bold">
                  <span>EXPAND SPREAD</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Captions in authentic print style */}
            <div className="flex justify-between items-center text-[10px] font-sans tracking-widest text-[#68655E] uppercase px-1">
              <span>FIG. 47-A // ORBITAL TRANSMISSION RECONSTRUCTION</span>
              <span>RESTORED MASTER ARCHIVE</span>
            </div>
          </div>

          {/* Right: Editorial Typography, Metadata, AI Note, CTAs */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8 lg:pl-4">
            <div>
              {/* Compressed Metadata Grid */}
              <div className="grid grid-cols-3 border-y border-[#1A1A1A] py-3 text-center mb-6 font-sans text-[10px] tracking-widest uppercase">
                <div className="border-r border-[#1A1A1A]/20">
                  <span className="text-[#68655E] block">FORMAT</span>
                  <span className="font-bold text-[#1A1A1A]">{item.genres[0]}</span>
                </div>
                <div className="border-r border-[#1A1A1A]/20">
                  <span className="text-[#68655E] block">YEAR</span>
                  <span className="font-bold text-[#1A1A1A]">{item.year}</span>
                </div>
                <div>
                  <span className="text-[#68655E] block">DURATION</span>
                  <span className="font-bold text-[#9D170C]">{item.runtime}</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h3 className="font-serif text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight uppercase leading-[1.05] mb-4 text-[#1A1A1A]">
                "{item.title}"
              </h3>
              <p className="font-serif text-lg italic text-[#9D170C] mb-6">
                {item.tagline}
              </p>

              {/* Editorial Synopsis (Magazine Body) */}
              <p className="font-sans text-sm sm:text-base text-[#1A1A1A]/85 leading-relaxed mb-6">
                {item.synopsis}
              </p>

              {/* AI Editorial Note Block */}
              <div className="p-4 bg-[#EAE6DC]/60 border-l-2 border-[#9D170C] space-y-2 mb-6">
                <div className="flex items-center gap-2 font-sans text-[10px] tracking-[0.2em] text-[#9D170C] font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>WHY OUR AI THINKS YOU SHOULD WATCH THIS</span>
                </div>
                <p className="font-serif text-xs text-[#1A1A1A] leading-relaxed italic">
                  "{item.whyYouMayLike}"
                </p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <span className="font-sans text-[9px] px-2 py-0.5 bg-[#F4F1EA] border border-[#1A1A1A]/15 text-[#68655E]">
                    EMOTIONAL INTENSITY: {item.aiMattersAnalysis.emotionalIntensity}
                  </span>
                  <span className="font-sans text-[9px] px-2 py-0.5 bg-[#F4F1EA] border border-[#1A1A1A]/15 text-[#68655E]">
                    MATCH: {item.aiMatchScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs: READ STORY / WATCH */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#1A1A1A]/15">
              <button
                onClick={() => onSelectMedia(item)}
                className="w-full sm:w-auto flex-1 py-3 px-6 bg-[#1A1A1A] hover:bg-[#9D170C] text-[#F4F1EA] font-sans text-[11px] tracking-[0.2em] font-bold uppercase transition-all text-center cursor-pointer"
              >
                READ EDITORIAL STORY
              </button>
              <button
                onClick={() => onOpenWhereToWatch(item)}
                className="w-full sm:w-auto flex-1 py-3 px-6 bg-transparent hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F4F1EA] border border-[#1A1A1A] font-sans text-[11px] tracking-[0.2em] font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>WHERE TO WATCH</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
