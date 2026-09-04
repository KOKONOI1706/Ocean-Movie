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
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#062B45]/80 backdrop-blur-md flex justify-center p-4 text-[#062B45] animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6 border border-[#087EA4]/20 text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#062B45] to-[#19A7C7] p-0.5 shadow-md flex items-center justify-center text-white">
              <div className="w-full h-full bg-[#062B45] rounded-[14px] flex items-center justify-center">
                <Compass className="w-7 h-7 text-[#35C2C8]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#062B45]">
                  {tasteProfile.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#087EA4]/15 text-[#087EA4] border border-[#19A7C7]/20 text-[10px] font-extrabold uppercase">
                  Thủy thủ đoàn
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {tasteProfile.memberSince}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-100 text-center">
            <Film className="w-4 h-4 text-[#087EA4] mx-auto mb-1" />
            <span className="text-xl font-extrabold text-[#062B45] block">
              {tasteProfile.stats.filmsWatched}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Phim đã xem
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-100 text-center">
            <Clock className="w-4 h-4 text-[#19A7C7] mx-auto mb-1" />
            <span className="text-xl font-extrabold text-[#062B45] block">
              {tasteProfile.stats.hoursLogged}h
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Giờ hải trình
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-100 text-center">
            <Sparkles className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <span className="text-xl font-extrabold text-[#062B45] block">
              {tasteProfile.stats.aiFilmsDiscovered}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Phim AI khám phá
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-100 text-center">
            <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <span className="text-xl font-extrabold text-[#062B45] block">
              {tasteProfile.stats.notesWritten}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Ghi chép / Đánh giá
            </span>
          </div>
        </div>

        {/* AI Taste Profile Analysis */}
        <div className="bg-[#087EA4]/10 p-4 sm:p-5 rounded-2xl border border-[#19A7C7]/30 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#087EA4]" />
            <h3 className="text-xs font-bold text-[#062B45] uppercase tracking-wider">
              HỒ SƠ GU THẨM MỸ AI (AI TASTE PROFILE)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#062B45]/90 leading-relaxed font-normal">
            {tasteProfile.editorialSummary}
          </p>
        </div>

        {/* Top Genres Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Khẩu vị thể loại yêu thích
          </h3>

          <div className="space-y-2.5">
            {tasteProfile.topGenres.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#062B45]">{item.genre}</span>
                  <span className="text-[#087EA4]">{item.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#087EA4] to-[#35C2C8] rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streaming Services Connected */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Dịch vụ xem phim đã kết nối
          </h3>
          <div className="flex flex-wrap gap-2">
            {tasteProfile.activeStreamingServices.map((service, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
