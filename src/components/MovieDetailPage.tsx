import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../types';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Check,
  Play,
  MapPin,
  Sparkles,
  Tv,
  ChevronRight,
  ExternalLink,
  Globe,
  Brain,
} from 'lucide-react';
import { CINEMA_ITEMS } from '../data/cinemaData';
import { moviesApi, aiApi } from '../lib/api';

interface MovieDetailPageProps {
  item: MediaItem;
  onBack: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onOpenWhereToWatch: (item: MediaItem) => void;
  onOpenSeriesDetail?: (item: MediaItem) => void;
  isSaved: boolean;
  onToggleSave: (item: MediaItem) => void;
}

/* ── helpers ──────────────────────────────────── */
const STREAMING_COLORS: Record<string, string> = {
  Netflix: '#E50914',
  'Prime Video': '#1A98FF',
  'Apple TV+': '#333',
  YouTube: '#FF0000',
  Mubi: '#062B45',
  Vimeo: '#1AB7EA',
  Official: '#087EA4',
};
const getProviderBg = (name: string) => {
  for (const [key, val] of Object.entries(STREAMING_COLORS))
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  return '#062B45';
};

/** Generate pseudo-gallery stills from the backdrop URL by varying crop params */
const makeGallery = (backdropUrl: string, posterUrl: string): string[] => {
  // If it's an Unsplash URL, create varied crops
  if (backdropUrl.includes('unsplash.com')) {
    const base = backdropUrl.split('?')[0];
    return [
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&crop=top`,
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&crop=center`,
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&crop=bottom`,
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&crop=left`,
      posterUrl,
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&crop=right`,
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&sat=-60`,
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&crop=faces`,
      `${base}?auto=format&fit=crop&w=600&h=400&q=80&blur=1`,
    ];
  }
  return Array(9).fill(backdropUrl);
};

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({
  item,
  onBack,
  onSelectMedia,
  onOpenWhereToWatch,
  onOpenSeriesDetail,
  isSaved,
  onToggleSave,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'streaming' | 'ai'>('overview');
  const [userScore, setUserScore] = useState<number | null>(null);
  const [ratingMsg, setRatingMsg] = useState('');
  const [aiInsight, setAiInsight] = useState<any>(item.aiMattersAnalysis);
  const [similarFilms, setSimilarFilms] = useState<MediaItem[]>(
    CINEMA_ITEMS.filter(
      (o) => o.id !== item.id &&
        (o.genres.some((g) => item.genres.includes(g)) || o.type === item.type)
    ).slice(0, 4)
  );

  const heroRef = useRef<HTMLDivElement>(null);
  const galleryImages = makeGallery(item.backdropUrl || item.posterUrl, item.posterUrl);
  const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);

  /* scroll to top */
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [item.id]);

  /* parallax */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const img = hero.querySelector<HTMLImageElement>('.hero-backdrop');
    const onScroll = () => {
      if (img) img.style.transform = `scale(1.06) translateY(${window.scrollY * 0.22}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* data fetch */
  useEffect(() => {
    let alive = true;
    aiApi.getFilmInsight(item.id).then((d) => { if (alive && d) setAiInsight(d); }).catch(() => {});
    moviesApi.getAll({ limit: 24 }).then((res) => {
      if (!alive) return;
      const rel = (res.items || []).filter(
        (o) => o.id !== item.id &&
          (o.genres?.some((g) => item.genres?.includes(g)) || o.type === item.type)
      );
      if (rel.length) setSimilarFilms(rel.slice(0, 4));
    }).catch(() => {});
    return () => { alive = false; };
  }, [item.id]);

  const handleRate = async (score: number) => {
    setUserScore(score);
    try { await moviesApi.rate(item.id, score); } catch { }
    setRatingMsg(`Rated ${score}/10!`);
    setTimeout(() => setRatingMsg(''), 2500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── age-rating helper ── */
  const ageLabel = item.type === 'anime' ? '13+' : item.runtimeMinutes > 150 ? '16+' : '13+';
  /* ── language from subtitles ── */
  const language = item.subtitlesAvailable?.[0]?.language
    ? item.subtitlesAvailable[0].language
    : item.type === 'anime' ? 'Japanese' : 'English';

  /* ────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen bg-[#1a1510] text-[#f0ede8]"
      style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}
      role="main"
    >

      {/* ═══════════════════════════════════════════════════════════
          HERO — full bleed backdrop, title bottom-left
          ═══════════════════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative overflow-hidden" style={{ minHeight: '100svh' }}>

        {/* Backdrop image */}
        <img
          className="hero-backdrop absolute inset-0 w-full h-full object-cover object-center"
          src={item.backdropUrl || item.posterUrl}
          alt=""
          aria-hidden="true"
          style={{ transform: 'scale(1.06)', transformOrigin: 'center top', transition: 'transform 0.05s linear' }}
        />

        {/* Dim overlay — same warmth as reference */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-[#1a1510]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#1a1510] via-[#1a1510]/80 to-transparent" />

        {/* Floating top bar */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 sm:px-10 pt-5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white text-sm font-semibold border border-white/15 hover:border-white/30 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(item)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer backdrop-blur-md ${
                isSaved
                  ? 'bg-amber-500/90 text-black border-amber-400'
                  : 'bg-black/40 text-white/90 border-white/20 hover:border-white/40'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white border border-white/15 hover:border-white/30 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── HERO BOTTOM — title + info card ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-5 sm:px-10 pb-10">

          {/* Big stacked title */}
          <h1
            className="text-[clamp(3rem,12vw,8rem)] font-black leading-none tracking-tight text-white uppercase mb-3"
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              textShadow: '0 2px 40px rgba(0,0,0,0.6)',
              letterSpacing: '-0.02em',
            }}
          >
            {item.title.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h1>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70 font-medium mb-6">
            <span className="font-bold text-white/90">{item.year}</span>
            <span className="text-white/30">|</span>
            <span className="px-2 py-0.5 border border-white/30 rounded text-xs">{ageLabel}</span>
            <span className="text-white/30">|</span>
            <span>{item.runtime}</span>
            <span className="text-white/30">|</span>
            <span>Language: {language}</span>
          </div>

          {/* Info card + score ring side by side */}
          <div className="flex flex-col sm:flex-row items-start gap-5">

            {/* Info card — translucent, reference style */}
            <div
              className="flex-1 max-w-lg rounded-2xl p-5 flex gap-4"
              style={{ background: 'rgba(20,15,10,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {/* Poster thumbnail */}
              <div className="shrink-0 w-20 sm:w-24 rounded-xl overflow-hidden border border-white/15" style={{ aspectRatio: '2/3' }}>
                <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {item.director && (
                  <p className="text-sm">
                    <span className="font-bold text-white/90">Dir. {item.director}</span>
                  </p>
                )}
                {item.cast?.length > 0 && (
                  <p className="text-xs text-white/60 leading-snug">
                    <span className="font-semibold text-white/80">Cast:</span>{' '}
                    {item.cast.slice(0, 3).join(', ')}
                  </p>
                )}
                <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                  {item.synopsis}
                </p>

                {/* Genre tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.genres.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold border border-white/25 text-white/80 hover:border-white/50 hover:text-white transition-colors cursor-default"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Score ring — reference golden circle */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div
                className="relative flex items-center justify-center"
                style={{ width: '90px', height: '90px' }}
              >
                {/* SVG circle ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
                  <circle
                    cx="45" cy="45" r="38" fill="none"
                    stroke="#F59E0B"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 38 * (item.rating / 10)} ${2 * Math.PI * 38}`}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }}
                  />
                </svg>
                <span
                  className="text-3xl font-black text-amber-400"
                  style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}
                >
                  {item.rating % 1 === 0 ? item.rating : item.rating.toFixed(1)}
                </span>
              </div>
              {item.aiMatchScore && (
                <span className="text-[10px] font-bold text-amber-400/70 tracking-widest uppercase">
                  {item.aiMatchScore}% Match
                </span>
              )}
            </div>
          </div>

          {/* CTA buttons row */}
          <div className="flex flex-wrap gap-3 mt-6">
            {isSeries && onOpenSeriesDetail ? (
              <button
                onClick={() => onOpenSeriesDetail(item)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                id="detail-watch-series-btn"
              >
                <Tv className="w-4 h-4" />
                View Episodes
              </button>
            ) : (
              <button
                onClick={() => onOpenWhereToWatch(item)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-white text-black hover:bg-white/90 transition-all cursor-pointer"
                id="detail-watch-now-btn"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </button>
            )}
            <button
              onClick={() => onOpenWhereToWatch(item)}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border border-white/30 text-white/90 hover:border-white/60 hover:text-white transition-all cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
              id="detail-where-to-watch-btn"
            >
              <MapPin className="w-4 h-4" />
              Where to Watch
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          GALLERY SECTION
          ═══════════════════════════════════════════════════════════ */}
      <div className="px-5 sm:px-10 py-12" style={{ background: '#1a1510' }}>
        <h2
          className="text-xs font-bold tracking-[0.35em] text-white/40 uppercase text-center mb-6"
        >
          Gallery
        </h2>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {galleryImages.slice(0, 9).map((src, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg group cursor-pointer"
              style={{ aspectRatio: '3/2', background: '#111' }}
            >
              <img
                src={src}
                alt={`${item.title} still ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06] group-hover:brightness-110"
              />
            </div>
          ))}
        </div>

        {/* Editorial Quote */}
        {(item.editorialQuote || item.tagline) && (
          <div className="mt-12 max-w-xl mx-auto text-center">
            <p
              className="text-sm sm:text-base italic text-white/60 leading-relaxed"
              style={{ fontFamily: '"Newsreader", "Playfair Display", serif' }}
            >
              {item.editorialQuote || `"${item.tagline}"`}
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CONTENT TABS — Overview / Streaming / AI
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ background: '#141009', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Tab selector */}
        <div className="flex border-b border-white/10 px-5 sm:px-10">
          {(['overview', 'streaming', 'ai'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              id={`detail-tab-${s}`}
              className={`px-5 py-4 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer relative ${
                activeSection === s ? 'text-white' : 'text-white/35 hover:text-white/70'
              }`}
            >
              {s === 'overview' ? 'Overview' : s === 'streaming' ? 'Where to Watch' : 'AI Insight'}
              {activeSection === s && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        <div className="px-5 sm:px-10 py-10">

          {/* ── OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div className="flex flex-col lg:flex-row gap-10 animate-fade-in">

              {/* Left — main info */}
              <div className="flex-1 space-y-8">

                {/* Synopsis */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3">Synopsis</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{item.synopsis}</p>
                </div>

                {/* Cast list */}
                {item.cast?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3">Cast</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.cast.map((actor, i) => (
                        <span
                          key={i}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white/75 border border-white/15"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3 flex items-center justify-between">
                    <span>Your Rating</span>
                    {ratingMsg && <span className="text-amber-400 normal-case tracking-normal">{ratingMsg}</span>}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[1,2,3,4,5,6,7,8,9,10].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleRate(score)}
                        id={`detail-rate-${score}`}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                          userScore === score
                            ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                            : 'text-white/50 hover:text-white border-white/15 hover:border-white/35'
                        }`}
                        style={{ background: userScore === score ? undefined : 'rgba(255,255,255,0.04)' }}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Film tools */}
                {item.aiInvolvement?.isAiFilm && (
                  <div className="rounded-2xl p-5 border border-purple-500/25" style={{ background: 'rgba(88,28,135,0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest">AI Film — Tools Used</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {item.aiInvolvement.toolsUsed.map((t, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg text-xs font-medium text-purple-200 border border-purple-500/30" style={{ background: 'rgba(109,40,217,0.25)' }}>{t}</span>
                      ))}
                    </div>
                    <p className="text-xs text-purple-300/70 italic">{item.aiInvolvement.workflowNotes}</p>
                  </div>
                )}

                {/* Series shortcut */}
                {isSeries && (
                  <div className="rounded-2xl p-5 flex items-center justify-between border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <Tv className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-sm font-bold text-white">Series — {item.seasons?.length || 1} Season{(item.seasons?.length || 1) > 1 ? 's' : ''}</p>
                        <p className="text-xs text-white/45 mt-0.5">View episodes, AI recaps & watch progress</p>
                      </div>
                    </div>
                    {onOpenSeriesDetail && (
                      <button
                        onClick={() => onOpenSeriesDetail(item)}
                        className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all cursor-pointer"
                      >
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right — quick info sidebar */}
              <div className="lg:w-56 shrink-0 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3">Details</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Type', value: item.type === 'ai_film' ? 'AI Film' : item.type.charAt(0).toUpperCase() + item.type.slice(1) },
                      { label: 'Year', value: String(item.year) },
                      { label: 'Runtime', value: item.runtime },
                      { label: 'Director', value: item.director },
                      { label: 'Language', value: language },
                      ...(item.seasons?.length ? [{ label: 'Seasons', value: `${item.seasons.length}` }] : []),
                    ].filter(r => r.value).map((r) => (
                      <div key={r.label} className="flex justify-between gap-4 text-xs border-b border-white/8 pb-2.5">
                        <span className="text-white/35">{r.label}</span>
                        <span className="text-white/75 font-medium text-right leading-snug">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {item.moods?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3">Mood</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {item.moods.map((m, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium text-white/55 border border-white/12 capitalize" style={{ background: 'rgba(255,255,255,0.04)' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {item.subtitlesAvailable?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      Subtitles
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {item.subtitlesAvailable.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium text-white/55 border border-white/12" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          {s.language}{s.isAiAssisted ? ' ✦' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STREAMING ── */}
          {activeSection === 'streaming' && (
            <div className="animate-fade-in space-y-4 max-w-2xl">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-5">Available On</h3>
              {item.streamingOptions?.length > 0 ? (
                item.streamingOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                      style={{ background: getProviderBg(opt.provider) }}
                    >
                      {opt.provider.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{opt.provider}</p>
                      <p className="text-xs text-white/45 mt-0.5">
                        {opt.region} ·{' '}
                        <span className={opt.type === 'free' ? 'text-green-400' : 'text-amber-400'}>
                          {opt.type === 'subscription' ? 'Subscription' : opt.type === 'rent' ? `Rent ${opt.price || ''}` : 'Free'}
                        </span>
                      </p>
                    </div>
                    <a
                      href={opt.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Watch
                    </a>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-sm text-white/30 border border-white/8 rounded-2xl">
                  Streaming sources coming soon.
                </div>
              )}
            </div>
          )}

          {/* ── AI INSIGHT ── */}
          {activeSection === 'ai' && (
            <div className="animate-fade-in space-y-6 max-w-2xl">
              <div className="rounded-2xl p-6 border border-[#19A7C7]/20" style={{ background: 'rgba(8,126,164,0.12)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl border border-[#35C2C8]/30 flex items-center justify-center" style={{ background: 'rgba(8,126,164,0.25)' }}>
                    <Brain className="w-5 h-5 text-[#35C2C8]" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Why you may love this</h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  {aiInsight?.whyYouMayLike || item.whyYouMayLike || 'A deeply cinematic work for audiences who prize visual restraint and emotional resonance.'}
                </p>
                {item.aiMatchScore && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    {item.aiMatchScore}% match for your taste
                  </div>
                )}
              </div>

              {aiInsight && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Themes',           value: aiInsight.themes },
                    { label: 'Visual Style',      value: aiInsight.visualStyle },
                    { label: 'Emotional Tone',    value: aiInsight.emotionalIntensity },
                    { label: 'Audience Fit',      value: aiInsight.audienceFit },
                  ].filter((c) => c.value).map((card, i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/35 block mb-2">{card.label}</span>
                      <p className="text-xs text-white/60 leading-relaxed">{card.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER STRIP — similar films, reference-style
          ═══════════════════════════════════════════════════════════ */}
      {similarFilms.length > 0 && (
        <div style={{ background: '#0f0c08', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 sm:px-10 py-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/40 tracking-widest uppercase">
                {item.originalTitle || item.title}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-xs font-bold text-white/60">
                You May Also Like
              </span>
            </div>
          </div>

          {/* Thumbnail strip — 4-column */}
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {similarFilms.map((other, i) => (
              <div
                key={other.id}
                onClick={() => onSelectMedia(other)}
                className="relative overflow-hidden cursor-pointer group"
                style={{
                  aspectRatio: '16/9',
                  borderRight: i < similarFilms.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}
              >
                <img
                  src={other.backdropUrl || other.posterUrl}
                  alt={other.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  style={{ filter: 'brightness(0.55) saturate(0.9)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3">
                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[90%]">{other.title}</p>
                  <p className="text-[10px] text-white/45 mt-0.5">{other.year} · ★ {other.rating}</p>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
