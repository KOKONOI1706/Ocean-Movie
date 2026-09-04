import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import {
  X,
  Bookmark,
  Star,
  Play,
  MapPin,
  Sparkles,
  Share2,
  Check,
  Clock,
  Layers,
  Globe,
  Film,
  Tv,
  ArrowRight,
  Brain,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { CINEMA_ITEMS } from '../data/cinemaData';

interface MovieDetailModalProps {
  item: MediaItem;
  onClose: () => void;
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
  'Mubi': 'bg-[#062B45]',
  'Vimeo': 'bg-blue-500',
  'Official': 'bg-[#087EA4]',
};

const getProviderColor = (name: string) => {
  for (const [key, val] of Object.entries(STREAMING_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return 'bg-[#062B45]';
};

import { moviesApi, aiApi } from '../lib/api';

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  item,
  onClose,
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

  useEffect(() => {
    // Load cached AI insight from PostgreSQL
    let isMounted = true;
    aiApi
      .getFilmInsight(item.id)
      .then((data) => {
        if (isMounted && data) {
          setAiInsight(data);
        }
      })
      .catch((err) => console.warn('Could not fetch AI insight:', err));

    return () => {
      isMounted = false;
    };
  }, [item.id]);

  const handleRate = async (score: number) => {
    setUserScore(score);
    try {
      await moviesApi.rate(item.id, score);
      setRatingMessage(`Cảm ơn bạn đã chấm ${score}/10!`);
      setTimeout(() => setRatingMessage(''), 3000);
    } catch (err) {
      console.warn('Failed to save rating:', err);
    }
  };

  const similarFilms = CINEMA_ITEMS.filter(
    (other) =>
      other.id !== item.id &&
      (other.genres.some((g) => item.genres.includes(g)) || other.type === item.type)
  ).slice(0, 4);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);

  const TABS = [
    { id: 'overview', label: 'Tổng quan', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'ai',       label: 'AI Insight', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'streaming', label: 'Nơi xem', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'subtitles', label: 'Phụ đề', icon: <Globe className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#062B45]/80 backdrop-blur-md flex justify-center p-0 sm:p-4 md:p-8 text-[#062B45] animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết: ${item.title}`}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col min-h-screen sm:min-h-0 border border-[#087EA4]/15">

        {/* === STICKY TOP BAR === */}
        <div className="sticky top-0 z-30 bg-white/97 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#087EA4]/15 text-[#087EA4] border border-[#19A7C7]/20 text-[10px] font-bold uppercase tracking-wider">
              {item.type === 'series' ? 'Series' : item.type === 'anime' ? 'Anime' : item.type === 'ai_film' ? 'AI Film' : item.type === 'short' ? 'Phim Ngắn' : 'Phim Điện Ảnh'}
            </span>
            <span className="hidden sm:inline text-xs text-gray-400 truncate max-w-xs">
              {item.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(item)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-[#087EA4] text-white'
                  : 'bg-[#087EA4]/10 hover:bg-[#087EA4]/20 text-[#087EA4] border border-[#19A7C7]/25'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Đã lưu' : '+ Hải trình'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
              title="Chia sẻ"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              title="Đóng"
              aria-label="Đóng modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* === HERO BACKDROP === */}
        <div className="relative bg-[#062B45] text-white">
          <div className="relative w-full overflow-hidden" style={{ maxHeight: '340px' }}>
            <img
              src={item.backdropUrl || item.posterUrl}
              alt={item.title}
              className="w-full h-full object-cover object-center"
              style={{ aspectRatio: '21/9', minHeight: '200px' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062B45] via-[#062B45]/50 to-transparent" />
          </div>

          {/* Content overlapping bottom of hero */}
          <div className="px-5 sm:px-8 pb-6 pt-0 -mt-20 sm:-mt-28 relative z-10">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
              {/* Poster thumbnail */}
              <div className="w-24 sm:w-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 shrink-0 bg-black hidden xs:block"
                style={{ aspectRatio: '2/3' }}>
                <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>

              {/* Title & Meta */}
              <div className="flex-1 text-left space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#35C2C8] font-semibold">
                  <span>{item.year}</span>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.runtime}
                  </span>
                  <span className="text-white/20">·</span>
                  <span>{item.genres.slice(0, 3).join(', ')}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {item.title}
                </h1>

                {item.originalTitle && item.originalTitle !== item.title && (
                  <p className="text-xs text-gray-400 italic">Tên gốc: {item.originalTitle}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                  <div className="flex items-center gap-1 text-amber-400 font-bold bg-black/40 px-2.5 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{item.rating} / 10</span>
                  </div>
                  {item.aiMatchScore && (
                    <div className="ai-match-badge">
                      <Sparkles className="w-3 h-3" />
                      {item.aiMatchScore}% AI Match
                    </div>
                  )}
                  {item.director && (
                    <span>
                      ĐD: <span className="font-semibold text-white">{item.director}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                {isSeries && onOpenSeriesDetail ? (
                  <button
                    onClick={() => onOpenSeriesDetail(item)}
                    className="btn-primary flex-1 sm:flex-none"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Xem tập & Mùa</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenWhereToWatch(item)}
                    className="btn-primary flex-1 sm:flex-none"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Xem phim ngay</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenWhereToWatch(item)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#35C2C8]" />
                  <span>Nơi xem</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === TABS === */}
        <div className="border-b border-gray-100 bg-[#FAF8F5] px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-xs font-semibold whitespace-nowrap relative transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#087EA4]'
                  : 'text-gray-500 hover:text-[#062B45]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#087EA4]" />
              )}
            </button>
          ))}
        </div>

        {/* === TAB CONTENT === */}
        <div className="p-5 sm:p-6 flex-1 bg-white text-left space-y-5 overflow-y-auto">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              {item.tagline && (
                <p className="text-base text-[#087EA4] font-medium italic border-l-3 border-[#19A7C7] pl-4 bg-[#087EA4]/10 py-2 pr-3 rounded-r-xl">
                  "{item.tagline}"
                </p>
              )}

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Tóm tắt nội dung
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{item.synopsis}</p>
              </div>

              {item.cast?.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Diễn viên chính
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.cast.map((actor, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-[#F6F1E7] text-xs text-[#062B45] font-medium border border-[#087EA4]/10">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Film tech badge */}
              {item.aiInvolvement?.isAiFilm && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider">
                      Phim AI — Công cụ sử dụng
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.aiInvolvement.toolsUsed.map((tool, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-100 text-xs text-purple-700 font-medium">
                        {tool}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 mt-2 italic">{item.aiInvolvement.workflowNotes}</p>
                </div>
              )}

              {/* Series shortcut */}
              {isSeries && (
                <div className="bg-[#087EA4]/10 p-4 rounded-2xl border border-[#19A7C7]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tv className="w-5 h-5 text-[#087EA4]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#062B45]">
                        Tác phẩm dạng Series ({item.seasons?.length || 1} Mùa)
                      </h4>
                      <p className="text-xs text-gray-500">
                        Xem danh sách tập, tóm tắt AI và tiến độ xem
                      </p>
                    </div>
                  </div>
                  {onOpenSeriesDetail && (
                    <button
                      onClick={() => onOpenSeriesDetail(item)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087EA4] text-white text-xs font-semibold hover:bg-[#062B45] transition-colors cursor-pointer"
                    >
                      Mở Series <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Interactive Rating Card */}
              <div className="p-4 rounded-2xl bg-[#F6F1E7]/70 border border-[#087EA4]/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#062B45] flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    Chấm điểm tác phẩm này (Lưu vào hồ sơ)
                  </span>
                  {ratingMessage && (
                    <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
                      {ratingMessage}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleRate(score)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        userScore === score
                          ? 'bg-[#087EA4] text-white shadow-md'
                          : 'bg-white hover:bg-[#087EA4]/15 text-gray-700 border border-gray-200 hover:border-[#19A7C7]'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI INSIGHT TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-5 animate-fade-in">
              {/* Why you may like this */}
              <div className="bg-gradient-to-br from-[#087EA4]/10 to-[#062B45]/5 p-5 rounded-2xl border border-[#19A7C7]/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#087EA4]/15 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-[#087EA4]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#062B45]">
                    Vì sao bạn có thể thích bộ phim này?
                  </h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {aiInsight?.whyYouMayLike || item.whyYouMayLike || 'Tác phẩm sở hữu ngôn ngữ điện ảnh sâu sắc, phù hợp cho những ai tìm kiếm sự chiêm nghiệm và xúc cảm lắng đọng.'}
                </p>
                {item.aiMatchScore && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#087EA4] text-white text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    {item.aiMatchScore}% phù hợp với khẩu vị của bạn
                  </div>
                )}
              </div>

              {/* Analysis grid */}
              {aiInsight && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Chủ đề (Themes)', value: aiInsight.themes, color: 'bg-[#087EA4]/10 border-[#19A7C7]/20' },
                    { label: 'Phong cách thị giác', value: aiInsight.visualStyle, color: 'bg-[#F6F1E7] border-[#087EA4]/10' },
                    { label: 'Cường độ cảm xúc', value: aiInsight.emotionalIntensity, color: 'bg-[#087EA4]/10 border-[#19A7C7]/20' },
                    { label: 'Khán giả phù hợp', value: aiInsight.audienceFit, color: 'bg-[#F6F1E7] border-[#087EA4]/10' },
                  ].filter(card => card.value).map((card, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${card.color}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                        {card.label}
                      </span>
                      <p className="text-xs text-gray-700 leading-relaxed">{card.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STREAMING TAB */}
          {activeTab === 'streaming' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Nền tảng phát hành bản quyền
              </h3>
              {item.streamingOptions?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.streamingOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-200 hover:border-[#087EA4]/40 transition-all flex items-center gap-4"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${getProviderColor(opt.provider)}`}>
                        {opt.provider.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#062B45] truncate">{opt.provider}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{opt.region}</span>
                          <span className="text-gray-200">·</span>
                          <span className={`font-semibold ${opt.type === 'free' ? 'text-emerald-600' : 'text-[#087EA4]'}`}>
                            {opt.type === 'subscription' ? 'Gói thuê bao' : opt.type === 'rent' ? `Thuê: ${opt.price || '$3.99'}` : 'Miễn phí'}
                          </span>
                        </div>
                      </div>
                      <a
                        href={opt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#087EA4] text-white text-xs font-semibold hover:bg-[#062B45] transition-colors shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500 bg-[#F6F1E7] rounded-2xl">
                  Đang cập nhật nguồn phát bản quyền.
                </div>
              )}
            </div>
          )}

          {/* SUBTITLES TAB */}
          {activeTab === 'subtitles' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Phụ đề có sẵn
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.subtitlesAvailable?.map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSub(sub.language)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        selectedSub === sub.language
                          ? 'bg-[#087EA4] text-white shadow-sm'
                          : 'bg-[#F6F1E7] text-gray-700 hover:bg-[#087EA4]/15 border border-gray-200'
                      }`}
                  >
                    {sub.language} {sub.isAiAssisted && '✦ AI'}
                  </button>
                ))}
              </div>

              {item.subtitlesAvailable?.find((s) => s.language === selectedSub)?.sampleDialogue && (
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-gray-200 text-xs space-y-2">
                  <span className="font-bold text-[#087EA4] block">Trích đoạn dịch mẫu:</span>
                  <p className="italic text-gray-600">
                    Gốc: {item.subtitlesAvailable?.find((s) => s.language === selectedSub)?.sampleDialogue?.original}
                  </p>
                  <p className="font-semibold text-[#062B45]">
                    Dịch: {item.subtitlesAvailable?.find((s) => s.language === selectedSub)?.sampleDialogue?.translated}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Similar Films */}
          {similarFilms.length > 0 && (
            <div className="pt-5 border-t border-gray-100">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                Cùng hải trình khám phá
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similarFilms.map((other) => (
                  <div
                    key={other.id}
                    onClick={() => onSelectMedia(other)}
                    className="flex flex-col gap-2 cursor-pointer group"
                  >
                    <div className="rounded-xl overflow-hidden aspect-[2/3] bg-[#062B45]/10">
                      <img
                        src={other.posterUrl}
                        alt={other.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#062B45] group-hover:text-[#087EA4] transition-colors truncate">
                        {other.title}
                      </h4>
                      <span className="text-[10px] text-gray-400">
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
    </div>
  );
};
