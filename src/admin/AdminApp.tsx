import React, { useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Film,
  LayoutDashboard,
  Library,
  Loader2,
  LogOut,
  Menu,
  Radar,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../lib/api';
import { Button, buttonClass, inputClass, labelClass } from './ui';
import { OverviewPage } from './pages/OverviewPage';
import { CrawlPage } from './pages/CrawlPage';
import { LibraryPage } from './pages/LibraryPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { ROLE_LABELS, hasRole, isStaff, type Role } from '../../shared/roles';

// Hiding items is only convenience: the API checks the role from the database on every request.
const NAV: Array<{ to: string; end: boolean; label: string; icon: typeof Film; minRole: Role }> = [
  { to: '/admin', end: true, label: 'Tổng quan', icon: LayoutDashboard, minRole: 'CURATOR' },
  { to: '/admin/crawl', end: false, label: 'Thu thập phim', icon: Radar, minRole: 'CURATOR' },
  { to: '/admin/library', end: false, label: 'Kho nội dung', icon: Library, minRole: 'CURATOR' },
  { to: '/admin/users', end: false, label: 'Người dùng', icon: Users, minRole: 'ADMIN' },
  { to: '/admin/audit', end: false, label: 'Nhật ký', icon: ScrollText, minRole: 'ADMIN' },
];

/**
 * Staff console, mounted at /admin/*. It renders outside the consumer site's
 * chrome (ocean background, header, footer, bottom nav) on purpose.
 */
export function AdminApp() {
  const { user } = useAuth();
  if (!user) return <AdminSignIn />;
  if (!isStaff(user.role)) return <NoAccess />;
  return <AdminShell />;
}

function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sidebar = (
    <nav className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
          <Film className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Biển Phim</div>
          <div className="text-[11px] text-slate-400">Bảng quản trị</div>
        </div>
      </div>

      <div className="flex-1 space-y-1 px-3 py-4">
        {NAV.filter((item) => hasRole(user!.role, item.minRole)).map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-white/10 p-3 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Mở trang xem phim
        </a>
        <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">{user!.displayName || user!.username}</div>
            <div className="text-[11px] text-teal-300">{ROLE_LABELS[user!.role as Role] ?? user!.role}</div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate('/admin');
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased" style={{ colorScheme: 'light' }}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Mở menu quản trị"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold">Biển Phim · Quản trị</span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="crawl" element={<CrawlPage />} />
            <Route path="library" element={<LibraryPage />} />
            {hasRole(user!.role, 'ADMIN') && (
              <>
                <Route
                  path="users"
                  element={<UsersPage canManageRoles={hasRole(user!.role, 'SUPER_ADMIN')} currentUserId={user!.id} />}
                />
                <Route path="audit" element={<AuditPage />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4" style={{ colorScheme: 'light' }}>
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
        {children}
      </div>
    </div>
  );
}

function AdminSignIn() {
  const { refreshUser } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Not AuthContext.login(): it toggles the provider's `loading`, which
      // unmounts the app mid-attempt and would drop this form's error state.
      const data = await userApi.login(identifier.trim(), password);
      if (!data?.accessToken) throw new Error('invalid credentials');
      await refreshUser();
    } catch {
      setError('Sai tên đăng nhập hoặc mật khẩu.');
      setSubmitting(false);
    }
  };

  return (
    <CenteredPanel>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold">Đăng nhập quản trị</h1>
          <p className="text-xs text-slate-500">Dành cho biên tập viên và quản trị viên</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="admin-identifier" className={labelClass}>Email hoặc tên đăng nhập</label>
          <input
            id="admin-identifier"
            className={inputClass}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label htmlFor="admin-password" className={labelClass}>Mật khẩu</label>
          <input
            id="admin-password"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" loading={submitting}>
          Đăng nhập
        </Button>
      </form>
      <a href="/" className="mt-5 block text-center text-xs text-slate-500 hover:text-slate-700">
        ← Về trang xem phim
      </a>
    </CenteredPanel>
  );
}

function NoAccess() {
  const { user, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  return (
    <CenteredPanel>
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 rounded-full bg-amber-50 p-3 text-amber-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-base font-semibold">Không có quyền truy cập</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tài khoản <b>{user?.username}</b> ({user?.role}) không phải quản trị viên.
        </p>
        <div className="mt-5 flex w-full gap-2">
          <a href="/" className={buttonClass('secondary', 'flex-1')}>
            Về trang chủ
          </a>
          <Button
            variant="primary"
            className="flex-1"
            icon={leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            onClick={async () => {
              setLeaving(true);
              await logout();
            }}
          >
            Đổi tài khoản
          </Button>
        </div>
      </div>
    </CenteredPanel>
  );
}
