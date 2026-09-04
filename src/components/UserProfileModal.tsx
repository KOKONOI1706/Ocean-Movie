import React from 'react';
import { X, User, Sparkles, Compass, Film, Clock, Award, Tv, CheckCircle2, Sliders } from 'lucide-react';
import { UserTasteProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasteProfile: UserTasteProfile;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  tasteProfile
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#030B14]/85 backdrop-blur-xl flex justify-center p-4 text-[#E8F4F8] animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#071728]/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(8,126,164,0.2)] overflow-hidden my-auto p-6 sm:p-8 space-y-6 border border-[#35C2C8]/25 text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#19A7C7]/20">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#087EA4] to-[#35C2C8] p-0.5 shadow-[0_0_20px_rgba(53,194,200,0.4)] flex items-center justify-center text-white">
              <div className="w-full h-full bg-[#061424] rounded-[14px] flex items-center justify-center">
                <Compass className="w-7 h-7 text-[#35C2C8]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {tasteProfile.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 text-[10px] font-extrabold uppercase">
                  Thủy thủ đoàn
                </span>
              </div>
              <p className="text-xs text-[#8BA7B8] mt-0.5">
                {tasteProfile.memberSince}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-cyan-200/80 hover:text-white border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
            title="Đóng"
            aria-label="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0B2035]/50 border border-[#19A7C7]/20 text-center shadow-xs">
            <Film className="w-4 h-4 text-[#35C2C8] mx-auto mb-1" />
            <span className="text-xl font-extrabold text-white block">
              {tasteProfile.stats.filmsWatched}
            </span>
            <span className="text-[11px] text-[#8BA7B8] font-medium">
              Phim đã xem
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0B2035]/50 border border-[#19A7C7]/20 text-center shadow-xs">
            <Clock className="w-4 h-4 text-[#19A7C7] mx-auto mb-1" />
            <span className="text-xl font-extrabold text-white block">
              {tasteProfile.stats.hoursLogged}h
            </span>
            <span className="text-[11px] text-[#8BA7B8] font-medium">
              Giờ hải trình
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0B2035]/50 border border-[#19A7C7]/20 text-center shadow-xs">
            <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-xl font-extrabold text-white block">
              {tasteProfile.stats.aiFilmsDiscovered}
            </span>
            <span className="text-[11px] text-[#8BA7B8] font-medium">
              Phim AI khám phá
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0B2035]/50 border border-[#19A7C7]/20 text-center shadow-xs">
            <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-xl font-extrabold text-white block">
              {tasteProfile.stats.notesWritten}
            </span>
            <span className="text-[11px] text-[#8BA7B8] font-medium">
              Ghi chép / Đánh giá
            </span>
          </div>
        </div>

        {/* AI Taste Profile Analysis */}
        <div className="bg-gradient-to-br from-[#087EA4]/20 via-[#0B2035]/60 to-[#071728]/80 p-4 sm:p-5 rounded-2xl border border-[#35C2C8]/30 shadow-[0_0_20px_rgba(8,126,164,0.1)] space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#35C2C8]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              HỒ SƠ GU THẨM MỸ AI (AI TASTE PROFILE)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed font-normal">
            {tasteProfile.editorialSummary}
          </p>
        </div>

        {/* Top Genres Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#35C2C8]/80">
            Khẩu vị thể loại yêu thích
          </h3>

          <div className="space-y-2.5">
            {tasteProfile.topGenres.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white">{item.genre}</span>
                  <span className="text-[#35C2C8]">{item.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#061424] border border-[#19A7C7]/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#087EA4] to-[#35C2C8] rounded-full shadow-[0_0_8px_#35C2C8]"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streaming Services Connected */}
        <div className="space-y-2 pt-2 border-t border-[#19A7C7]/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#35C2C8]/80">
            Dịch vụ xem phim đã kết nối
          </h3>
          <div className="flex flex-wrap gap-2">
            {tasteProfile.activeStreamingServices.map((service, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-[#0B2035]/60 border border-[#19A7C7]/20 text-xs font-semibold text-cyan-100 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
