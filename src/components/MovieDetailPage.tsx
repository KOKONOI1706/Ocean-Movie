import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../types';
import {
  ArrowLeft,
  Bookmark,
  Star,
  Play,
  MapPin,
  Sparkles,
  Share2,
  Check,
  Clock,
  Globe,
  Film,
  Tv,
  Brain,
  ExternalLink,
  ChevronRight,
  Calendar,
  Users,
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

const STREAMING_COLORS: Record<string, string> = {
  Netflix: 'bg-red-600',
  'Prime Video': 'bg-blue-600',
  'Apple TV+': 'bg-gray-800',
  YouTube: 'bg-red-500',
  Mubi: 'bg-[#062B45]',
  Vimeo: 'bg-blue-500',
  Official: 'bg-[#087EA4]',
};

const getProviderColor = (name: string) => {
  for (const [key, val] of Object.entries(STREAMING_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return 'bg-[#062B45]';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'streaming' | 'subtitles'>('overview');
  const [selectedSub, setSelectedSub] = useState(item.subtitlesAvailable?.[0]?.language || 'Tiếng Việt');
  const [userScore, setUserScore] = useState<number | null>(null);
  const [ratingMessage, setRatingMessage] = useState<string>('');
  const [aiInsight, setAiInsight] = useState<any>(item.aiMattersAnalysis);
  const [similarFilms, setSimilarFilms] = useState<MediaItem[]>(
    CINEMA_ITEMS.filter(
      (other) =>
        other.id !== item.id &&
        (other.genres.some((g) => item.genres.includes(g)) || other.type === item.type)
    ).slice(0, 6)
  );

  const backdropRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount / item change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [item.id]);

  // Parallax on backdrop
  useEffect(() => {
    const handleScroll = () => {
      if (backdropRef.current) {
        backdropRef.current.style.transform = `translateY(${window.scrollY * 0.32}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch AI insight + similar films
  useEffect(() => {
    let alive = true;
    aiApi.getFilmInsight(item.id)
      .then((d) => { if (alive && d) setAiInsight(d); })
      .catch(() => {});
    moviesApi.getAll({ limit: 24 })
      .then((res) => {
        if (!alive) return;
        const rel = (res.items || []).filter(
          (o) => o.id !== item.id &&
            (o.genres?.some((g) => item.genres?.includes(g)) || o.type === item.type)
        );
        if (rel.length > 0) setSimilarFilms(rel.slice(0, 6));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [item.id]);

  const handleRate = async (score: number) => {
    setUserScore(score);
    try {
      await moviesApi.rate(item.id, score);
      setRatingMessage(`Cảm ơn bạn đã chấm ${score}/10!`);
      setTimeout(() => setRatingMessage(''), 3000);
    } catch { }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);
  const typeLabel =
    item.type === 'series' ? 'Series' :
    item.type === 'anime' ? 'Anime' :
    item.type === 'ai_film' ? 'AI Film' :
    item.type === 'short' ? 'Phim Ngắn' : 'Phim Điện Ảnh';

  const TABS = [
    { id: 'overview',  label: 'Tổng quan',  icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'ai',        label: 'AI Insight', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'streaming', label: 'Nơi xem',    icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'subtitles', label: 'Phụ đề',     icon: <Globe className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div
      className="min-h-screen text-[#E8F4F8] animate-fade-in"
      style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}
      role="main"
      aria-label={`Chi tiết phim: ${item.title}`}
    >
      {/* ════════════════════════════════════════
          STICKY TOP BAR — matches Header glass style
          ════════════════════════════════════════ */}
      <div className="sticky top-0 z-40 glass-dark border-b border-[#19A7C7]/15 px-4 sm:px-8 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-[#35C2C8]/80 hover:text-white transition-colors cursor-pointer group"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
          <span className="hidden sm:inline tracking-wide">Quay lại</span>
        </button>

        {/* Type badge — same style as MovieRail cards */}
        <span className="px-2.5 py-1 rounded-full bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 text-[10px] font-bold uppercase tracking-widest">
          {typeLabel}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSave(item)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isSaved
                ? 'bg-gradient-to-r from-[#087EA4] to-[#19A7C7] text-white shadow-[0_0_15px_rgba(53,194,200,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-cyan-200 border border-white/10 hover:border-[#35C2C8]/40'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Đã lưu' : '+ Hải trình'}</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-cyan-200/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Chia sẻ"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          CINEMATIC HERO — mirrors HeroSection atmosphere
          ════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ minHeight: '560px' }}>

        {/* Parallax backdrop */}
        <div
          ref={backdropRef}
          className="absolute inset-0 will-change-transform"
          style={{ top: '-10%', height: '120%' }}
        >
          <img
            src={item.backdropUrl || item.posterUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.38) saturate(1.12)' }}
          />
        </div>

        {/* Gradient overlays — same layering as HeroSection */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* Left-to-right fade (main content side) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030A14]/95 via-[#030A14]/55 to-transparent" />
          {/* Bottom vignette into page bg */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#030A14] to-transparent" />
          {/* Top vignette */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#030A14]/60 to-transparent" />
        </div>

        {/* Volumetric light rays — same as HeroSection */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="animate-light-ray-1 absolute top-0 left-[15%] h-full w-[200px] bg-gradient-to-b from-cyan-200/10 via-cyan-400/5 to-transparent" />
          <div className="animate-light-ray-2 absolute top-0 left-[55%] h-full w-[150px] bg-gradient-to-b from-cyan-100/8 to-transparent" />
          <div className="animate-light-ray-3 absolute top-0 right-[20%] h-full w-[120px] bg-gradient-to-b from-[#087EA4]/8 to-transparent" />
        </div>

        {/* Caustic shimmer overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 40% 0%, rgba(53,194,200,0.22) 0%, rgba(8,126,164,0.08) 45%, transparent 75%)',
          }}
          aria-hidden="true"
        />

        {/* Hero content */}
        <div
          className="relative z-10 flex flex-col lg:flex-row items-end lg:items-center gap-8 px-5 sm:px-8 lg:px-16 pt-14 pb-12"
          style={{ minHeight: '560px' }}
        >
          {/* Poster */}
          <div
            className="shrink-0 w-36 sm:w-48 lg:w-60 rounded-2xl overflow-hidden border-2 border-[#35C2C8]/30 self-end lg:self-center"
            style={{
              aspectRatio: '2/3',
              boxShadow: '0 0 60px rgba(0,0,0,0.85), 0 0 30px rgba(8,126,164,0.2)',
            }}
          >
            <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>

          {/* Text block */}
          <div className="flex-1 max-w-2xl space-y-4">
            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#35C2C8] font-semibold tracking-wide">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {item.year}
              </span>
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.runtime}
              </span>
              <span className="text-white/20">·</span>
              <span>{item.genres.slice(0, 3).join(', ')}</span>
            </div>

            {/* Title — uses display serif like editorial sections */}
            <div>
              <h1
                className="text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-lg"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {item.title}
              </h1>
              {item.originalTitle && item.originalTitle !== item.title && (
                <p className="text-sm text-[#8BA7B8] italic mt-1.5">
                  Tên gốc: {item.originalTitle}
                </p>
              )}
            </div>

            {/* Tagline — left-border accent matching the CSS .section-header-line pattern */}
            {item.tagline && (
              <p className="text-sm text-cyan-200/80 italic pl-4 border-l-2 border-[#19A7C7]">
                "{item.tagline}"
              </p>
            )}

            {/* Scores row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rating-badge text-sm px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 fill-current text-amber-400" />
                <span className="text-amber-400 font-bold">{item.rating}</span>
                <span className="text-amber-400/50 text-xs font-normal">/ 10</span>
              </div>

              {item.aiMatchScore && (
                <div className="ai-match-badge px-3 py-1.5 rounded-xl text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  {item.aiMatchScore}% AI Match
                </div>
              )}

              {item.director && (
                <span className="text-sm text-[#8BA7B8]">
                  Đạo diễn:{' '}
                  <span className="font-semibold text-white">{item.director}</span>
                </span>
              )}
            </div>

            {/* CTA buttons — reuse global .btn-primary / .btn-secondary */}
            <div className="flex flex-wrap gap-3 pt-1">
              {isSeries && onOpenSeriesDetail ? (
                <button
                  onClick={() => onOpenSeriesDetail(item)}
                  className="btn-primary"
                  id="detail-watch-series-btn"
                >
                  <Tv className="w-4 h-4" />
                  Xem tập &amp; Mùa
                </button>
              ) : (
                <button
                  onClick={() => onOpenWhereToWatch(item)}
                  className="btn-primary"
                  id="detail-watch-now-btn"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Xem phim ngay
                </button>
              )}
              <button
                onClick={() => onOpenWhereToWatch(item)}
                className="btn-secondary"
                id="detail-where-to-watch-btn"
              >
                <MapPin className="w-4 h-4 text-[#35C2C8]" />
                Nơi xem
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN CONTENT — continues the ocean gradient
          ════════════════════════════════════════ */}
      <div
        className="relative z-10 px-5 sm:px-8 lg:px-16 pb-20"
        style={{ background: 'linear-gradient(180deg, #030A14 0%, #051F33 40%, #030A14 100%)' }}
      >
        {/* ── TABS ── */}
        <div className="border-b border-[#19A7C7]/20 flex gap-1 overflow-x-auto no-scrollbar -mx-5 sm:-mx-8 lg:-mx-16 px-5 sm:px-8 lg:px-16 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`detail-tab-${tab.id}`}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-4 text-sm font-semibold whitespace-nowrap relative transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#35C2C8]'
                  : 'text-[#8BA7B8] hover:text-[#E8F4F8]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#087EA4] to-[#35C2C8] shadow-[0_0_10px_rgba(53,194,200,0.8)]" />
              )}
            </button>
          ))}
        </div>

        {/* ── TWO-COLUMN layout on lg ── */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* LEFT — tab content */}
          <div className="flex-1 min-w-0 space-y-7">

            {/* ─── OVERVIEW ─── */}
            {activeTab === 'overview' && (
              <div className="space-y-7 animate-fade-in">

                {/* Synopsis */}
                <div>
                  <h2 className="section-header-line section-title text-[11px] font-bold uppercase tracking-widest text-[#35C2C8]/70 mb-3">
                    Tóm tắt nội dung
                  </h2>
                  <p className="section-subtitle leading-relaxed text-base">{item.synopsis}</p>
                </div>

                {/* Cast */}
                {item.cast?.length > 0 && (
                  <div>
                    <h2 className="section-header-line text-[11px] font-bold uppercase tracking-widest text-[#35C2C8]/70 mb-3 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Diễn viên chính
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {item.cast.map((actor, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-full bg-[#0C1E2E] text-sm text-cyan-100 font-medium border border-[#19A7C7]/20 hover:border-[#35C2C8]/50 transition-colors"
                        >
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Film badge */}
                {item.aiInvolvement?.isAiFilm && (
                  <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 text-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                        Phim AI — Công cụ sử dụng
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.aiInvolvement.toolsUsed.map((tool, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-purple-900/60 border border-purple-500/30 text-xs text-purple-200 font-medium"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-purple-300/80 mt-3 italic">{item.aiInvolvement.workflowNotes}</p>
                  </div>
                )}

                {/* Series shortcut — glass-ocean card */}
                {isSeries && (
                  <div className="glass-ocean rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#087EA4]/25 border border-[#35C2C8]/30 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-[#35C2C8]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Tác phẩm dạng Series ({item.seasons?.length || 1} Mùa)
                        </h3>
                        <p className="text-xs text-[#8BA7B8] mt-0.5">
                          Xem danh sách tập, tóm tắt AI và tiến độ xem
                        </p>
                      </div>
                    </div>
                    {onOpenSeriesDetail && (
                      <button
                        onClick={() => onOpenSeriesDetail(item)}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        Mở Series <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Rating card — glass-dark */}
                <div className="glass-dark rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                      Chấm điểm tác phẩm này
                    </span>
                    {ratingMessage && (
                      <span className="text-xs font-semibold text-emerald-400 animate-fade-in">
                        {ratingMessage}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleRate(score)}
                        id={`detail-rate-${score}`}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                          userScore === score
                            ? 'bg-gradient-to-br from-[#087EA4] to-[#35C2C8] text-white shadow-[0_0_14px_rgba(53,194,200,0.45)]'
                            : 'bg-[#0C1E2E] hover:bg-[#0E2740] text-[#8BA7B8] hover:text-white border border-[#19A7C7]/20 hover:border-[#35C2C8]/50'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── AI INSIGHT ─── */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-fade-in">
                {/* Main card — ai-recommendation-panel style */}
                <div className="ai-recommendation-panel rounded-2xl p-6 border border-[#19A7C7]/15">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#087EA4]/25 border border-[#35C2C8]/30 flex items-center justify-center animate-pulse-ocean">
                      <Brain className="w-5 h-5 text-[#35C2C8]" />
                    </div>
                    <h2 className="text-base font-bold text-white">
                      Vì sao bạn có thể thích bộ phim này?
                    </h2>
                  </div>
                  <p className="text-sm text-cyan-100/90 leading-relaxed">
                    {aiInsight?.whyYouMayLike ||
                      item.whyYouMayLike ||
                      'Tác phẩm sở hữu ngôn ngữ điện ảnh sâu sắc, phù hợp cho những ai tìm kiếm sự chiêm nghiệm và xúc cảm lắng đọng.'}
                  </p>
                  {item.aiMatchScore && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#087EA4] to-[#19A7C7] text-white text-xs font-bold shadow-[0_0_20px_rgba(53,194,200,0.3)]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="ai-match-percentage text-sm">{item.aiMatchScore}%</span>
                      phù hợp với khẩu vị của bạn
                    </div>
                  )}
                </div>

                {/* Grid of analysis cards */}
                {aiInsight && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Chủ đề (Themes)',    value: aiInsight.themes },
                      { label: 'Phong cách thị giác', value: aiInsight.visualStyle },
                      { label: 'Cường độ cảm xúc',   value: aiInsight.emotionalIntensity },
                      { label: 'Khán giả phù hợp',   value: aiInsight.audienceFit },
                    ]
                      .filter((c) => c.value)
                      .map((card, i) => (
                        <div key={i} className="card-base card-hover p-5">
                          <span className="text-ocean-small block mb-2">{card.label}</span>
                          <p className="text-sm text-[#8BA7B8] leading-relaxed">{card.value}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── STREAMING ─── */}
            {activeTab === 'streaming' && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="section-header-line text-[11px] font-bold uppercase tracking-widest text-[#35C2C8]/70">
                  Nền tảng phát hành bản quyền
                </h2>
                {item.streamingOptions?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item.streamingOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="card-base card-hover p-5 flex items-center gap-4"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${getProviderColor(opt.provider)}`}
                        >
                          {opt.provider.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">{opt.provider}</h3>
                          <div className="flex items-center gap-2 text-xs text-[#8BA7B8] mt-0.5">
                            <span>{opt.region}</span>
                            <span className="text-white/20">·</span>
                            <span className={`font-semibold ${opt.type === 'free' ? 'text-emerald-400' : 'text-[#35C2C8]'}`}>
                              {opt.type === 'subscription'
                                ? 'Gói thuê bao'
                                : opt.type === 'rent'
                                ? `Thuê: ${opt.price || '$3.99'}`
                                : 'Miễn phí'}
                            </span>
                          </div>
                        </div>
                        <a
                          href={opt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary text-xs px-3 py-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Xem
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-base py-14 text-center text-sm text-[#8BA7B8]">
                    Đang cập nhật nguồn phát bản quyền.
                  </div>
                )}
              </div>
            )}

            {/* ─── SUBTITLES ─── */}
            {activeTab === 'subtitles' && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="section-header-line text-[11px] font-bold uppercase tracking-widest text-[#35C2C8]/70">
                  Phụ đề có sẵn
                </h2>
                <div className="flex flex-wrap gap-2">
                  {item.subtitlesAvailable?.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSub(sub.language)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
                        selectedSub === sub.language
                          ? 'bg-gradient-to-r from-[#087EA4] to-[#35C2C8] text-white shadow-[0_0_14px_rgba(53,194,200,0.35)]'
                          : 'btn-ghost'
                      }`}
                    >
                      {sub.language} {sub.isAiAssisted && '✦ AI'}
                    </button>
                  ))}
                </div>

                {item.subtitlesAvailable?.find((s) => s.language === selectedSub)?.sampleDialogue && (
                  <div className="glass-ocean rounded-2xl p-5 space-y-3">
                    <span className="font-bold text-[#35C2C8] text-sm block">Trích đoạn dịch mẫu:</span>
                    <p className="italic text-[#8BA7B8] text-sm">
                      Gốc:{' '}
                      {
                        item.subtitlesAvailable?.find((s) => s.language === selectedSub)
                          ?.sampleDialogue?.original
                      }
                    </p>
                    <p className="font-semibold text-cyan-100 text-sm">
                      Dịch:{' '}
                      {
                        item.subtitlesAvailable?.find((s) => s.language === selectedSub)
                          ?.sampleDialogue?.translated
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — sidebar (desktop only) */}
          <div className="lg:w-68 shrink-0 space-y-5">

            {/* Quick info — glass-dark card */}
            <div className="glass-dark rounded-2xl p-5 space-y-4">
              <h3 className="text-ocean-small section-header-line">Thông tin</h3>
              {[
                { label: 'Loại',      value: typeLabel },
                { label: 'Năm',       value: item.year?.toString() },
                { label: 'Thời lượng', value: item.runtime },
                { label: 'Đạo diễn', value: item.director },
                { label: 'Thể loại', value: item.genres?.join(', ') },
                { label: 'Điểm',     value: `${item.rating} / 10` },
                ...(item.seasons?.length ? [{ label: 'Số mùa', value: `${item.seasons.length} mùa` }] : []),
              ]
                .filter((r) => r.value)
                .map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-3">
                    <span className="text-xs text-[#8BA7B8] shrink-0">{row.label}</span>
                    <span className="text-xs text-white font-semibold text-right leading-snug">
                      {row.value}
                    </span>
                  </div>
                ))}
            </div>

            {/* Moods / tags */}
            {item.moods?.length > 0 && (
              <div className="glass-dark rounded-2xl p-5">
                <h3 className="text-ocean-small section-header-line mb-3">Cảm xúc</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.moods.map((mood, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-[#0C1E2E] border border-[#19A7C7]/20 text-xs text-cyan-200/80 capitalize"
                    >
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            SIMILAR FILMS — mirrors MovieRail style
            ════════════════════════════════════════ */}
        {similarFilms.length > 0 && (
          <div className="mt-16 pt-8 border-t border-[#19A7C7]/15">
            {/* Section header with rail-style accent line */}
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="section-title section-header-line">
                Cùng hải trình khám phá
              </h2>
              <span className="section-subtitle hidden sm:block">
                Những tác phẩm cùng dòng chảy
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {similarFilms.map((other) => (
                <div
                  key={other.id}
                  onClick={() => onSelectMedia(other)}
                  className="flex flex-col gap-2 cursor-pointer group text-left"
                >
                  <div className="card-base card-hover rounded-xl overflow-hidden aspect-[2/3]">
                    {/* Gradient overlay on hover — same as MovieCard */}
                    <div className="relative w-full h-full">
                      <img
                        src={other.posterUrl}
                        alt={other.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 ocean-gradient-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-[#35C2C8] transition-colors truncate leading-tight">
                      {other.title}
                    </h3>
                    <span className="text-[10px] text-[#8BA7B8]">
                      {other.year} · ★ {other.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
