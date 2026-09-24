import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Eye, Film, Globe, Radar, Search, Tv } from 'lucide-react';
import {
  aggregatorApi,
  IngestMode,
  IngestReport,
  MovieType,
  ParseResult,
  RawItemInput,
} from '../../lib/api';
import { Alert, Badge, Button, Card, PageHeader, inputClass, labelClass } from '../ui';

const MODE_OPTIONS: Array<{ id: IngestMode; label: string; hint: string }> = [
  { id: 'auto', label: 'Tự động', hint: 'Có dấu tập (Tập 3, Ep 3, S01E03) → tập của series; còn lại → phim lẻ' },
  { id: 'movie', label: 'Phim lẻ', hint: 'Mỗi dòng là một bộ phim' },
  { id: 'series', label: 'Series', hint: 'Gom các tập thành series; bỏ qua dòng không có số tập' },
];

export const MOVIE_TYPE_OPTIONS: Array<{ id: MovieType; label: string }> = [
  { id: 'AI_FILM', label: 'Phim AI' },
  { id: 'MOVIE', label: 'Phim điện ảnh' },
  { id: 'SHORT', label: 'Phim ngắn' },
  { id: 'DOCUMENTARY', label: 'Tài liệu' },
  { id: 'ANIME', label: 'Anime' },
];

type Method = 'paste' | 'scrape' | 'search';

