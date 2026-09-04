import React, { useState } from 'react';
import { MediaItem } from '../types';
import { X, ExternalLink, Globe, ShieldCheck, Play, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface WhereToWatchModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const WhereToWatchModal: React.FC<WhereToWatchModalProps> = ({ item, onClose }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('VN');

  if (!item) return null;

  const regions = [
    { id: 'VN', name: 'Việt Nam' },
    { id: 'Global', name: 'Quốc tế' },
    { id: 'US', name: 'Hoa Kỳ' },
    { id: 'JP', name: 'Nhật Bản' }
  ];

  const streamingList = item.streamingOptions || [
    {
      provider: 'Netflix',
      type: 'subscription',
      region: 'Global / VN',
      url: 'https://netflix.com',
      badge: 'Gói xem phim Netflix'
    }
  ];

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#030B14]/85 backdrop-blur-xl flex justify-center p-4 text-[#E8F4F8] animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#071728]/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(8,126,164,0.2)] overflow-hidden my-auto p-6 sm:p-8 space-y-6 border border-[#35C2C8]/25 text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#19A7C7]/20">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 text-[11px] font-bold uppercase tracking-wider block w-fit mb-1.5">
              ĐỊNH VỊ NGUỒN PHÁT CHÍNH THỨC
            </span>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              Nơi xem “{item.title}”
            </h2>
            <p className="text-xs text-[#8BA7B8] mt-1">
              Năm {item.year} · {item.runtime} · {item.director}
            </p>
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

        {/* Region Selector */}
        <div className="flex items-center justify-between bg-[#061424]/70 p-3 rounded-2xl border border-[#19A7C7]/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8BA7B8]">
            <Globe className="w-4 h-4 text-[#35C2C8]" />
            <span>Khu vực:</span>
          </div>

          <div className="flex gap-1.5">
            {regions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-gradient-to-r from-[#087EA4] to-[#35C2C8] text-white shadow-[0_0_10px_rgba(53,194,200,0.3)]'
                    : 'bg-[#0B2035]/60 text-[#8BA7B8] border border-[#19A7C7]/20 hover:text-white hover:bg-[#0F2A45]'
                }`}
              >
                {reg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Available Streaming Options */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#35C2C8]/80">
            Nền tảng trực tuyến có sẵn
          </h3>

          <div className="space-y-2.5">
            {streamingList.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#0B2035]/50 border border-[#19A7C7]/20 hover:border-[#35C2C8]/40 hover:bg-[#0F2A45]/70 shadow-xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 flex items-center justify-center font-bold text-sm">
                    {opt.provider.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {opt.provider}
                    </h4>
                    <span className="text-xs text-[#8BA7B8]">
                      {opt.type === 'subscription'
                        ? 'Gói thuê bao'
                        : opt.type === 'rent'
                        ? `Thuê: ${opt.price || '$3.99'}`
                        : 'Xem miễn phí có bản quyền'}
                    </span>
                  </div>
                </div>

                <a
                  href={opt.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Xem tại nguồn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Safety Notice */}
        <div className="bg-gradient-to-br from-[#087EA4]/20 via-[#0B2035]/60 to-[#071728]/80 p-4 rounded-2xl border border-[#35C2C8]/30 shadow-[0_0_20px_rgba(8,126,164,0.1)] flex items-start gap-3 text-xs text-[#E8F4F8]">
          <ShieldCheck className="w-5 h-5 text-[#35C2C8] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-white">Cam kết nguồn phát hợp pháp</h5>
            <p className="text-cyan-100/80 leading-relaxed">
              Biển Phim là la bàn chỉ dẫn đường đến các nguồn phát hành bản quyền chính thức. Chúng tôi không lưu trữ, phân phối hay tải lên tệp phim lậu dưới mọi hình thức.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
