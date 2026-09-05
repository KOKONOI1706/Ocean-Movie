import React, { useState } from 'react';
import { AuthForm } from './AuthForm';
import { Waves, Sparkles, Compass, ArrowLeft, Film, BookmarkCheck, Shield, ChevronRight } from 'lucide-react';

interface LoginPageProps {
  onBack?: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBack,
  onSuccess,
  initialMode = 'login',
}) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(initialMode);

  return (
    <div className="relative min-h-screen bg-[#020710] text-[#E8F4F8] flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Decorative Ambient Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-32 left-10 w-[700px] h-[600px] bg-teal-500/8 rounded-full blur-[150px]" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Back to Discover Button */}
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#051426]/70 hover:bg-[#071D38] border border-cyan-500/20 hover:border-cyan-400/50 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all cursor-pointer group shadow-lg shadow-black/40 backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span>Về Trang Chủ</span>
          </button>
        ) : (
          <div />
        )}

        {/* Brand Link */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/50">
            <Waves className="w-5 h-5" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-wider text-white uppercase font-sans">
            BIỂN PHIM
          </span>
        </div>

        {/* Security badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-cyan-400/80 bg-cyan-950/30 border border-cyan-500/20 px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          <span>Bảo mật chuẩn rạp phim</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Feature / Manifesto Column (Visible on Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-400/30 text-cyan-300 text-xs font-semibold w-fit shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>HẢI TRÌNH ĐIỆN ẢNH ĐẠI DƯƠNG</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
                Khám phá kiệt tác điện ảnh ở{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-400 bg-clip-text text-transparent">
                  độ sâu 11,000 mét
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Tài khoản Biển Phim mở khóa toàn bộ hành trình phân tích dữ liệu tâm trạng, bộ lọc chiều sâu đại dương và trợ lý AI gợi ý phim chuẩn xác theo cảm xúc của bạn.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-2xl bg-[#041222]/70 border border-cyan-500/15 backdrop-blur-md flex items-start gap-3.5 hover:border-cyan-400/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">Bản Đồ Phim Phân Tầng</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Từ phim tươi sáng vùng Sunlight Zone (0-200m) đến những câu chuyện bí ẩn vùng Hadal Zone (6000m+).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#041222]/70 border border-cyan-500/15 backdrop-blur-md flex items-start gap-3.5 hover:border-cyan-400/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">Kho Lưu Trữ & Bộ Sưu Tập Cá Nhân</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tự động đồng bộ hóa danh sách phim đã xem, đánh giá chi tiết và playlist yêu thích theo thời gian thực.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#041222]/70 border border-cyan-500/15 backdrop-blur-md flex items-start gap-3.5 hover:border-cyan-400/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">Tra Cứu Nơi Xem Nhanh Chóng</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tổng hợp nguồn phát trực tuyến chính thức, độ phân giải 4K, phụ đề tiếng Việt chuẩn xác nhất.
                  </p>
                </div>
              </div>
            </div>

            {/* Depth Indicator quote */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-500/20 backdrop-blur-sm flex items-center gap-3">
              <div className="w-2 h-10 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600" />
              <p className="text-xs italic text-slate-300">
                “Điện ảnh như đại dương bao la — càng lặn sâu, ta càng khám phá những cảm xúc nguyên bản và kỳ vĩ nhất.”
              </p>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="col-span-1 lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-md bg-[#041122]/90 border border-cyan-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80 relative overflow-hidden">
              {/* Card top ambient light */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />
              
              {/* Mobile Header (Brand info for mobile only) */}
              <div className="lg:hidden text-center mb-6 space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-400/30 text-cyan-400 mb-2 shadow-lg shadow-cyan-950/50">
                  <Waves className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Biển Phim Account</h2>
                <p className="text-xs text-slate-400">Đăng nhập để tiếp tục hành trình điện ảnh của bạn</p>
              </div>

              {/* Desktop Form Header */}
              <div className="hidden lg:block mb-6">
                <h3 className="text-xl font-bold text-white mb-1">
                  {currentMode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentMode === 'login'
                    ? 'Nhập thông tin tài khoản để truy cập kho phim'
                    : 'Gia nhập cộng đồng người yêu điện ảnh và khám phá'}
                </p>
              </div>

              {/* Embedded Auth Form */}
              <AuthForm
                initialMode={initialMode}
                onSuccess={onSuccess}
                onSwitchMode={(mode) => setCurrentMode(mode)}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 border-t border-cyan-950/40">
        <p>© 2026 Biển Phim • Nền tảng khám phá điện ảnh đa chiều sâu. Thiết kế với trải nghiệm chuẩn rạp.</p>
      </footer>
    </div>
  );
};
