import React, { useEffect, useState } from 'react';
import {
  Compass, Film, Tv, Sparkles, Star, Clock, LogOut, Pencil, Check, X, Loader2, CircleUser, Bookmark, Radar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS, isStaff as isStaffRole, type Role } from '../../shared/roles';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../lib/api';
import { UserPreferences } from '../types';

interface UserProfilePageProps {
  savedCount: number;
  ratedCount: number;
}

const GENRES = ['Sci-Fi', 'Drama', 'Mystery', 'Animation', 'Romance', 'Fantasy', 'Adventure', 'Thriller', 'Horror'];

const MOODS = [
  { id: 'restless', label: 'Kịch tính & Hồi hộp' },
  { id: 'lonely', label: 'Trầm lắng & Độc thoại' },
  { id: 'curious', label: 'Bí ẩn & Trí tuệ' },
  { id: 'romantics', label: 'Lãng mạn & Duyên nợ' },
  { id: 'night-owls', label: 'Phim cho đêm khuya' },
  { id: 'philosophical', label: 'Triết học & Vùng nước sâu' },
];

const CONTENT_TYPES = [
  { id: 'movie', label: 'Phim điện ảnh', icon: <Film className="w-3.5 h-3.5" /> },
  { id: 'series', label: 'Series', icon: <Tv className="w-3.5 h-3.5" /> },
  { id: 'anime', label: 'Anime', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'short', label: 'Phim ngắn', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'ai_film', label: 'AI Films', icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'documentary', label: 'Tài liệu', icon: <Film className="w-3.5 h-3.5" /> },
];

const RUNTIME_OPTIONS = [
  { id: 'all', label: 'Bất kỳ' },
  { id: 'under40', label: '< 40 phút' },
  { id: 'under120', label: '< 2 tiếng' },
  { id: 'over120', label: '> 2 tiếng' },
];

const LANGUAGES = ['Vietnamese', 'English', 'Japanese', 'Korean', 'French', 'Spanish'];

const EMPTY_PREFERENCES: UserPreferences = {
  favoriteGenres: [],
  favoriteMoods: [],
  favoriteLanguages: [],
  preferredRuntime: 'all',
  preferredContentTypes: [],
  preferredProviders: [],
};

