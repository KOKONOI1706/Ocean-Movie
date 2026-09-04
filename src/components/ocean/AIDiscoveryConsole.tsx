import React, { useState, useEffect, useRef } from 'react';
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
  'Anime về triết học và sự cô đơn',
  'Phim kịch tính chậm mà không nhàm',
];

// Typewriter cycling through prompts
function useTypewriter(prompts: string[], speed = 55, pause = 2200) {
  const [display, setDisplay] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = prompts[promptIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, speed);
    } else if (!isDeleting && charIdx > current.length) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx((c) => c - 1);
      }, speed * 0.55);
    } else {
      setIsDeleting(false);
      setPromptIdx((i) => (i + 1) % prompts.length);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, promptIdx, prompts, speed, pause]);

  return display;
}

export const AIDiscoveryConsole: React.FC<AIDiscoveryConsoleProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterText = useTypewriter(INSPIRATION_PROMPTS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) onSearch(q);
  };

  const handleQuickPrompt = (prompt: string) => {
    onSearch(prompt);
  };

  return (
    <section
      className="py-20 sm:py-28 select-none relative overflow-hidden"
      aria-label="AI Dẫn Đường — Khám phá thông minh"
    >
      {/* Ocean ambient glow behind section */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(8,126,164,0.09) 0%, transparent 65%)' }}
        />
        {/* Subtle light ray effect behind the console */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-full"
          style={{
            background: 'linear-gradient(180deg, rgba(53,194,200,0.06) 0%, rgba(8,126,164,0.04) 40%, transparent 75%)',
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

        {/* Glowing compass icon */}
        <div
          className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/35 flex items-center justify-center text-cyan-300 mx-auto mb-6"
          style={{ boxShadow: '0 0 30px rgba(53,194,200,0.2), 0 0 60px rgba(8,126,164,0.1)' }}
          aria-hidden="true"
        >
          <Compass className="w-7 h-7" />
        </div>

        {/* Eyebrow */}
        <div className="font-mono text-[10px] tracking-[0.18em] text-cyan-400/60 uppercase mb-3">
          AI · Hoa Tiêu Đại Dương Điện Ảnh
        </div>

        {/* Headline */}
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white font-normal tracking-tight leading-[1.1]">
          Để AI{' '}
          <span
            className="text-cyan-300 italic"
            style={{ textShadow: '0 0 25px rgba(53,194,200,0.3)' }}
          >
            Dẫn Đường.
          </span>
        </h2>

        <p className="font-sans text-sm text-gray-400/80 max-w-sm mx-auto mt-3 leading-relaxed">
          Đại dương mênh mông, nhưng câu chuyện bạn đang tìm kiếm luôn có một tọa độ chính xác.
        </p>

        {/* Interactive search field */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 max-w-2xl mx-auto relative text-left"
          role="search"
          aria-label="Tìm kiếm phim bằng AI"
        >
          <div
            className={`relative flex items-center rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 p-2 pl-5 ${
              isFocused
                ? 'border-cyan-300/60 bg-[#031322]/95 shadow-[0_0_40px_rgba(53,194,200,0.12)]'
                : 'border-cyan-500/25 bg-[#031322]/85 hover:border-cyan-500/40'
            }`}
          >
            <Search className="w-5 h-5 text-cyan-400/70 shrink-0 mr-3" aria-hidden="true" />

            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-transparent text-white text-sm sm:text-base outline-none font-sans placeholder-transparent"
                aria-label="Nhập mô tả bộ phim bạn muốn xem"
                autoComplete="off"
                spellCheck="false"
              />

              {/* Typewriter placeholder — only shown when input is empty and not focused */}
              {!query && !isFocused && (
                <div
                  className="absolute inset-0 flex items-center pointer-events-none text-gray-500 font-sans text-sm sm:text-base overflow-hidden whitespace-nowrap"
                  aria-hidden="true"
                >
                  {typewriterText}
                  <span className="animate-cursor-blink text-cyan-400/60 ml-0.5 font-light">|</span>
                </div>
              )}

              {/* Static placeholder when focused and empty */}
              {!query && isFocused && (
                <div className="absolute inset-0 flex items-center pointer-events-none text-gray-600 font-sans text-sm sm:text-base" aria-hidden="true">
                  Tôi muốn xem một bộ phim...
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#030A14] font-bold text-xs uppercase tracking-[0.1em] flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-md ml-2 hover:shadow-[0_4px_20px_rgba(53,194,200,0.4)]"
              aria-label="Tìm kiếm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tìm Ngay</span>
              <ArrowRight className="w-3.5 h-3.5 sm:hidden" />
            </button>
          </div>
        </form>

        {/* Quick inspiration pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          <span className="text-[10px] font-mono text-cyan-400/50 uppercase tracking-wider shrink-0 mr-1" aria-hidden="true">
            Gợi ý:
          </span>
          {INSPIRATION_PROMPTS.slice(0, 5).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/35 hover:bg-cyan-900/50 border border-cyan-900/35 hover:border-cyan-500/40 text-[11px] text-gray-400 hover:text-white transition-all duration-200 cursor-pointer font-sans"
              aria-label={`Tìm: ${prompt}`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