const METHODS: Array<{ id: Method; label: string; icon: React.ReactNode; hint: string }> = [
  { id: 'paste', label: 'Dán liên kết phát', icon: <ClipboardList className="h-4 w-4" />, hint: 'Bạn đã có tên phim và URL phát.' },
  { id: 'scrape', label: 'Cào trang web', icon: <Globe className="h-4 w-4" />, hint: 'Bạn có URL trang xem phim; hệ thống tự tìm luồng phát và tên.' },
  { id: 'search', label: 'Tìm trên nguồn', icon: <Search className="h-4 w-4" />, hint: 'Tìm theo từ khoá trên các nguồn đã cấu hình.' },
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

export function CrawlPage() {
  const [method, setMethod] = useState<Method>('paste');
  const [mode, setMode] = useState<IngestMode>('auto');
  const [movieType, setMovieType] = useState<MovieType>('AI_FILM');
  const [sourceName, setSourceName] = useState('');
  const [publish, setPublish] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [urlText, setUrlText] = useState('');
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<IngestReport | null>(null);
  const [preview, setPreview] = useState<ParseResult[] | null>(null);

  useEffect(() => {
    aggregatorApi.sources().then(setSources).catch(() => setSources([]));
  }, []);

  const pasted = useMemo(() => parsePastedItems(pasteText), [pasteText]);
  const urls = useMemo(
    () => urlText.split(/\s+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u)),
    [urlText]
  );

  const options = { mode, movieType, sourceName: sourceName.trim() || undefined, publish };

  const run = async (task: () => Promise<IngestReport>) => {
    setRunning(true);
    setError('');
    setReport(null);
    try {
      setReport(await task());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const handleRun = () => {
    if (method === 'paste') run(() => aggregatorApi.ingest(pasted.items, options));
    if (method === 'scrape') run(() => aggregatorApi.scrape(urls, options));
    if (method === 'search') run(() => aggregatorApi.search(query.trim(), selectedSources, options));
  };

  const handlePreview = async () => {
    setError('');
    try {
      setPreview(await aggregatorApi.parse(pasted.items.map((i) => i.title)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const canRun =
    !running &&
    ((method === 'paste' && pasted.items.length > 0) ||
      (method === 'scrape' && urls.length > 0) ||
      (method === 'search' && query.trim().length > 0 && sources.length > 0));

  return (
    <>
      <PageHeader
        title="Thu thập phim"
        description="Lấy liên kết phát từ nguồn bên ngoài, chuẩn hoá tên và lưu vào kho phim / series. Chạy lại nhiều lần an toàn: bản ghi được cập nhật, không nhân đôi."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card padded={false}>
          <div className="flex gap-1 border-b border-slate-200 px-2 pt-2" role="tablist">
            {METHODS.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={method === m.id}
                onClick={() => setMethod(m.id)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium cursor-pointer ${
                  method === m.id ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 p-4">
            <p className="text-sm text-slate-500">{METHODS.find((m) => m.id === method)!.hint}</p>

            {method === 'paste' && (
              <>
                <textarea
                  aria-label="Danh sách liên kết phát"
                  className={`${inputClass} min-h-[220px] font-mono text-xs`}
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value);
                    setPreview(null);
                  }}
                  placeholder={PASTE_PLACEHOLDER}
                  spellCheck={false}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500">
                    {pasted.items.length} liên kết hợp lệ
                    {pasted.errors.length > 0 && <span className="text-amber-700"> · {pasted.errors[0]}</span>}
                  </span>
                  <Button icon={<Eye className="h-4 w-4" />} onClick={handlePreview} disabled={pasted.items.length === 0}>
                    Xem trước cách nhận diện
                  </Button>
                </div>
              </>
            )}

            {method === 'scrape' && (
              <>
                <textarea
                  aria-label="Danh sách URL trang"
                  className={`${inputClass} min-h-[180px] font-mono text-xs`}
                  value={urlText}
                  onChange={(e) => setUrlText(e.target.value)}
                  placeholder={'Mỗi dòng một trang, ví dụ:\nhttps://site.example.com/phim/the-last-signal\nhttps://site.example.com/xem/crouching-tiger-tap-1'}
                  spellCheck={false}
                />
                <p className="text-xs text-slate-500">
                  {urls.length} trang · tìm luồng .m3u8, thẻ &lt;video&gt;, iframe nhúng và tiêu đề og:title trên mỗi trang.
                </p>
              </>
            )}

            {method === 'search' &&
              (sources.length === 0 ? (
                <Alert tone="amber">
                  Chưa cấu hình nguồn tìm kiếm. Thêm biến môi trường <code>AGGREGATOR_SOURCES</code> trên máy chủ (xem{' '}
                  <code>.env.example</code>), hoặc dùng “Dán liên kết phát” / “Cào trang web”.
                </Alert>
              ) : (
                <>
                  <input
                    aria-label="Từ khoá"
                    className={inputClass}
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
                          className={`rounded-full border px-3 py-1 text-xs cursor-pointer ${
                            on ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500">Không chọn nguồn nào = tìm trên tất cả nguồn.</p>
                </>
              ))}

            {preview && method === 'paste' && (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Tên gốc</th>
                      <th className="px-3 py-2 text-left font-medium">Sẽ lưu thành</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((p, i) => {
                      // Mirrors the server's routing per mode (see aggregator.service ingest()).
                      const asEpisode = mode === 'series' ? Boolean(p.episode) : mode === 'auto' && p.kind === 'episode';
                      const asMovie = !asEpisode && mode !== 'series' && Boolean(p.movie);
                      return (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-600 break-all">{p.title}</td>
                          <td className="px-3 py-2">
                            {asEpisode ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Tv className="h-3.5 w-3.5 text-slate-400" />
                                {p.episode!.baseTitle}
                                <Badge>
                                  S{String(p.episode!.seasonNumber).padStart(2, '0')}E{String(p.episode!.episodeNumber).padStart(2, '0')}
                                </Badge>
                              </span>
                            ) : asMovie ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Film className="h-3.5 w-3.5 text-slate-400" />
                                {p.movie!.title}
                                {p.movie!.year && <span className="text-slate-400">({p.movie!.year})</span>}
                                {mode === 'auto' && p.kind === 'ambiguous' && (
                                  <Badge tone="amber">số cuối tên — chọn “Series” nếu là tập</Badge>
                                )}
                              </span>
                            ) : (
                              <Badge tone="amber">Bỏ qua</Badge>
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
        </Card>

        <div className="space-y-4">
          <Card title="Tuỳ chọn lưu">
            <fieldset className="space-y-2">
              <legend className={labelClass}>Lưu thành</legend>
              {MODE_OPTIONS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 ${
                    mode === m.id ? 'border-teal-600 bg-teal-50/60' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    className="mt-0.5 accent-teal-700"
                    checked={mode === m.id}
                    onChange={() => setMode(m.id)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{m.label}</span>
                    <span className="block text-xs text-slate-500">{m.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {mode !== 'series' && (
              <div className="mt-4">
                <label htmlFor="movie-type" className={labelClass}>Loại phim</label>
                <select
                  id="movie-type"
                  className={inputClass}
                  value={movieType}
                  onChange={(e) => setMovieType(e.target.value as MovieType)}
                >
                  {MOVIE_TYPE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="source-name" className={labelClass}>Tên nguồn (tuỳ chọn)</label>
              <input
                id="source-name"
                className={inputClass}
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="vd. partner-feed"
              />
            </div>

            <label className="mt-4 flex items-start gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
              />
              <span>
                Xuất bản ngay
                <span className="block text-xs text-slate-500">
                  Bỏ chọn: nội dung mới được lưu dạng nháp, duyệt và xuất bản ở mục Phim / Series. Nội dung đã có giữ nguyên trạng thái.
                </span>
              </span>
            </label>

            <Button
              variant="primary"
              className="mt-5 w-full"
              icon={<Radar className="h-4 w-4" />}
              loading={running}
              disabled={!canRun}
              onClick={handleRun}
            >
              {running ? 'Đang thu thập…' : 'Bắt đầu thu thập'}
            </Button>
          </Card>
          <p className="px-1 text-xs text-slate-500">Chỉ thu thập từ nguồn bạn có quyền phân phối.</p>
        </div>
      </div>

      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      {report && (
        <Card
          className="mt-6"
          title={
            <span className="inline-flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Hoàn tất
            </span>
          }
          padded={false}
        >
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 sm:grid-cols-4">
            {[
              ['Phim', report.movies.length],
              ['Series', report.series.length],
              ['Tập mới / cập nhật', `${report.episodesCreated} / ${report.episodesUpdated}`],
              ['Bỏ qua', report.skipped.length],
            ].map(([label, value]) => (
              <div key={label as string} className="px-4 py-3">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-lg font-semibold tabular-nums">{value}</div>
              </div>
            ))}
          </div>

          <ul className="divide-y divide-slate-100">
            {report.movies.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Film className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate font-medium">{m.title}</span>
                <Badge>{m.type}</Badge>
                <Badge tone={m.created ? 'green' : 'neutral'}>{m.created ? 'Mới' : 'Cập nhật'}</Badge>
                <a href={`/movie/${m.slug}`} target="_blank" rel="noreferrer" className="text-sm text-teal-700 hover:underline">
                  Xem
                </a>
              </li>
            ))}
            {report.series.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Tv className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
                <Badge>{s.episodes} tập</Badge>
                <Badge tone={s.created ? 'green' : 'neutral'}>{s.created ? 'Mới' : 'Cập nhật'}</Badge>
                <a href={`/series/${s.slug}`} target="_blank" rel="noreferrer" className="text-sm text-teal-700 hover:underline">
                  Xem
                </a>
              </li>
            ))}
          </ul>

          {report.skipped.length > 0 && (
            <details className="border-t border-slate-100 px-4 py-3 text-sm">
              <summary className="cursor-pointer text-slate-600">{report.skipped.length} mục bị bỏ qua</summary>
              <ul className="mt-2 space-y-1">
                {report.skipped.map((s, i) => (
                  <li key={i} className="text-slate-600">
                    <span className="break-all">{s.title}</span> — <span className="text-amber-700">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}
    </>
  );
}
