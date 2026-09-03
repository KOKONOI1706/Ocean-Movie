import React, { useState } from 'react';
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
  Calendar,
  Layers,
  Globe,
  Film,
  Tv,
  ArrowRight
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

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  item,
  onClose,
  onSelectMedia,
  onOpenWhereToWatch,
  onOpenSeriesDetail,
  isSaved,
  onToggleSave
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'streaming' | 'subtitles'>('overview');
  const [selectedSub, setSelectedSub] = useState(item.subtitlesAvailable?.[0]?.language || 'Tiếng Việt');

  const similarFilms = CINEMA_ITEMS.filter(
    (other) =>
      other.id !== item.id &&
      (other.genres.some((g) => item.genres.includes(g)) ||
        other.type === item.type)
  ).slice(0, 3);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSeries = item.type === 'series' || (item.seasons && item.seasons.length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#062B45]/80 backdrop-blur-md flex justify-center p-0 sm:p-4 md:p-6 text-[#062B45] animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col min-h-screen sm:min-h-0 border border-[#087EA4]/20">
        {/* Top Floating Control Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF8FC] text-[#087EA4] text-xs font-bold uppercase tracking-wider">
              {item.type === 'series' ? 'Series' : item.type === 'anime' ? 'Anime' : item.type === 'ai_film' ? 'AI Film' : 'Phim Điện Ảnh'}
            </span>
            <span className="hidden sm:inline text-xs text-gray-400">·</span>
            <span className="hidden sm:inline text-xs font-semibold text-gray-500">
              {item.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(item)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-[#087EA4] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-[#062B45]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Đã lưu' : '+ Hải trình'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Chia sẻ phim"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Backdrop & Film Info Header */}
        <div className="relative bg-[#062B45] text-white">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[360px] w-full overflow-hidden">
            <img
              src={item.backdropUrl || item.posterUrl}
              alt={item.title}
              className="w-full h-full object-cover object-center brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062B45] via-[#062B45]/40 to-transparent" />
          </div>

          {/* Overlapping Content Bar */}
          <div className="px-6 pb-6 pt-2 sm:pt-4 relative z-10 -mt-16 sm:-mt-24">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
              {/* Poster Thumbnail */}
              <div className="w-28 sm:w-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white shrink-0 bg-black aspect-[2/3] hidden xs:block">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 text-left space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#35C2C8] font-semibold">
                  <span>{item.year}</span>
                  <span>·</span>
                  <span>{item.runtime}</span>
                  <span>·</span>
                  <span>{item.genres.join(', ')}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {item.title}
                </h1>

                {item.originalTitle && item.originalTitle !== item.title && (
                  <p className="text-xs sm:text-sm text-gray-300 italic">
                    Tên gốc: {item.originalTitle}
                  </p>
                )}

                {/* Rating & Director */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1">
                  <div className="flex items-center gap-1 text-amber-400 font-bold bg-black/40 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{item.rating} / 10</span>
                  </div>
                  {item.director && (
                    <div>
                      <span className="text-gray-400">Đạo diễn: </span>
                      <span className="font-semibold text-white">{item.director}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Actions */}
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                {isSeries && onOpenSeriesDetail ? (
                  <button
                    onClick={() => onOpenSeriesDetail(item)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:from-[#062B45] hover:to-[#087EA4] text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Xem các tập & mùa</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenWhereToWatch(item)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:from-[#062B45] hover:to-[#087EA4] text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Xem phim ngay</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenWhereToWatch(item)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#35C2C8]" />
                  <span>Nơi xem bản quyền</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 bg-[#FAF8F5] px-6 flex gap-4 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'ai', label: 'AI Insight & Đánh giá' },
            { id: 'streaming', label: 'Nguồn phát (Where to Watch)' },
            { id: 'subtitles', label: 'Phụ đề & Ngôn ngữ' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 transition-colors relative cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#087EA4] font-bold'
                  : 'text-gray-500 hover:text-[#062B45]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#087EA4]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6 text-left space-y-6 flex-1 bg-white">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {item.tagline && (
                <p className="text-base text-[#087EA4] font-medium italic">
                  “{item.tagline}”
                </p>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Tóm tắt nội dung
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed font-normal">
                  {item.synopsis}
                </p>
              </div>

              {item.cast && item.cast.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Diễn viên chính
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.cast.map((actor, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 font-medium"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Series Shortcut if it is a series */}
              {isSeries && (
                <div className="bg-[#EAF8FC] p-4 rounded-2xl border border-[#19A7C7]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tv className="w-5 h-5 text-[#087EA4]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#062B45]">
                        Tác phẩm dạng Series ({item.seasons?.length || 1} Mùa)
                      </h4>
                      <p className="text-xs text-gray-500">
                        Xem danh sách tập, tóm tắt thông minh và ghi nhớ tiến độ xem.
                      </p>
                    </div>
                  </div>
                  {onOpenSeriesDetail && (
                    <button
                      onClick={() => onOpenSeriesDetail(item)}
                      className="px-4 py-2 rounded-xl bg-[#087EA4] text-white text-xs font-semibold hover:bg-[#062B45] transition-colors cursor-pointer"
                    >
                      Mở trang Series →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI INSIGHT TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="bg-[#EAF8FC]/60 p-4 sm:p-5 rounded-2xl border border-[#19A7C7]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#087EA4]" />
                  <h3 className="text-sm font-bold text-[#062B45]">
                    Vì sao bạn có thể thích bộ phim này?
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {item.whyYouMayLike ||
                    'Tác phẩm sở hữu ngôn ngữ điện ảnh sâu sắc, phù hợp cho những ai tìm kiếm sự chiêm nghiệm và xúc cảm lắng đọng.'}
                </p>
              </div>

              {item.aiMattersAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Chủ đề chính (Themes)
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {item.aiMattersAnalysis.themes}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Không khí & Phong cách thị giác
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {item.aiMattersAnalysis.visualStyle}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Nhịp kể & Cường độ cảm xúc
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {item.aiMattersAnalysis.emotionalIntensity}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Khán giả phù hợp
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {item.aiMattersAnalysis.audienceFit}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STREAMING TAB */}
          {activeTab === 'streaming' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Nền tảng phát hành bản quyền
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.streamingOptions && item.streamingOptions.length > 0 ? (
                  item.streamingOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-[#087EA4] transition-colors"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[#062B45]">
                          {opt.provider}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {opt.type === 'subscription'
                            ? 'Gói thuê bao'
                            : opt.type === 'rent'
                            ? `Thuê: ${opt.price || '$3.99'}`
                            : 'Xem miễn phí có quảng cáo'}
                        </span>
                      </div>
                      <a
                        href={opt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#087EA4] text-white text-xs font-semibold hover:bg-[#062B45] transition-colors"
                      >
                        Truy cập
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">
                    Đang cập nhật thêm nguồn phát bản quyền.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SUBTITLES TAB */}
          {activeTab === 'subtitles' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Phụ đề có sẵn
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.subtitlesAvailable?.map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSub(sub.language)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      selectedSub === sub.language
                        ? 'bg-[#087EA4] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sub.language} {sub.isAiAssisted && '(AI Tinh Chỉnh)'}
                  </button>
                ))}
              </div>

              {item.subtitlesAvailable?.find((s) => s.language === selectedSub)?.sampleDialogue && (
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-gray-200 text-xs space-y-2 mt-3">
                  <span className="font-semibold text-[#087EA4] block">
                    Trích đoạn dịch mẫu:
                  </span>
                  <p className="italic text-gray-600">
                    Gốc: {item.subtitlesAvailable?.find((s) => s.language === selectedSub)?.sampleDialogue?.original}
                  </p>
                  <p className="font-medium text-[#062B45]">
                    Dịch: {item.subtitlesAvailable?.find((s) => s.language === selectedSub)?.sampleDialogue?.translated}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Similar Items rail */}
          {similarFilms.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Cùng hải trình khám phá
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {similarFilms.map((other) => (
                  <div
                    key={other.id}
                    onClick={() => onSelectMedia(other)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors"
                  >
                    <img
                      src={other.posterUrl}
                      alt={other.title}
                      className="w-12 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="truncate text-left">
                      <h4 className="text-xs font-bold text-[#062B45] truncate">
                        {other.title}
                      </h4>
                      <span className="text-[11px] text-gray-400">
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
