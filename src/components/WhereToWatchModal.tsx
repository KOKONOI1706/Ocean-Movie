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
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#062B45]/80 backdrop-blur-md flex justify-center p-4 text-[#062B45] animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6 border border-[#087EA4]/20 text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF8FC] text-[#087EA4] text-[11px] font-bold uppercase tracking-wider block w-fit mb-1.5">
              ĐỊNH VỊ NGUỒN PHÁT CHÍNH THỨC
            </span>
            <h2 className="text-2xl font-extrabold text-[#062B45] leading-tight">
              Nơi xem “{item.title}”
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Năm {item.year} · {item.runtime} · {item.director}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Region Selector */}
        <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <Globe className="w-4 h-4 text-[#087EA4]" />
            <span>Khu vực:</span>
          </div>

          <div className="flex gap-1.5">
            {regions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-[#087EA4] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {reg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Available Streaming Options */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Nền tảng trực tuyến có sẵn
          </h3>

          <div className="space-y-2.5">
            {streamingList.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#087EA4] shadow-xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF8FC] text-[#087EA4] flex items-center justify-center font-bold text-sm">
                    {opt.provider.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#062B45]">
                      {opt.provider}
                    </h4>
                    <span className="text-xs text-gray-500">
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
                  className="px-4 py-2 rounded-xl bg-[#087EA4] hover:bg-[#062B45] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Xem tại nguồn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Safety Notice */}
        <div className="bg-[#EAF8FC]/80 p-4 rounded-2xl border border-[#19A7C7]/30 flex items-start gap-3 text-xs text-[#062B45]">
          <ShieldCheck className="w-5 h-5 text-[#087EA4] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold">Cam kết nguồn phát hợp pháp</h5>
            <p className="text-gray-600 leading-relaxed">
              Biển Phim là la bàn chỉ dẫn đường đến các nguồn phát hành bản quyền chính thức. Chúng tôi không lưu trữ, phân phối hay tải lên tệp phim lậu dưới mọi hình thức.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
