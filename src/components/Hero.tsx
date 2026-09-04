import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Sparkles, ArrowDown, Star } from 'lucide-react';
import { MediaItem } from '../types.js';
import { useOceanDepth } from '../context/OceanDepthContext.js';

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
  const { depth } = useOceanDepth();
  const whaleRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Very subtle mouse parallax on whale only
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (e.clientX - rect.left - cx) / cx;
    const dy = (e.clientY - rect.top - cy) / cy;
    setMousePos({ x: dx * 10, y: dy * 6 });
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    hero.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const handleDiveClick = () => {
    if (onStartDive) {
      onStartDive();
    } else {
      const el = document.getElementById('trending-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-[95vh] sm:min-h-screen flex flex-col justify-end overflow-hidden select-none"
      aria-label="Biển Phim — Khám phá cinematic"
    >
      {/* ================================================================
          LAYER 1: CINEMATIC UNDERWATER PHOTOGRAPH (Full-Bleed)
          ================================================================ */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Underwater photograph — slow cinematic pan */}
        <img
          src="/ocean-bg.jpg"
          alt="Biển Phim — Đại dương điện ảnh"
          className="absolute inset-0 w-full h-full object-cover object-center animate-hero-bg"
          style={{
            filter: 'brightness(0.85) saturate(1.12) contrast(1.05)',
            transform: `scale(1.04) translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.15}px)`,
            transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          loading="eager"
          decoding="async"
        />

        {/* Volumetric light rays from top — CSS animated overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="animate-light-ray-1 absolute top-0 left-[20%] w-[240px] h-full"
            style={{
              background: 'linear-gradient(180deg, rgba(53,194,200,0.16) 0%, rgba(8,126,164,0.06) 45%, transparent 75%)',
              transformOrigin: 'top center',
            }}
          />
          <div
            className="animate-light-ray-2 absolute top-0 left-[45%] w-[180px] h-full"
            style={{
              background: 'linear-gradient(180deg, rgba(53,194,200,0.12) 0%, transparent 60%)',
              transformOrigin: 'top center',
            }}
          />
          <div
            className="animate-light-ray-3 absolute top-0 left-[68%] w-[220px] h-full"
            style={{
              background: 'linear-gradient(180deg, rgba(8,126,164,0.10) 0%, transparent 65%)',
              transformOrigin: 'top center',
            }}
          />
        </div>

        {/* Caustic illumination at top surface */}
        <div
          className="absolute top-0 left-0 right-0 h-[30%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% -5%, rgba(53,194,200,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Gradient vignette: protects text legibility on the left, fades seamlessly at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030A14] via-[#030A14]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030A14]/90 via-[#030A14]/45 to-transparent sm:w-[68%]" />
      </div>

      {/* ================================================================
          LAYER 3: EYEBROW + DEPTH TELEMETRY (subtle, top-left)
          ================================================================ */}
      <div
        className="absolute top-24 left-0 right-0 pointer-events-none z-10"
        aria-hidden="true"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div
            className={`flex items-center gap-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <span className="font-mono text-[10px] tracking-[0.18em] text-cyan-400/70 uppercase">
              BIỂN PHIM
            </span>
            <span className="w-8 h-[1px] bg-cyan-500/40" />
            <span className="font-mono text-[10px] tracking-[0.14em] text-cyan-400/50 uppercase">
              CINEMATIC DISCOVERY
            </span>
            <span className="w-8 h-[1px] bg-cyan-500/30" />
            <span className="font-mono text-[10px] tracking-[0.12em] text-cyan-400/40 uppercase">
              {depth}m · LAT 16°N 108°E
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================
          LAYER 4: MAIN HERO CONTENT — bottom-left editorial
          ================================================================ */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pb-16 sm:pb-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">

          {/* ─── Left: Editorial Headline Stack (7 cols) ─── */}
          <div className="lg:col-span-7 space-y-5">

            {/* Editorial serif headline — large, cinematic */}
            <h1
              className={`font-serif font-normal leading-[1.05] tracking-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{
                fontSize: 'clamp(2.6rem, 6.5vw, 5.5rem)',
                transitionDelay: '350ms',
              }}
            >
              <span className="block text-white">Khám phá những</span>
              <span className="block text-white">câu chuyện</span>
              <span
                className="block text-cyan-300 italic"
                style={{ textShadow: '0 0 30px rgba(53,194,200,0.3)' }}
              >
                ẩn sâu.
              </span>
            </h1>

            {/* Supporting description */}
            <p
              className={`font-sans text-sm sm:text-base text-gray-300/80 max-w-md leading-relaxed font-light transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '500ms' }}
            >
              Lặn xuống đại dương điện ảnh — nơi mỗi bộ phim là một sinh vật bí ẩn đang chờ được khám phá.
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-wrap items-center gap-3 sm:gap-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '620ms' }}
            >
              {/* Primary */}
              <button
                onClick={handleDiveClick}
                className="group flex items-center gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-gray-100 text-[#030A14] text-xs font-bold uppercase tracking-[0.12em] transition-all duration-300 shadow-2xl hover:shadow-white/20 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                <span>BẮT ĐẦU KHÁM PHÁ</span>
              </button>

              {/* Secondary: AI */}
              <button
                onClick={() => onTriggerAISearch && onTriggerAISearch()}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400/60 text-white text-xs font-semibold uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>AI GỢI Ý CHO TÔI</span>
              </button>
            </div>
          </div>

          {/* ─── Right: Featured Film Card (5 cols) ─── */}
          {featuredItem && (
            <div
              className={`lg:col-span-5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: '750ms' }}
            >
              <div className="text-[10px] font-mono tracking-[0.16em] text-cyan-400/60 uppercase mb-2.5">
                PHIM ĐANG ĐƯỢC KHÁM PHÁ
              </div>
              <button
                onClick={() => onSelectMedia(featuredItem)}
                className="group w-full sm:max-w-xs flex items-center gap-4 p-3.5 rounded-xl bg-[#031322]/75 border border-cyan-500/20 hover:border-cyan-400/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:-translate-y-0.5 text-left cursor-pointer"
                aria-label={`Xem chi tiết: ${featuredItem.title}`}
              >
                {/* Poster thumbnail */}
                <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-[#020A12]">
                  <img
                    src={featuredItem.posterUrl}
                    alt={featuredItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                    decoding="async"
                  />
                </div>

                {/* Film meta */}
                <div className="min-w-0">
                  <div className="font-sans font-bold text-sm text-white truncate tracking-tight group-hover:text-cyan-200 transition-colors">
                    {featuredItem.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-gray-400">
                    <span>{featuredItem.year}</span>
                    <span>·</span>
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
                    <span className="text-amber-400 font-semibold">{featuredItem.rating?.toFixed(1)}</span>
                  </div>
                  {featuredItem.genres?.[0] && (
                    <div className="mt-1 text-[10px] text-cyan-400/70 font-sans uppercase tracking-wider">
                      {featuredItem.genres[0]}
                    </div>
                  )}
                  <div className="mt-2 text-[10px] font-sans text-gray-300/70 leading-relaxed line-clamp-2 max-w-[180px]">
                    {featuredItem.tagline}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          BOTTOM FADE to next section
          ================================================================ */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-5"
        style={{
          background: 'linear-gradient(to top, #030A14 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />
    </section>
  );
};