function formatMemberSince(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ savedCount, ratedCount }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const isStaff = isStaffRole(user?.role);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>(EMPTY_PREFERENCES);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [providerInput, setProviderInput] = useState('');

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setAvatarUrl(user?.avatarUrl || '');
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    userApi
      .getPreferences()
      .then((prefs) => {
        if (isMounted && prefs) {
          setPreferences({
            favoriteGenres: prefs.favoriteGenres || [],
            favoriteMoods: prefs.favoriteMoods || [],
            favoriteLanguages: prefs.favoriteLanguages || [],
            preferredRuntime: prefs.preferredRuntime || 'all',
            preferredContentTypes: prefs.preferredContentTypes || [],
            preferredProviders: prefs.preferredProviders || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setPreferencesLoaded(true); });
    return () => { isMounted = false; };
  }, []);

  if (!user) return null;

  const toggleListValue = (key: keyof UserPreferences, value: string) => {
    setPreferencesSaved(false);
    setPreferences((prev) => {
      const list = (prev[key] as string[]) || [];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const addProvider = () => {
    const value = providerInput.trim();
    if (!value) return;
    if (!preferences.preferredProviders.includes(value)) {
      setPreferencesSaved(false);
      setPreferences((prev) => ({ ...prev, preferredProviders: [...prev.preferredProviders, value] }));
    }
    setProviderInput('');
  };

  const removeProvider = (value: string) => {
    setPreferencesSaved(false);
    setPreferences((prev) => ({ ...prev, preferredProviders: prev.preferredProviders.filter((p) => p !== value) }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    try {
      await userApi.updateProfile({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      await refreshUser();
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileError(err?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await userApi.updatePreferences(preferences);
      setPreferencesSaved(true);
    } catch {
      // Non-critical — the form still reflects the user's choices locally.
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleLogout = async () => {
    // No explicit redirect needed — once `user` clears, the /profile route
    // guard in App.tsx sends the now-logged-out visitor to /auth.
    await logout();
  };

  return (
    <div className="w-full text-[#E8F4F8] py-10 sm:py-14 text-left">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ─── Profile Header Card ─── */}
        <div className="rounded-3xl p-6 sm:p-8 border border-[#35C2C8]/20 bg-[#071728]/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#087EA4] to-[#35C2C8] p-0.5 shadow-[0_0_20px_rgba(53,194,200,0.4)] shrink-0">
                <div className="w-full h-full bg-[#061424] rounded-[14px] flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <CircleUser className="w-8 h-8 text-[#35C2C8]" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">{user.displayName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#087EA4]/20 text-[#35C2C8] border border-[#35C2C8]/30 text-[10px] font-extrabold uppercase">
                    {isStaff ? ROLE_LABELS[user.role as Role] : 'Thủy thủ đoàn'}
                  </span>
                </div>
                <p className="text-xs text-[#8BA7B8] mt-1">@{user.username} · {user.email}</p>
                <p className="text-xs text-[#8BA7B8] mt-0.5">Thành viên từ {formatMemberSince(user.createdAt)}</p>
              </div>
            </div>

            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B2035]/60 hover:bg-[#0F2A45] border border-[#19A7C7]/20 hover:border-[#35C2C8]/40 text-xs font-semibold text-[#8BA7B8] hover:text-white transition-all cursor-pointer shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>

          {isEditingProfile && (
            <div className="pt-5 border-t border-[#19A7C7]/15 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8BA7B8] mb-1.5 uppercase tracking-wider">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B2035]/60 border border-[#19A7C7]/25 rounded-xl text-sm text-[#E8F4F8] focus:outline-none focus:border-[#35C2C8] focus:ring-2 focus:ring-[#35C2C8]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8BA7B8] mb-1.5 uppercase tracking-wider">
                    URL ảnh đại diện
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-[#0B2035]/60 border border-[#19A7C7]/25 rounded-xl text-sm text-[#E8F4F8] placeholder-[#8BA7B8]/40 focus:outline-none focus:border-[#35C2C8] focus:ring-2 focus:ring-[#35C2C8]/20 transition-all"
                  />
                </div>
              </div>

              {profileError && (
                <p className="text-xs text-red-400">{profileError}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:brightness-110 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileError(null);
                    setDisplayName(user.displayName || '');
                    setAvatarUrl(user.avatarUrl || '');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B2035]/60 hover:bg-[#0F2A45] border border-[#19A7C7]/20 text-xs font-semibold text-[#8BA7B8] hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 bg-[#0B2035]/50 p-3 rounded-2xl border border-[#19A7C7]/20 backdrop-blur-sm w-fit">
            <div className="text-center px-2">
              <span className="text-xl font-bold text-white block">{savedCount}</span>
              <span className="text-[11px] text-[#8BA7B8] font-medium">Đã lưu</span>
            </div>
            <div className="w-px h-8 bg-[#19A7C7]/20" />
            <div className="text-center px-2">
              <span className="text-xl font-bold text-[#35C2C8] block">{ratedCount}</span>
              <span className="text-[11px] text-[#8BA7B8] font-medium">Đã đánh giá</span>
            </div>
          </div>
        </div>

        {/* ─── Preferences ─── */}
        <div className="rounded-3xl border border-[#35C2C8]/20 bg-[#071728]/70 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#19A7C7]/15 flex items-center justify-between bg-[#061424]/40">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Compass className="w-4 h-4 text-[#35C2C8]" />
              Sở thích & Gu điện ảnh
            </div>
            {preferencesSaved && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đã lưu
              </span>
            )}
          </div>

          {!preferencesLoaded ? (
            <div className="p-8 flex items-center justify-center text-[#8BA7B8] text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải sở thích...
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Genres */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#35C2C8]/80 mb-3">Thể loại yêu thích</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleListValue('favoriteGenres', g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        preferences.favoriteGenres.includes(g)
                          ? 'bg-gradient-to-r from-[#087EA4]/40 to-[#19A7C7]/30 text-[#35C2C8] border border-[#35C2C8]/50 shadow-[0_0_10px_rgba(53,194,200,0.2)] font-semibold'
                          : 'bg-[#0B2035]/40 text-[#8BA7B8] hover:bg-[#0F2A45] hover:text-white border border-[#19A7C7]/15 hover:border-[#35C2C8]/30'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Moods */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#35C2C8]/80 mb-3">Tâm trạng thường tìm</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleListValue('favoriteMoods', m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        preferences.favoriteMoods.includes(m.id)
                          ? 'bg-[#35C2C8] text-[#061424] font-bold shadow-[0_0_10px_rgba(53,194,200,0.4)]'
                          : 'bg-[#0B2035]/40 text-[#8BA7B8] hover:bg-[#0F2A45] hover:text-white border border-[#19A7C7]/15 hover:border-[#35C2C8]/30'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content types */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#35C2C8]/80 mb-3">Định dạng ưa thích</p>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleListValue('preferredContentTypes', t.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        preferences.preferredContentTypes.includes(t.id)
                          ? 'bg-gradient-to-r from-[#087EA4] to-[#35C2C8] text-white shadow-[0_0_12px_rgba(53,194,200,0.3)]'
                          : 'bg-[#0B2035]/50 text-[#8BA7B8] hover:bg-[#0F2A45] hover:text-white border border-[#19A7C7]/20 hover:border-[#35C2C8]/40'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Runtime */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#35C2C8]/80 mb-3">Thời lượng ưa thích</p>
                  <div className="flex flex-wrap gap-1.5">
                    {RUNTIME_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setPreferencesSaved(false); setPreferences((prev) => ({ ...prev, preferredRuntime: r.id })); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          preferences.preferredRuntime === r.id
                            ? 'bg-gradient-to-r from-[#087EA4] to-[#35C2C8] text-white font-bold shadow-[0_0_10px_rgba(53,194,200,0.3)]'
                            : 'bg-[#0B2035]/60 text-[#8BA7B8] hover:text-white hover:bg-[#0F2A45] border border-[#19A7C7]/20 hover:border-[#35C2C8]/40'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#35C2C8]/80 mb-3">Ngôn ngữ ưa thích</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleListValue('favoriteLanguages', lang)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          preferences.favoriteLanguages.includes(lang)
                            ? 'bg-gradient-to-r from-[#087EA4] to-[#35C2C8] text-white font-bold shadow-[0_0_10px_rgba(53,194,200,0.3)]'
                            : 'bg-[#0B2035]/60 text-[#8BA7B8] hover:text-white hover:bg-[#0F2A45] border border-[#19A7C7]/20 hover:border-[#35C2C8]/40'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Providers */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#35C2C8]/80 mb-3">Dịch vụ xem phim đã kết nối</p>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {preferences.preferredProviders.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2035]/60 border border-[#19A7C7]/20 text-xs font-semibold text-cyan-100"
                    >
                      {p}
                      <button onClick={() => removeProvider(p)} className="text-[#8BA7B8] hover:text-white cursor-pointer" aria-label={`Xóa ${p}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="text"
                    value={providerInput}
                    onChange={(e) => setProviderInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProvider(); } }}
                    placeholder="VD: Netflix"
                    className="flex-1 px-3 py-1.5 bg-[#0B2035]/60 border border-[#19A7C7]/25 rounded-lg text-xs text-[#E8F4F8] placeholder-[#8BA7B8]/40 focus:outline-none focus:border-[#35C2C8]"
                  />
                  <button
                    onClick={addProvider}
                    className="px-3 py-1.5 rounded-lg bg-[#0B2035]/60 hover:bg-[#0F2A45] border border-[#19A7C7]/20 text-xs font-semibold text-[#8BA7B8] hover:text-white transition-all cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#19A7C7]/15">
                <button
                  onClick={handleSavePreferences}
                  disabled={savingPreferences}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] hover:brightness-110 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(53,194,200,0.25)]"
                >
                  {savingPreferences ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
                  Lưu sở thích
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Account actions ─── */}
        <div className="flex justify-end gap-2">
          {isStaff && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/25 hover:border-cyan-500/40 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer"
            >
              <Radar className="w-3.5 h-3.5" />
              Thu thập phim
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/25 hover:border-red-500/40 text-xs font-semibold text-red-300 hover:text-red-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};
