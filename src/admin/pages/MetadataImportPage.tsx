import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CloudDownload, ExternalLink, Search } from 'lucide-react';
import {
  metadataApi,
  type ImportReport,
  type MatchResult,
  type MergeMode,
  type MetadataKind,
  type MetadataProviderInfo,
  type MetadataSearchResult,
  type NormalizedMetadata,
} from '../../lib/api';
import { Alert, Badge, Button, Card, EmptyState, Modal, PageHeader, Spinner, inlineInputClass, inputClass, labelClass, selectClass, useToast } from '../ui';
import { Poster } from './CatalogListPage';

const TMDB_NOTICE = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';

/**
 * Import one title's metadata from an official API (TMDB, OMDb): search or
 * enter an id, preview what will be written and where, then import.
 */
export function MetadataImportPage() {
  const [providers, setProviders] = useState<MetadataProviderInfo[] | null>(null);
  const [provider, setProvider] = useState('');
  const [kind, setKind] = useState<MetadataKind>('movie');
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [directId, setDirectId] = useState('');
  const [results, setResults] = useState<MetadataSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    metadataApi
      .providers()
      .then((list) => {
        setProviders(list);
        setProvider(list.find((p) => p.configured)?.key ?? '');
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim() || !provider) return;
    setSearching(true);
    setError('');
    try {
      setResults(await metadataApi.search(provider, kind, q.trim(), year ? Number(year) : undefined));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSearching(false);
    }
  };

  if (!providers) return error ? <Alert>{error}</Alert> : <Spinner />;
  const current = providers.find((p) => p.key === provider);
  const noneConfigured = !providers.some((p) => p.configured);

  return (
    <>
      <PageHeader
        title="Nhập metadata"
        description="Lấy thông tin phim (tên, mô tả, poster, thể loại, đạo diễn, diễn viên, mùa và tập) từ API chính thức. Chỉ nhập metadata, không nhập video."
      />

      {noneConfigured && (
        <div className="mb-4">
          <Alert tone="amber">
            Chưa cấu hình nguồn nào. Thêm <code>TMDB_API_TOKEN</code> (themoviedb.org/settings/api) hoặc <code>OMDB_API_KEY</code> (omdbapi.com) vào biến môi trường của máy chủ rồi khởi động lại.
          </Alert>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className={labelClass}>Nguồn</span>
            <select className={selectClass} value={provider} onChange={(e) => { setProvider(e.target.value); setResults(null); }}>
              {providers.map((p) => (
                <option key={p.key} value={p.key} disabled={!p.configured}>
                  {p.name}{p.configured ? '' : ' (chưa cấu hình)'}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5" role="tablist" aria-label="Loại">
            {(['movie', 'series'] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                onClick={() => { setKind(k); setResults(null); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer ${kind === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {k === 'movie' ? 'Phim lẻ' : 'Series'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <form onSubmit={search} className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-1">
            <input aria-label="Tên phim" className={`${inlineInputClass} min-w-48 flex-1`} placeholder="Tên phim hoặc series…" value={q} onChange={(e) => setQ(e.target.value)} disabled={!provider} />
            <input aria-label="Năm" type="number" className={`${inlineInputClass} w-24`} placeholder="Năm" value={year} onChange={(e) => setYear(e.target.value)} disabled={!provider} />
            <Button type="submit" variant="primary" icon={<Search className="h-4 w-4" />} loading={searching} disabled={!provider || !q.trim()}>Tìm</Button>
          </form>
          <form
            className="flex w-full items-center gap-2 md:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
              if (directId.trim()) setPreviewId(directId.trim());
            }}
          >
            <input
              aria-label="Nhập theo mã"
              className={`${inlineInputClass} min-w-0 flex-1 md:w-44 md:flex-none`}
              placeholder={current?.idNamespace === 'imdb' ? 'Mã IMDb (tt…)' : 'Mã TMDB (số)'}
              value={directId}
              onChange={(e) => setDirectId(e.target.value)}
              disabled={!provider}
            />
            <Button type="submit" disabled={!provider || !directId.trim()}>Theo mã</Button>
          </form>
        </div>
        {provider === 'tmdb' && <p className="mt-3 text-[11px] text-slate-400">{TMDB_NOTICE}</p>}
      </Card>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {results && (
        <Card className="mt-5" padded={false} title={`${results.length} kết quả`}>
          {results.length === 0 ? (
            <EmptyState icon={<Search className="h-5 w-5" />} title="Không tìm thấy">Thử tên gốc tiếng Anh, bỏ năm, hoặc nhập theo mã.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((r) => (
                <li key={r.externalId} className="flex items-start gap-3 px-4 py-3">
                  <Poster url={r.posterUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{r.title}</span>
                      {r.year && <span className="text-sm text-slate-500">{r.year}</span>}
                      {r.imported && (
                        <Link to={`/admin/${kind === 'movie' ? 'movies' : 'series'}/${r.imported.id}`}>
                          <Badge tone="green">Đã nhập</Badge>
                        </Link>
                      )}
                    </div>
                    {r.originalTitle && <div className="text-xs text-slate-500">{r.originalTitle}</div>}
                    {r.overview && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.overview}</p>}
                  </div>
                  <Button onClick={() => setPreviewId(r.externalId)}>{r.imported ? 'Cập nhật' : 'Xem trước'}</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {previewId && (
        <PreviewDialog
          provider={provider}
          kind={kind}
          externalId={previewId}
          onClose={() => setPreviewId(null)}
          onImported={(report) => {
            setResults((prev) => prev?.map((r) => (r.externalId === previewId ? { ...r, imported: { id: report.id, slug: report.slug, title: report.title } } : r)) ?? null);
          }}
        />
      )}
    </>
  );
}

const MATCH_COPY: Record<MatchResult['decision'], string> = {
  linked: 'Mã này đã được nhập. Nhập lại sẽ cập nhật tác phẩm:',
  match: 'Trùng với tác phẩm đã có, sẽ cập nhật:',
  ambiguous: 'Có tác phẩm tương tự. Chọn tác phẩm để cập nhật, hoặc tạo mới:',
  new: 'Chưa có trong kho. Sẽ tạo mới.',
};

function PreviewDialog({ provider, kind, externalId, onClose, onImported }: {
  provider: string;
  kind: MetadataKind;
  externalId: string;
  onClose: () => void;
  onImported: (report: ImportReport) => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<{ metadata: NormalizedMetadata; match: MatchResult } | null>(null);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<string>('auto');
  const [mode, setMode] = useState<MergeMode>('fill-empty');
  const [publish, setPublish] = useState(false);
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  useEffect(() => {
    metadataApi
      .preview(provider, kind, externalId)
      .then((d) => {
        setData(d);
        if (d.match.decision === 'ambiguous') setTarget(d.match.candidates[0].id);
        if (d.metadata.seasons) setSeasons(d.metadata.seasons.map((s) => s.seasonNumber));
      })
      .catch((err) => setError((err as Error).message));
  }, [provider, kind, externalId]);

  const run = async () => {
    setImporting(true);
    try {
      const result = await metadataApi.import({ provider, kind, externalId, target, mode, publish, ...(seasons ? { seasons } : {}) });
      setReport(result);
      onImported(result);
      toast('success', result.created ? `Đã tạo “${result.title}”.` : `Đã cập nhật “${result.title}”.`);
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const m = data?.metadata;
  const match = data?.match;
  const creating = match && (target === 'new' || (target === 'auto' && match.decision === 'new'));
  const editPath = (id: string) => `/admin/${kind === 'movie' ? 'movies' : 'series'}/${id}`;

  return (
    <Modal
      title="Xem trước khi nhập"
      onClose={onClose}
      wide
      footer={
        report ? (
          <>
            <Button onClick={onClose}>Đóng</Button>
            <Link to={editPath(report.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">
              Mở tác phẩm <ExternalLink className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Hủy</Button>
            <Button variant="primary" icon={<CloudDownload className="h-4 w-4" />} loading={importing} disabled={!data} onClick={run}>
              {creating ? 'Tạo mới' : 'Cập nhật'}
            </Button>
          </>
        )
      }
    >
      {error ? (
        <Alert>{error}</Alert>
      ) : !m || !match ? (
        <Spinner />
      ) : report ? (
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 font-medium text-emerald-700"><CheckCircle2 className="h-5 w-5" /> {report.created ? 'Đã tạo' : 'Đã cập nhật'} “{report.title}”</p>
          {!report.created && <p className="text-slate-600">Trường được cập nhật: {report.updatedFields.length ? report.updatedFields.join(', ') : 'không có (mọi trường đã có dữ liệu)'}</p>}
          {report.seasons && <p className="text-slate-600">Mùa: {report.seasons.created} mới, {report.seasons.updated} cập nhật · Tập: {report.episodes!.created} mới, {report.episodes!.updated} cập nhật</p>}
          {report.created && !publish && <p className="text-slate-600">Nội dung đang ở dạng nháp; xuất bản ở trang chỉnh sửa.</p>}
        </div>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex gap-4">
            <Poster url={m.posterUrl} size="lg" />
            <div className="min-w-0 space-y-1">
              <div className="text-base font-semibold text-slate-900">{m.title}</div>
              {m.originalTitle && <div className="text-slate-500">{m.originalTitle}</div>}
              <div className="text-slate-500">
                {[m.year ?? m.startYear, m.runtimeMinutes && `${m.runtimeMinutes} phút`, m.ageRating, m.rating && `★ ${m.rating}`, m.seasons && `${m.seasons.length} mùa`].filter(Boolean).join(' · ')}
              </div>
              <div className="flex flex-wrap gap-1">{m.genres.map((g) => <span key={g}><Badge>{g}</Badge></span>)}</div>
              <div className="text-xs text-slate-500">{Object.entries(m.externalIds).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>
            </div>
          </div>
          {m.overview && <p className="text-slate-600">{m.overview}</p>}
          {m.credits.length > 0 && (
            <p className="text-slate-600">
              {m.credits.slice(0, 8).map((c) => `${c.name} (${c.role === 'Cast' ? c.character || 'diễn viên' : c.role})`).join(', ')}
              {m.credits.length > 8 && '…'}
            </p>
          )}

          <fieldset className="rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-xs font-medium text-slate-600">Nhập vào đâu</legend>
            <p className="mb-2 text-slate-700">{MATCH_COPY[match.decision]}</p>
            {(match.decision === 'linked' || match.decision === 'match') && (
              <div className="flex flex-wrap items-center gap-2">
                <Link to={editPath(match.target.id)} className="font-medium text-teal-700 hover:underline">{match.target.title} ({match.target.year})</Link>
                {match.decision === 'match' && <span className="text-xs text-slate-500">{match.reason}</span>}
                {match.decision === 'match' && (
                  <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={target === 'new'} onChange={(e) => setTarget(e.target.checked ? 'new' : 'auto')} /> Không phải, tạo mới
                  </label>
                )}
              </div>
            )}
            {match.decision === 'ambiguous' && (
              <div className="space-y-1.5">
                {match.candidates.map((c) => (
                  <label key={c.id} className="flex items-center gap-2">
                    <input type="radio" name="target" checked={target === c.id} onChange={() => setTarget(c.id)} />
                    <span>{c.title} ({c.year}{c.runtimeMinutes ? `, ${c.runtimeMinutes} phút` : ''})</span>
                    <Link to={editPath(c.id)} target="_blank" className="text-xs text-teal-700 hover:underline">mở</Link>
                  </label>
                ))}
                <label className="flex items-center gap-2">
                  <input type="radio" name="target" checked={target === 'new'} onChange={() => setTarget('new')} /> Tạo tác phẩm mới
                </label>
              </div>
            )}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            {!creating && (
              <label>
                <span className={labelClass}>Cách cập nhật</span>
                <select className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as MergeMode)}>
                  <option value="fill-empty">Chỉ điền trường còn trống (giữ nội dung đã sửa)</option>
                  <option value="replace">Ghi đè bằng dữ liệu từ nguồn</option>
                </select>
              </label>
            )}
            <label className="flex items-start gap-2 self-end pb-2">
              <input type="checkbox" className="mt-0.5" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
              <span className="text-slate-700">Xuất bản ngay nội dung mới tạo</span>
            </label>
          </div>

          {m.seasons && seasons && (
            <div>
              <span className={labelClass}>Mùa cần nhập</span>
              <div className="flex flex-wrap gap-2">
                {m.seasons.map((s) => (
                  <label key={s.seasonNumber} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1">
                    <input
                      type="checkbox"
                      checked={seasons.includes(s.seasonNumber)}
                      onChange={(e) => setSeasons(e.target.checked ? [...seasons, s.seasonNumber] : seasons.filter((n) => n !== s.seasonNumber))}
                    />
                    Mùa {s.seasonNumber}{s.episodeCount ? ` (${s.episodeCount} tập)` : ''}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
