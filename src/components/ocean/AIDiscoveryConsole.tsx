import React, { useState } from 'react';
import { Sparkles, ArrowRight, Compass, Search } from 'lucide-react';

interface AIDiscoveryConsoleProps {
  onSearch: (prompt: string) => void;
}

const INSPIRATION_PROMPTS = [
  'Một bộ phim buồn nhưng không quá nặng',
  'Một sci-fi khiến tôi suy nghĩ cả đêm',
  'Phim giống Interstellar nhưng ít nổi tiếng hơn',
  'Series bí ẩn giật gân chỉ 1 mùa ngắn',
  'Phim độc lập châu Âu sâu lắng về ký ức',
];

export const AIDiscoveryConsole: React.FC<AIDiscoveryConsoleProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <section className="py-16 sm:py-20 select-none relative overflow-hidden" aria-label="AI Dẫn Đường">
      {/* Ocean Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Glowing Compass Icon */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mx-auto mb-4 shadow-[0_0_25px_rgba(53,194,200,0.25)]">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>

        {/* Section Headline */}
        <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight">
          Để AI <span className="text-cyan-300 italic">Dẫn Đường.</span>
        </h2>
        <p className="font-sans text-xs sm:text-sm text-gray-300/80 max-w-md mx-auto mt-2 leading-relaxed">
          Đại dương mênh mông, nhưng câu chuyện bạn đang tìm kiếm luôn có một tọa độ chính xác.
        </p>

        {/* Interactive Ocean Search Box */}
        <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto relative text-left">
          <div className="relative flex items-center rounded-2xl bg-[#031322]/90 border border-cyan-500/30 hover:border-cyan-400 focus-within:border-cyan-300 shadow-2xl backdrop-blur-xl transition-all p-2 pl-4">
            <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tôi muốn xem một bộ phim..."
              className="w-full bg-transparent text-white placeholder-gray-400 text-sm sm:text-base outline-none font-sans"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#030A14] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-md ml-2"
            >
              <span>Tìm Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Inspiration Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-wider mr-1">
            Gợi ý:
          </span>
          {INSPIRATION_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSearch(prompt)}
              className="px-3 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-900/40 hover:border-cyan-400/40 text-[11px] text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
