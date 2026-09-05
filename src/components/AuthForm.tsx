import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthFormProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
  onSwitchMode?: (mode: 'login' | 'register') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  initialMode = 'login',
  onSuccess,
  onSwitchMode,
}) => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSwitchTab = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    onSwitchMode?.(newMode);
  };

  const handleQuickDemo = () => {
    if (mode === 'login') {
      setEmail('demo@bienphim.vn');
      setPassword('demo123456');
    } else {
      setEmail('explorer@bienphim.vn');
      setUsername('deep_explorer');
      setDisplayName('Hải Trình Explorer');
      setPassword('demo123456');
      setConfirmPassword('demo123456');
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không trùng khớp!');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự!');
        return;
      }
      if (!username.trim() || !displayName.trim()) {
        setError('Vui lòng điền đầy đủ tên đăng nhập và tên hiển thị!');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onSuccess?.();
        }, 600);
      } else {
        await register({
          email,
          username: username.trim(),
          password,
          displayName: displayName.trim(),
        });
        setSuccess('Đăng ký tài khoản thành công! Chào mừng đến với Biển Phim.');
        setTimeout(() => {
          onSuccess?.();
        }, 800);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        (mode === 'login'
          ? 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.'
          : 'Đăng ký không thành công. Vui lòng thử lại sau.');
      setError(msg);
    }
  };

  return (
    <div className="w-full">
      {/* Mode Switcher Tabs */}
      <div className="relative p-1 bg-[#04101E]/90 rounded-2xl border border-cyan-500/20 backdrop-blur-md mb-6 flex">
        <button
          type="button"
          onClick={() => handleSwitchTab('login')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'login'
              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 shadow-lg border border-cyan-400/40 shadow-cyan-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Đăng Nhập</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab('register')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'register'
              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 shadow-lg border border-cyan-400/40 shadow-cyan-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Đăng Ký Mới</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-200 text-xs sm:text-sm animate-fade-in shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-start gap-3 text-emerald-200 text-xs sm:text-sm animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-fade-in">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Tên hiển thị
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-cyan-400/80" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Thuyền Trưởng Hải"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#061628]/80 border border-cyan-500/20 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Sparkles className="w-4 h-4 text-cyan-400/80" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="captain_hai"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#061628]/80 border border-cyan-500/20 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            {mode === 'login' ? 'Email hoặc Tên đăng nhập' : 'Địa chỉ Email'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4 text-cyan-400/80" />
            </div>
            <input
              type={mode === 'login' ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'demo@bienphim.vn hoặc captain_hai' : 'thuyentruong@bienphim.vn'}
              required
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#061628]/80 border border-cyan-500/20 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Mật khẩu
            </label>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => alert('Vui lòng liên hệ quản trị viên hoặc sử dụng tài khoản Demo để trải nghiệm.')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Quên mật khẩu?
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4 text-cyan-400/80" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-10 pr-10 py-2.5 bg-[#061628]/80 border border-cyan-500/20 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password (Register mode) */}
        {mode === 'register' && (
          <div className="animate-fade-in">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400/80" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-2.5 bg-[#061628]/80 border border-cyan-500/20 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Quick Demo Fill Helper */}
        <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Điền nhanh tài khoản thử</span>
          </button>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Bảo mật đa tầng AES-256</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-cyan-950/60 border border-cyan-400/40 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{mode === 'login' ? 'Đăng Nhập Khám Phá' : 'Tạo Tài Khoản Hải Trình'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Switch mode footer */}
      <div className="mt-6 pt-5 border-t border-cyan-900/20 text-center text-xs text-slate-400">
        {mode === 'login' ? (
          <p>
            Chưa có tài khoản Biển Phim?{' '}
            <button
              type="button"
              onClick={() => handleSwitchTab('register')}
              className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition-colors ml-1"
            >
              Đăng ký ngay
            </button>
          </p>
        ) : (
          <p>
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => handleSwitchTab('login')}
              className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition-colors ml-1"
            >
              Đăng nhập tại đây
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
