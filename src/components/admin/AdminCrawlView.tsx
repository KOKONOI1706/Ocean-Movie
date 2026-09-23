import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Film,
  Globe,
  Loader2,
  LogOut,
  Radar,
  Search,
  ShieldCheck,
  Tv,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  aggregatorApi,
  userApi,
  IngestMode,
  IngestReport,
  MovieType,
  ParseResult,
  RawItemInput,
} from '../../lib/api';

interface AdminCrawlViewProps {
  onOpenMedia: (kind: 'movie' | 'series', slug: string) => void;
}

const STAFF_ROLES = ['ADMIN', 'CURATOR'];

const MODE_OPTIONS: Array<{ id: IngestMode; label: string; hint: string; icon: React.ReactNode }> = [
  { id: 'auto', label: 'Tự động', hint: 'Có số tập → Series, không có → Phim', icon: <Radar className="w-4 h-4" /> },
  { id: 'movie', label: 'Phim lẻ', hint: 'Mỗi liên kết là một bộ phim', icon: <Film className="w-4 h-4" /> },
  { id: 'series', label: 'Series', hint: 'Gom các tập thành series', icon: <Tv className="w-4 h-4" /> },
];

const MOVIE_TYPE_OPTIONS: Array<{ id: MovieType; label: string }> = [
  { id: 'AI_FILM', label: 'Phim AI' },
  { id: 'MOVIE', label: 'Phim điện ảnh' },
  { id: 'SHORT', label: 'Phim ngắn' },
  { id: 'DOCUMENTARY', label: 'Tài liệu' },
  { id: 'ANIME', label: 'Anime' },
];

type Method = 'paste' | 'scrape' | 'search';

const METHOD_OPTIONS: Array<{ id: Method; label: string; icon: React.ReactNode }> = [
  { id: 'paste', label: 'Dán liên kết phát', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'scrape', label: 'Cào trang web', icon: <Globe className="w-4 h-4" /> },
  { id: 'search', label: 'Tìm trên nguồn', icon: <Search className="w-4 h-4" /> },
];

const PASTE_PLACEHOLDER = `Mỗi dòng: Tên | URL phát (.m3u8, .mp4 hoặc trang nhúng)

The Last Signal (2025) [AI Film] | https://cdn.example.com/last-signal/index.m3u8
Neon Tide - 2024 | https://player.example.com/embed/neon-tide
Crouching Tiger, Hidden Dragon - Ep 1 | https://cdn.example.com/cthd/1.m3u8`;

/** "Title | URL", "Title<TAB>URL", or a JSON array of { title, streamUrl }. */
export function parsePastedItems(text: string): { items: RawItemInput[]; errors: string[] } {
  const trimmed = text.trim();
  if (!trimmed) return { items: [], errors: [] };

  if (trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      if (!Array.isArray(data)) throw new Error();
      const items = data.filter((d) => d && typeof d.title === 'string' && typeof d.streamUrl === 'string');
      return { items, errors: items.length === data.length ? [] : ['Một số phần tử JSON thiếu title/streamUrl'] };
    } catch {
      return { items: [], errors: ['JSON không hợp lệ'] };
    }
  }

  const items: RawItemInput[] = [];
  const errors: string[] = [];
  trimmed.split(/\r?\n/).forEach((line, i) => {
    const raw = line.trim();
    if (!raw) return;
    const match = raw.match(/^(.*?)\s*(?:\||\t)\s*(https?:\/\/\S+)\s*$/i);
    if (!match || !match[1]) {
      errors.push(`Dòng ${i + 1}: cần dạng "Tên | URL"`);
      return;
    }
    items.push({ title: match[1], streamUrl: match[2] });
  });
  return { items, errors };
}

const panel = 'rounded-2xl border border-cyan-900/40 bg-[#061527]/80 backdrop-blur-md';
const input =
  'w-full rounded-xl bg-[#030A14]/80 border border-cyan-900/50 focus:border-cyan-400 focus:outline-none px-3 py-2.5 text-sm text-white placeholder:text-gray-500';

