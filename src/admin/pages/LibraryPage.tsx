import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Film, ImageOff, Library, Search, Tv, Unlink, X } from 'lucide-react';
import { aggregatorApi, LibraryMovie, LibrarySeries, MediaPatch } from '../../lib/api';
import { Alert, Badge, Button, buttonClass, Card, EmptyState, PageHeader, Spinner, StreamBadge, formatDateTime, inputClass, labelClass, Pagination, useConfirm } from '../ui';

type Kind = 'movie' | 'series';
type Row = LibraryMovie | LibrarySeries;

const PAGE_SIZE = 20;

export function LibraryPage() {
  const [kind, setKind] = useState<Kind>('movie');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    aggregatorApi
      .library(kind, { q: query || undefined, page, limit: PAGE_SIZE })
      .then(({ items, pagination }) => {
        setRows(items as Row[]);
        setTotal(pagination.total);
        setTotalPages(Math.max(1, pagination.totalPages));
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [kind, query, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchKind = (k: Kind) => {
    setKind(k);
    setPage(1);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="Kho nội dung"
        description="Phim và series đã thu thập. Bổ sung poster, mô tả, năm phát hành hoặc gỡ luồng phát không còn dùng."
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5" role="tablist">
            {([['movie', 'Phim', Film], ['series', 'Series', Tv]] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                onClick={() => switchKind(k)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer ${
                  kind === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <form
            className="relative w-full sm:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(q.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Tìm theo tên"
              className={`${inputClass} pl-9`}
              placeholder="Tìm theo tên… (Enter)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
        </div>

        {error && <div className="p-4"><Alert>{error}</Alert></div>}
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Library className="h-5 w-5" />} title={query ? 'Không có kết quả' : 'Chưa có nội dung đã thu thập'}>
            {!query && (
              <>Thêm ở mục <Link to="/admin/crawl" className="text-teal-700 hover:underline">Thu thập phim</Link>.</>
            )}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Tên</th>
                  <th className="px-4 py-2 text-left font-medium">{kind === 'movie' ? 'Luồng' : 'Tập có luồng'}</th>
                  <th className="px-4 py-2 text-left font-medium">Nguồn</th>
                  <th className="px-4 py-2 text-left font-medium">{kind === 'movie' ? 'Thu thập lúc' : 'Năm'}</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Thumb url={row.posterUrl} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">{row.title}</div>
                          <div className="text-xs text-slate-500">
                            {'type' in row ? `${row.type} · ${row.year}` : `${countEpisodes(row).total} tập`}
                            {!row.synopsis && <span className="text-amber-700"> · thiếu mô tả</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {'type' in row ? (
                        <StreamBadge type={row.streamType} />
                      ) : (
                        <Badge tone="teal">
                          {countEpisodes(row).streamed}/{countEpisodes(row).total}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.sourceName || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {'type' in row ? formatDateTime(row.lastScrapedAt) : row.year}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button variant="secondary" onClick={() => setEditing(row)}>Sửa</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination total={total} page={page} totalPages={totalPages} onPage={setPage} />
      </Card>

      {editing && (
        <EditDrawer
          kind={kind}
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onChanged={load}
        />
      )}
    </>
  );
}

function countEpisodes(s: LibrarySeries) {
  const eps = s.seasons.flatMap((season) => season.episodes);
  return { total: eps.length, streamed: eps.filter((e) => e.streamUrl).length };
}

const Thumb: React.FC<{ url?: string }> = ({ url }) => {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return <img src={url} alt="" className="h-12 w-9 shrink-0 rounded object-cover bg-slate-100" onError={() => setBroken(true)} />;
};

function EditDrawer({ kind, row, onClose, onSaved, onChanged }: {
  kind: Kind;
  row: Row;
  onClose: () => void;
  onSaved: () => void;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    title: row.title,
    year: String(row.year ?? ''),
    synopsis: row.synopsis || '',
    posterUrl: row.posterUrl || '',
    backdropUrl: row.backdropUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const patch: MediaPatch = {
      title: form.title.trim(),
      synopsis: form.synopsis,
      posterUrl: form.posterUrl.trim(),
      backdropUrl: form.backdropUrl.trim(),
      ...(form.year.trim() ? { year: Number(form.year) } : {}),
    };
    try {
      await aggregatorApi.updateMedia(kind, row.id, patch);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const removeStream = async (target: 'movie' | 'episode', id: string, label: string) => {
    if (!(await confirm({ title: `Gỡ luồng phát của “${label}”?`, message: 'Bản ghi và thông tin phim vẫn được giữ lại.', confirmLabel: 'Gỡ luồng', danger: true }))) return;
    setBusyId(id);
    try {
      await aggregatorApi.removeStream(target, id);
      setRemoved((prev) => new Set(prev).add(id));
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const publicUrl = kind === 'movie' ? `/movie/${row.slug}` : `/series/${row.slug}`;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Sửa ${row.title}`}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">{kind === 'movie' ? 'Phim' : 'Series'}</div>
            <h2 className="truncate text-base font-semibold text-slate-900">{row.title}</h2>
          </div>
          <div className="flex items-center gap-1">
            <a href={publicUrl} target="_blank" rel="noreferrer" title="Xem trên trang" aria-label="Xem trên trang" className={buttonClass('ghost')}>
              <ExternalLink className="h-4 w-4" />
            </a>
            <Button variant="ghost" icon={<X className="h-4 w-4" />} onClick={onClose} aria-label="Đóng" />
          </div>
        </header>

        <form id="library-edit-form" onSubmit={save} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div>
              <label htmlFor="edit-title" className={labelClass}>Tên</label>
              <input id="edit-title" className={inputClass} value={form.title} onChange={set('title')} required />
            </div>
            <div>
              <label htmlFor="edit-year" className={labelClass}>Năm</label>
              <input id="edit-year" className={inputClass} inputMode="numeric" value={form.year} onChange={set('year')} />
            </div>
          </div>
          <div>
            <label htmlFor="edit-synopsis" className={labelClass}>Mô tả</label>
            <textarea id="edit-synopsis" className={`${inputClass} min-h-[110px]`} value={form.synopsis} onChange={set('synopsis')} />
          </div>
          <div className="grid grid-cols-[1fr_64px] items-end gap-3">
            <div>
              <label htmlFor="edit-poster" className={labelClass}>URL poster (dọc)</label>
              <input id="edit-poster" className={inputClass} value={form.posterUrl} onChange={set('posterUrl')} placeholder="https://…" />
            </div>
            <Thumb key={form.posterUrl} url={form.posterUrl} />
          </div>
          <div>
            <label htmlFor="edit-backdrop" className={labelClass}>URL ảnh nền (ngang)</label>
            <input id="edit-backdrop" className={inputClass} value={form.backdropUrl} onChange={set('backdropUrl')} placeholder="https://…" />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Luồng phát</h3>
            {'type' in row ? (
              <StreamRow
                label="Phim"
                url={removed.has(row.id) ? null : row.streamUrl}
                type={removed.has(row.id) ? null : row.streamType}
                busy={busyId === row.id}
                onRemove={() => removeStream('movie', row.id, row.title)}
              />
            ) : (
              <ul className="space-y-2">
                {row.seasons.flatMap((season) =>
                  season.episodes.map((ep) => (
                    <li key={ep.id}>
                      <StreamRow
                        label={`S${String(season.seasonNumber).padStart(2, '0')}E${String(ep.episodeNumber).padStart(2, '0')} · ${ep.title}`}
                        url={removed.has(ep.id) ? null : ep.streamUrl}
                        type={removed.has(ep.id) ? null : ep.streamType}
                        busy={busyId === ep.id}
                        onRemove={() => removeStream('episode', ep.id, `${row.title} tập ${ep.episodeNumber}`)}
                      />
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </form>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Button type="button" onClick={onClose}>Huỷ</Button>
          <Button type="submit" form="library-edit-form" variant="primary" loading={saving}>Lưu thay đổi</Button>
        </footer>
      </aside>
    </div>
  );
}

function StreamRow({ label, url, type, busy, onRemove }: {
  label: string;
  url: string | null;
  type: string | null;
  busy: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate font-medium text-slate-800">{label}</span>
          <StreamBadge type={type} />
        </div>
        {url && <div className="truncate font-mono text-[11px] text-slate-500" title={url}>{url}</div>}
      </div>
      {url && (
        <Button type="button" variant="danger" loading={busy} icon={<Unlink className="h-3.5 w-3.5" />} onClick={onRemove}>
          Gỡ
        </Button>
      )}
    </div>
  );
}
