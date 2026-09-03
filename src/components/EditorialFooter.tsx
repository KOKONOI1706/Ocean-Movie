import React from 'react';

export const EditorialFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#1A1A1A] text-[#F4F1EA] border-t-2 border-[#F4F1EA]/20 pt-16 pb-12">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 space-y-12">
        {/* Top Print Alignment Marks */}
        <div className="flex items-center justify-between font-sans text-[9px] tracking-[0.3em] text-[#EAE6DC]/50 uppercase border-b border-[#F4F1EA]/15 pb-4 font-medium">
          <div className="flex items-center gap-4">
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-[#F4F1EA]/40 flex items-center justify-center">
              <span className="w-1 h-1 bg-[#9D170C] rounded-full"></span>
            </span>
            <span>REGISTRATION TARGET [C:0 M:95 Y:85 K:20]</span>
          </div>
          <div>ISSUE Nº 47 · PRINTED IN DIGITAL DUPLEX</div>
          <div className="hidden sm:block">FOLIO ARCHIVE // 2026 EDITION</div>
        </div>

        {/* Big Magazine Colophon Title */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-serif text-5xl sm:text-7xl font-black uppercase tracking-tight text-[#F4F1EA]">
              OBLIQUE
            </h2>
            <p className="font-serif text-lg italic text-[#9D170C] max-w-xl">
              "Cinema is not content to be scrolled; it is an optical sacrament to be pondered."
            </p>
            <p className="font-sans text-xs sm:text-sm text-[#EAE6DC]/70 max-w-lg leading-relaxed">
              OBLIQUE is a cultural editorial publication merging analog film theory with neural intelligence. We reject automated feeds in favor of curated essays, philosophical mood cartography, and direct distribution links.
            </p>
          </div>

          <div className="lg:col-span-3 space-y-3 font-sans text-xs uppercase tracking-wider">
            <span className="text-[#9D170C] font-bold block mb-2 font-sans">[ EDITORIAL DESKS ]</span>
            <ul className="space-y-1.5 text-[#EAE6DC]/80 font-mono text-[11px]">
              <li>01. THE NEW CINEMA (AI LAB)</li>
              <li>02. 70MM MONOGRAPHS</li>
              <li>03. SLOW CELLULOID ESSAYS</li>
              <li>04. POLYLINGUAL ARCHIVE</li>
              <li>05. CURATORIAL REPERTORY</li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3 font-sans text-xs uppercase tracking-wider">
            <span className="text-[#9D170C] font-bold block mb-2 font-sans">[ EDITORIAL COLOPHON ]</span>
            <p className="text-[10px] text-[#EAE6DC]/60 normal-case font-sans leading-relaxed">
              Synthesized by DeepMind Gemini 2.5 architecture. Typography set in Bodoni Moda, Italiana, Plus Jakarta Sans, and Space Mono. Grain rendered via procedural WebGL latent passes.
            </p>
            <div className="pt-2 flex gap-2">
              <span className="w-3 h-3 bg-[#F4F1EA] border border-black/30"></span>
              <span className="w-3 h-3 bg-[#9D170C]"></span>
              <span className="w-3 h-3 bg-[#68655E]"></span>
              <span className="w-3 h-3 bg-[#EAE6DC]"></span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Date */}
        <div className="border-t border-[#F4F1EA]/10 pt-6 flex flex-col sm:flex-row items-center justify-between font-sans text-[10px] text-[#EAE6DC]/50 uppercase tracking-widest gap-2">
          <span>© 2026 OBLIQUE CULTURAL PUBLICATION. ALL RIGHTS RESERVED.</span>
          <span>DISTRIBUTED GLOBALLY VIA AUTHORIZED REPERTORY CHANNELS</span>
        </div>
      </div>
    </footer>
  );
};
