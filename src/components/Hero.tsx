import React from 'react';
import { Play, Sparkles, ArrowRight, Compass } from 'lucide-react';
import { MediaItem } from '../types.js';

interface HeroProps {
  featuredItem?: MediaItem;
  onSelectMedia: (item: MediaItem) => void;
  onTriggerAISearch?: (query?: string) => void;
  onStartDive?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  featuredItem,
  onSelectMedia,
  onTriggerAISearch,
  onStartDive,
}) => {
  const handleDiveClick = () => {
    if (onStartDive) {
      onStartDive();
    } else {
      const trendingEl = document.getElementById('trending-section');
      if (trendingEl) {
        trendingEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollBy({ top: 600, behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative min-h-[92vh] sm:min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden select-none">
      {/* =========================================================================
          1. CINEMATIC UNDERWATER ENVIRONMENT LAYER
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Deep Ocean Photographic Atmosphere */}
        <img
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2560&q=85"
          alt=""
          className="w-full h-full object-cover object-center opacity-45 scale-105 transition-transform duration-10000"
        />

        {/* Volumetric Sunlight Rays from above */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/15 via-transparent to-[#030A14] mix-blend-screen" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background:
              'radial-gradient(ellipse at 50% -10%, rgba(53, 194, 200, 0.4) 0%, rgba(8, 126, 164, 0.15) 50%, transparent 80%)',
          }}
        />

        {/* =========================================================================
            2. DISTANT MAGNIFICENT BLUE WHALE SILHOUETTE & MARINE LIFE
            ========================================================================= */}
        <div className="absolute top-12 right-0 sm:right-8 lg:right-24 w-[380px] sm:w-[540px] lg:w-[720px] opacity-85 transition-transform duration-1000 animate-sea-drift">
          <svg
            viewBox="0 0 700 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
          >
            <defs>
              <linearGradient id="whaleSkin" x1="150" y1="50" x2="550" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E3A52" />
                <stop offset="0.3" stopColor="#122738" />
                <stop offset="0.7" stopColor="#0B1A26" />
                <stop offset="1" stopColor="#06121C" />
              </linearGradient>
              <linearGradient id="whaleBelly" x1="200" y1="180" x2="350" y2="280" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2A4B67" stopOpacity="0.8" />
                <stop offset="1" stopColor="#0E2130" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Giant Whale Body */}
            <path
              d="M100 130 C 180 80, 320 60, 480 110 C 560 135, 630 180, 680 190 C 650 180, 610 160, 560 170 C 520 180, 490 220, 440 240 C 340 270, 220 270, 140 210 C 90 175, 80 145, 100 130 Z"
              fill="url(#whaleSkin)"
              stroke="#35C2C8"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
            {/* Whale Throat Grooves (Ventral Pleats) */}
            <path
              d="M120 170 C 180 210, 260 225, 340 220 M140 185 C 200 225, 270 235, 330 230 M170 200 C 220 235, 280 242, 320 238"
              stroke="#35C2C8"
              strokeWidth="0.75"
              strokeOpacity="0.3"
              fill="none"
            />
            {/* Whale Pectoral Fin */}
            <path
              d="M260 190 C 280 250, 320 310, 350 330 C 340 300, 320 250, 305 200 Z"
              fill="url(#whaleSkin)"
              stroke="#19A7C7"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
            {/* Whale Fluke (Tail) */}
            <path
              d="M660 185 C 685 145, 698 120, 690 115 C 670 140, 650 170, 635 180 M660 188 C 685 225, 698 250, 690 255 C 670 230, 650 200, 635 190"
              stroke="#35C2C8"
              strokeWidth="1.2"
              strokeOpacity="0.6"
              fill="#0E2130"
            />
            {/* Whale Eye */}
            <circle cx="155" cy="142" r="2.5" fill="#35C2C8" />
            <circle cx="155" cy="142" r="1" fill="#FFFFFF" />

            {/* School of Fish Shimmering */}
            <g opacity="0.6" fill="#A5F3FC">
              {[
                { cx: 80, cy: 220, r: 1.5 }, { cx: 95, cy: 235, r: 1.2 },
                { cx: 110, cy: 215, r: 1.8 }, { cx: 130, cy: 245, r: 1.2 },
                { cx: 150, cy: 230, r: 1.5 }, { cx: 175, cy: 260, r: 1.8 },
                { cx: 210, cy: 250, r: 1.2 }, { cx: 230, cy: 275, r: 1.5 },
                { cx: 260, cy: 270, r: 1.8 }, { cx: 290, cy: 290, r: 1.2 },
              ].map((f, i) => (
                <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.r * 2.5} ry={f.r} transform={`rotate(-15 ${f.cx} ${f.cy})`} />
              ))}
            </g>

            {/* Translucent Bioluminescent Jellyfish in distance */}
            <g opacity="0.45" transform="translate(620, 40) scale(0.6)">
              <ellipse cx="40" cy="30" rx="25" ry="18" fill="#35C2C8" fillOpacity="0.25" stroke="#35C2C8" strokeWidth="0.8" />
              <path d="M25 40 Q 20 70 30 95 M35 45 Q 38 75 32 105 M45 45 Q 42 75 48 105 M55 40 Q 60 70 50 95" stroke="#7C3AED" strokeWidth="0.8" fill="none" opacity="0.8" />
            </g>
          </svg>
        </div>

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030A14] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030A14] via-[#030A14]/70 to-transparent w-full lg:w-3/5" />
      </div>

      {/* =========================================================================
          3. MAIN HERO CONTENT CONTAINER (Matching Reference Layout)
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* ─── Left Column: Editorial Headline & Actions (7 cols) ─── */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Small Eyebrow */}
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs tracking-widest uppercase">
              <span>BIỂN PHIM</span>
              <span className="w-12 h-[1px] bg-cyan-400/60" />
            </div>

            {/* Editorial Serif Headline matching reference */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white font-normal leading-[1.12] tracking-tight">
              Khám phá những<br />
              câu chuyện <span className="text-cyan-300 font-serif italic drop-shadow-[0_0_20px_rgba(53,194,200,0.35)]">ẩn sâu.</span>
            </h1>

            {/* Supporting Description */}
            <p className="font-sans text-sm sm:text-base text-gray-300/90 max-w-lg leading-relaxed font-light">
              Lặn xuống đại dương điện ảnh, nơi mỗi bộ phim là một sinh vật bí ẩn đang chờ được khám phá.
            </p>

            {/* Actions matching reference */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Primary Action: BẮT ĐẦU LẶN */}
              <button
                onClick={handleDiveClick}
                className="group px-6 py-3 rounded-full bg-white hover:bg-gray-100 text-[#030A14] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>BẮT ĐẦU LẶN</span>
              </button>

              {/* Secondary Action: AI GỢI Ý CHO TÔI */}
              <button
                onClick={() => onTriggerAISearch && onTriggerAISearch()}
                className="px-6 py-3 rounded-full bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-white text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md"
              >
                AI GỢI Ý CHO TÔI
              </button>

              {/* Trailer Action */}
              <button
                onClick={() => onTriggerAISearch && onTriggerAISearch('Trailer Biển Phim')}
                className="flex items-center gap-3 group cursor-pointer text-left pl-2"
              >
                <div className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-white group-hover:border-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">TRAILER</span>
                  <span className="text-xs font-serif text-white group-hover:text-cyan-300 transition-colors">Biển Phim</span>
                </div>
              </button>
            </div>
          </div>

          {/* ─── Right Column: Floating Environmental Telemetry Cards (5 cols) ─── */}
          <div className="lg:col-span-5 flex flex-col gap-4 items-end pointer-events-auto">
            {/* Telemetry Card 1: Current Depth & Lighting Zone */}
            <div className="w-full max-w-sm rounded-2xl bg-[#031322]/80 border border-cyan-500/20 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
                    ĐỘ SÂU HIỆN TẠI
                  </div>
                  <div className="text-3xl font-mono font-bold text-white tracking-tight mt-0.5">
                    320<span className="text-sm font-normal text-cyan-400">m</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-200 mt-1 uppercase tracking-wider">
                    VÙNG SÁNG DỊU
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed max-w-[200px]">
                    Ánh sáng vẫn len lỏi qua mặt nước. Những sinh vật bắt đầu xuất hiện.
                  </p>
                </div>

                {/* Bioluminescent Jellyfish Artwork inside Card */}
                <div className="w-16 h-24 shrink-0 opacity-85">
                  <svg viewBox="0 0 80 120" fill="none" className="w-full h-full animate-jelly-pulse">
                    <path
                      d="M15 45 C 15 15, 65 15, 65 45 C 65 55, 52 60, 40 60 C 28 60, 15 55, 15 45 Z"
                      fill="url(#cardJellyGlow)"
                      stroke="#35C2C8"
                      strokeWidth="1"
                    />
                    <path d="M25 60 C 20 85, 30 105, 26 120 M35 60 C 38 85, 32 105, 36 120 M45 60 C 42 85, 48 105, 44 120 M55 60 C 60 85, 50 105, 54 120" stroke="#7C3AED" strokeWidth="0.8" opacity="0.75" />
                    <defs>
                      <radialGradient id="cardJellyGlow" cx="40" cy="40" r="30" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#35C2C8" stopOpacity="0.5" />
                        <stop offset="1" stopColor="#082A40" stopOpacity="0.1" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Telemetry Card 2: Creature Encounter (Manta Ray) */}
            <div className="w-full max-w-sm rounded-2xl bg-[#031322]/80 border border-cyan-500/20 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
                    SINH VẬT GẶP GỠ
                  </div>
                  <div className="text-lg font-serif font-bold text-white tracking-tight mt-0.5">
                    Manta Ray
                  </div>
                  <div className="text-[10px] font-mono italic text-gray-400">
                    Mobula birostris
                  </div>

                  <button
                    onClick={() => onTriggerAISearch && onTriggerAISearch('Sinh vật biển Manta Ray trong điện ảnh')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 mt-3 group cursor-pointer"
                  >
                    <span>TÌM HIỂU THÊM</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Manta Ray Vector with Trajectory Curve */}
                <div className="w-24 h-20 shrink-0 relative flex items-center justify-center">
                  <svg viewBox="0 0 120 90" fill="none" className="w-full h-full opacity-80 animate-manta-glide">
                    <path
                      d="M60 20 C 80 25, 110 40, 115 55 C 100 55, 80 60, 65 70 C 60 72, 55 72, 50 70 C 35 60, 15 55, 0 55 C 5 40, 35 25, 60 20 Z"
                      fill="#0C2E47"
                      stroke="#35C2C8"
                      strokeWidth="1"
                    />
                    <path d="M60 72 L 62 88" stroke="#35C2C8" strokeWidth="1" />
                    {/* Sonar Trajectory */}
                    <path d="M10 80 Q 60 88 110 75" stroke="#19A7C7" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.6" />
                    <circle cx="108" cy="75" r="2" fill="#35C2C8" />
                  </svg>
                  <span className="absolute bottom-0 right-1 text-[8px] font-mono text-cyan-400/60 uppercase">
                    LƯỢN ĐẾN 7M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