export const AdminCrawlView: React.FC<AdminCrawlViewProps> = ({ onOpenMedia }) => {
  // Shared session: signing in here also updates the header and profile page.
  const { user, logout, refreshUser } = useAuth();

  // Login form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Crawl form
  const [method, setMethod] = useState<Method>('paste');
  const [mode, setMode] = useState<IngestMode>('auto');
  const [movieType, setMovieType] = useState<MovieType>('AI_FILM');
  const [sourceName, setSourceName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [urlText, setUrlText] = useState('');
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');
  const [report, setReport] = useState<IngestReport | null>(null);
  const [preview, setPreview] = useState<ParseResult[] | null>(null);

  const isStaff = Boolean(user && STAFF_ROLES.includes(user.role));

  useEffect(() => {
    if (!isStaff) return;
    aggregatorApi.sources().then(setSources).catch(() => setSources([]));
  }, [isStaff]);

  const pasted = useMemo(() => parsePastedItems(pasteText), [pasteText]);
  const urls = useMemo(
    () => urlText.split(/\s+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u)),
    [urlText]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      // Not AuthContext.login(): it toggles the provider's `loading`, which
      // unmounts the app mid-attempt and would drop this form's error state.
      const data = await userApi.login(identifier.trim(), password);
      if (!data?.accessToken) throw new Error('invalid credentials');
      await refreshUser();
      setPassword('');
    } catch {
      setLoginError('Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setReport(null);
    setPreview(null);
  };

  const options = { mode, movieType, sourceName: sourceName.trim() || undefined };

  const run = async (task: () => Promise<IngestReport>) => {
    setRunning(true);
    setRunError('');
    setReport(null);
    try {
      setReport(await task());
    } catch (err) {
      setRunError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const handlePreview = async () => {
    setRunError('');
    try {
      setPreview(await aggregatorApi.parse(pasted.items.map((i) => i.title)));
    } catch (err) {
      setRunError((err as Error).message);
    }
  };

  const canRun =
    !running &&
    ((method === 'paste' && pasted.items.length > 0) ||
      (method === 'scrape' && urls.length > 0) ||
      (method === 'search' && query.trim().length > 0 && sources.length > 0));

  const handleRun = () => {
    if (method === 'paste') run(() => aggregatorApi.ingest(pasted.items, options));
    if (method === 'scrape') run(() => aggregatorApi.scrape(urls, options));
    if (method === 'search') run(() => aggregatorApi.search(query.trim(), selectedSources, options));
  };

  // ─── Login gate ────────────────────────────────────────────────────────────
  if (!isStaff) {
    return (
      <div className="max-w-md mx-auto px-4 pt-32 pb-20">
        <form onSubmit={handleLogin} className={`${panel} p-6 space-y-4 text-white`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold">Đăng nhập quản trị</h1>
          </div>
          <p className="text-xs text-gray-400">
            Trang thu thập phim chỉ dành cho tài khoản có vai trò <b>ADMIN</b> hoặc <b>CURATOR</b>.
          </p>
          {user && (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              Đang đăng nhập là <b>{user.username}</b> ({user.role}) — không đủ quyền.{' '}
              <button type="button" onClick={handleLogout} className="underline cursor-pointer">
                Đăng xuất
              </button>
            </div>
          )}
          <label className="block space-y-1">
            <span className="text-xs text-gray-300">Email hoặc tên đăng nhập</span>
            <input
              className={input}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-gray-300">Mật khẩu</span>
            <input
              className={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {loginError && <p className="text-xs text-red-300">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loggingIn && <Loader2 className="w-4 h-4 animate-spin" />} Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  // ─── Crawl console ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 text-white space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyan-400">Quản trị · Aggregator</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Thu thập phim</h1>
          <p className="text-sm text-gray-400 mt-1">
            Cào liên kết phát từ nguồn bên ngoài, chuẩn hoá tên và lưu vào kho phim / series.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span>
            {user!.displayName || user!.username} · <b className="text-cyan-300">{user!.role}</b>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng xuất
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left: input */}
        <div className={`${panel} p-5 space-y-5`}>
          <div className="flex flex-wrap gap-2" role="tablist">
            {METHOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={method === m.id}
                onClick={() => setMethod(m.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  method === m.id ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/60' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {method === 'paste' && (
            <div className="space-y-2">
              <textarea
                className={`${input} font-mono text-xs min-h-[220px]`}
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setPreview(null);
                }}
                placeholder={PASTE_PLACEHOLDER}
                spellCheck={false}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-gray-400">
                  {pasted.items.length} liên kết hợp lệ
                  {pasted.errors.length > 0 && <span className="text-amber-300"> · {pasted.errors[0]}</span>}
                </span>
                <button
                  onClick={handlePreview}
                  disabled={pasted.items.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Xem trước cách nhận diện
                </button>
              </div>
            </div>
          )}

          {method === 'scrape' && (
            <div className="space-y-2">
              <textarea
                className={`${input} font-mono text-xs min-h-[180px]`}
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                placeholder={'Mỗi dòng một trang phim/tập, ví dụ:\nhttps://site.example.com/phim/the-last-signal\nhttps://site.example.com/xem/crouching-tiger-tap-1'}
                spellCheck={false}
              />
              <p className="text-xs text-gray-400">
                {urls.length} trang · Hệ thống tìm luồng .m3u8, thẻ &lt;video&gt;, iframe nhúng và tiêu đề (og:title) trên mỗi trang.
              </p>
            </div>
          )}

          {method === 'search' && (
            <div className="space-y-3">
              {sources.length === 0 ? (
                <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 leading-relaxed">
                  Chưa cấu hình nguồn tìm kiếm. Thêm biến môi trường <code className="text-cyan-300">AGGREGATOR_SOURCES</code>{' '}
                  trên máy chủ (xem <code>.env.example</code>), hoặc dùng “Dán liên kết phát” / “Cào trang web”.
                </div>
              ) : (
                <>
                  <input
                    className={input}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Từ khoá, ví dụ: phim AI, ngọa hổ tàng long…"
                  />
                  <div className="flex flex-wrap gap-2">
                    {sources.map((s) => {
                      const on = selectedSources.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => setSelectedSources((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))}
                          className={`px-3 py-1 rounded-full text-xs cursor-pointer ${
                            on ? 'bg-cyan-500/30 text-cyan-100' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500">Không chọn nguồn nào = tìm trên tất cả nguồn.</p>
                </>
              )}
            </div>
          )}

          {preview && method === 'paste' && (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="text-left p-2 font-medium">Tên gốc</th>
                    <th className="text-left p-2 font-medium">Nhận diện</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, i) => {
                    const asMovie = mode === 'movie' || (mode === 'auto' && p.kind === 'movie');
                    const unusable = !p.parsed || (mode === 'series' && p.kind === 'movie');
                    return (
                      <tr key={i} className="border-t border-white/5">
                        <td className="p-2 text-gray-300 break-all">{p.title}</td>
                        <td className="p-2">
                          {unusable ? (
                            <span className="text-amber-300">Sẽ bị bỏ qua</span>
                          ) : asMovie ? (
                            <span>
                              <Film className="inline w-3 h-3 text-cyan-400 mr-1" />
                              {p.kind === 'episode' ? p.title : p.parsed!.title}
                              {p.parsed!.year && <span className="text-gray-400"> ({p.parsed!.year})</span>}
                            </span>
                          ) : (
                            <span>
                              <Tv className="inline w-3 h-3 text-cyan-400 mr-1" />
                              {p.parsed!.baseTitle} · S{String(p.parsed!.seasonNumber).padStart(2, '0')}E
                              {String(p.parsed!.episodeNumber).padStart(2, '0')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: options + run */}
        <div className="space-y-4">
          <div className={`${panel} p-5 space-y-4`}>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-300">Lưu thành</div>
              {MODE_OPTIONS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer border transition-colors ${
                    mode === m.id ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    className="mt-1 accent-cyan-400"
                    checked={mode === m.id}
                    onChange={() => {
                      setMode(m.id);
                    }}
                  />
                  <span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      {m.icon} {m.label}
                    </span>
                    <span className="text-[11px] text-gray-400">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            {mode !== 'series' && (
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-gray-300">Loại phim</span>
                <select className={input} value={movieType} onChange={(e) => setMovieType(e.target.value as MovieType)}>
                  {MOVIE_TYPE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-300">Tên nguồn (tuỳ chọn)</span>
              <input
                className={input}
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="vd. partner-feed"
              />
            </label>

            <button
              onClick={handleRun}
              disabled={!canRun}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#087EA4] to-[#19A7C7] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              {running ? 'Đang thu thập…' : 'Bắt đầu thu thập'}
            </button>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed px-1">
            Chỉ thu thập từ nguồn bạn có quyền phân phối. Chạy lại nhiều lần an toàn: bản ghi được cập nhật, không nhân đôi.
          </p>
        </div>
      </div>

      {/* Results */}
      {runError && (
        <div className="flex items-start gap-2 text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {runError}
        </div>
      )}

      {report && (
        <div className={`${panel} p-5 space-y-5`}>
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-5 h-5" /> Hoàn tất
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              ['Phim', report.movies.length],
              ['Series', report.series.length],
              ['Tập mới / cập nhật', `${report.episodesCreated} / ${report.episodesUpdated}`],
              ['Bỏ qua', report.skipped.length],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-white/5 p-3">
                <div className="text-xl font-extrabold">{value}</div>
                <div className="text-[11px] text-gray-400">{label}</div>
              </div>
            ))}
          </div>

          {(report.movies.length > 0 || report.series.length > 0) && (
            <ul className="divide-y divide-white/5">
              {report.movies.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => onOpenMedia('movie', m.slug)}
                    className="w-full py-2 px-2 -mx-2 rounded-lg hover:bg-white/5 flex items-center gap-3 text-sm text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{m.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">{m.type}</span>
                      <span className={`text-[10px] ${m.created ? 'text-emerald-300' : 'text-gray-400'}`}>
                        {m.created ? 'mới' : 'cập nhật'}
                      </span>
                    </span>
                    <span className="ml-auto text-xs text-cyan-300 shrink-0">Mở →</span>
                  </button>
                </li>
              ))}
              {report.series.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onOpenMedia('series', s.slug)}
                    className="w-full py-2 px-2 -mx-2 rounded-lg hover:bg-white/5 flex items-center gap-3 text-sm text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Tv className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{s.title}</span>
                      <span className="text-[10px] text-gray-400">{s.episodes} tập</span>
                      <span className={`text-[10px] ${s.created ? 'text-emerald-300' : 'text-gray-400'}`}>
                        {s.created ? 'mới' : 'cập nhật'}
                      </span>
                    </span>
                    <span className="ml-auto text-xs text-cyan-300 shrink-0">Mở →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {report.skipped.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-400">{report.skipped.length} mục bị bỏ qua</summary>
              <ul className="mt-2 space-y-1">
                {report.skipped.map((s, i) => (
                  <li key={i} className="text-gray-300">
                    <span className="break-all">{s.title}</span> — <span className="text-amber-300">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
};
