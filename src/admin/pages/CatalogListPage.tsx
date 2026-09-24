import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, Eye, EyeOff, Film, ImageOff, Plus, RefreshCw, Search, Star, StarOff, Tv } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  catalogApi,
  jobsApi,
  type BulkAction,
  type CatalogMediaType,
  type CatalogMovieRow,
  type CatalogSeriesRow,
  type CatalogSort,
  type PublishStatus,
} from '../../lib/api';
import { hasRole } from '../../../shared/roles';
import {
  Alert,
  Badge,
  Button,
  buttonClass,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  PublishBadge,
  StreamBadge,
  TableSkeleton,
  formatDateTime,
  inputClass,
  selectClass,
  useConfirm,
  useToast,
} from '../ui';

export type CatalogKind = 'movie' | 'series';
type Row = CatalogMovieRow | CatalogSeriesRow;

const PAGE_SIZE = 25;

export const MEDIA_TYPE_LABELS: Record<CatalogMediaType, string> = {
  MOVIE: 'Phim',
  SERIES: 'Series',
  SHORT: 'Phim ngắn',
  AI_FILM: 'Phim AI',
  DOCUMENTARY: 'Tài liệu',
  ANIME: 'Anime',
};

const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: 'updated_desc', label: 'Mới cập nhật' },
  { value: 'created_desc', label: 'Mới thêm' },
  { value: 'title_asc', label: 'Tên A→Z' },
  { value: 'year_desc', label: 'Năm mới nhất' },
  { value: 'rating_desc', label: 'Điểm cao nhất' },
];

const BULK: Array<{ action: BulkAction; label: string; icon: React.ReactNode; minAdmin?: boolean }> = [
  { action: 'publish', label: 'Xuất bản', icon: <Eye className="h-4 w-4" /> },
  { action: 'unpublish', label: 'Chuyển về nháp', icon: <EyeOff className="h-4 w-4" /> },
  { action: 'feature', label: 'Nổi bật', icon: <Star className="h-4 w-4" /> },
  { action: 'unfeature', label: 'Bỏ nổi bật', icon: <StarOff className="h-4 w-4" /> },
  { action: 'archive', label: 'Lưu trữ', icon: <Archive className="h-4 w-4" />, minAdmin: true },
];

const COPY = {
  movie: { title: 'Phim', noun: 'phim', description: 'Tìm, lọc, tạo và xuất bản phim. Nháp và bản lưu trữ không hiển thị trên trang xem phim.', icon: Film },
  series: { title: 'Series', noun: 'series', description: 'Quản lý series, mùa và tập. Mở một series để thêm mùa, tập và sắp xếp thứ tự.', icon: Tv },
};

/** Movies and series share this list: filters, selection, bulk actions, pagination. */
export function CatalogListPage({ kind }: { kind: CatalogKind }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const copy = COPY[kind];
  const [searchParams] = useSearchParams();

  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [publishStatus, setPublishStatus] = useState<PublishStatus | ''>(() => {
    const s = searchParams.get('status');
    return s === 'DRAFT' || s === 'PUBLISHED' || s === 'ARCHIVED' ? s : '';
  });
  const [type, setType] = useState<CatalogMediaType | ''>('');
  const [sort, setSort] = useState<CatalogSort>('updated_desc');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = { q: query || undefined, publishStatus: publishStatus || undefined, sort, page, limit: PAGE_SIZE };
    const request =
      kind === 'movie' ? catalogApi.listMovies({ ...params, type: type || undefined }) : catalogApi.listSeries(params);
    request
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setTotalPages(Math.max(1, pagination.totalPages));
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [kind, query, publishStatus, type, sort, page, reload]);

  // Selection is per page of results; drop it when the result set changes.
  useEffect(() => setSelected(new Set()), [kind, query, publishStatus, type, sort, page]);

  const filterChanged = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const runBulk = async (action: BulkAction, label: string) => {
    const ids = [...selected];
    if (action === 'archive') {
      const ok = await confirm({
        title: `Lưu trữ ${ids.length} ${copy.noun}?`,
        message: 'Nội dung lưu trữ bị ẩn khỏi trang xem phim nhưng vẫn giữ trong hệ thống và có thể xuất bản lại.',
        confirmLabel: 'Lưu trữ',
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const result = kind === 'movie' ? await catalogApi.bulkMovies(ids, action) : await catalogApi.bulkSeries(ids, action);
      toast('success', `${label}: ${result.updated} thay đổi${result.unchanged ? `, ${result.unchanged} giữ nguyên` : ''}.`);
      setSelected(new Set());
      setReload((n) => n + 1);
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /** Queues a background job; titles without a linked provider id are skipped by it. */
  const refreshMetadata = async () => {
    setBusy(true);
    try {
      const res = await jobsApi.refreshMetadata(kind, [...selected]);
      toast('success', res.deduplicated ? 'Đã có công việc làm mới giống vậy đang chạy.' : `Đã xếp hàng làm mới metadata cho ${selected.size} ${copy.noun}.`, { label: 'Xem tiến độ', to: `/admin/jobs/${res.jobId}` });
      setSelected(new Set());
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const Icon = copy.icon;
  const newPath = kind === 'movie' ? '/admin/movies/new' : '/admin/series/new';
  const detailPath = (id: string) => (kind === 'movie' ? `/admin/movies/${id}` : `/admin/series/${id}`);

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Link to={newPath} className={buttonClass('primary')}>
            <Plus className="h-4 w-4" /> Thêm {copy.noun}
          </Link>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <form
            className="relative w-full sm:w-64"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(q.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Tìm theo tên hoặc slug"
              className={`${inputClass} pl-9`}
              placeholder="Tên hoặc slug… (Enter)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          <select aria-label="Trạng thái" className={selectClass} value={publishStatus} onChange={(e) => filterChanged(setPublishStatus)(e.target.value as PublishStatus | '')}>
            <option value="">Mọi trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
          {kind === 'movie' && (
            <select aria-label="Loại" className={selectClass} value={type} onChange={(e) => filterChanged(setType)(e.target.value as CatalogMediaType | '')}>
              <option value="">Mọi loại</option>
              {(Object.keys(MEDIA_TYPE_LABELS) as CatalogMediaType[])
                .filter((t) => t !== 'SERIES')
                .map((t) => (
                  <option key={t} value={t}>{MEDIA_TYPE_LABELS[t]}</option>
                ))}
            </select>
          )}
          <select aria-label="Sắp xếp" className={`${selectClass} sm:ml-auto`} value={sort} onChange={(e) => filterChanged(setSort)(e.target.value as CatalogSort)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-teal-200 bg-teal-50 px-4 py-2 text-sm">
            <span className="mr-1 font-medium text-teal-900">Đã chọn {selected.size}</span>
            {BULK.filter((b) => !b.minAdmin || hasRole(user?.role, 'ADMIN')).map((b) => (
              <Button key={b.action} variant={b.action === 'archive' ? 'danger' : 'secondary'} icon={b.icon} disabled={busy} onClick={() => runBulk(b.action, b.label)}>
                {b.label}
              </Button>
            ))}
            <Button icon={<RefreshCw className="h-4 w-4" />} disabled={busy} onClick={refreshMetadata} title="Chạy nền: cập nhật từ TMDB/OMDb cho các tác phẩm đã liên kết">
              Làm mới metadata
            </Button>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>Bỏ chọn</Button>
          </div>
        )}

        {error && <div className="p-4"><Alert>{error}</Alert></div>}
        {loading ? (
          <TableSkeleton cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Icon className="h-5 w-5" />} title={query || publishStatus || type ? 'Không có kết quả' : `Chưa có ${copy.noun} nào`}>
            {!query && !publishStatus && !type && (
              <Link to={newPath} className="text-teal-700 hover:underline">Thêm {copy.noun} đầu tiên</Link>
            )}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả trên trang"
                      checked={allOnPage}
                      onChange={() => setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)))}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-medium">Tên</th>
                  <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-2 text-left font-medium">Thể loại</th>
                  <th className="px-4 py-2 text-left font-medium">{kind === 'movie' ? 'Luồng phát' : 'Nội dung'}</th>
                  <th className="px-4 py-2 text-left font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`cursor-pointer hover:bg-slate-50 ${selected.has(row.id) ? 'bg-teal-50/40' : ''}`}
                    onClick={() => navigate(detailPath(row.id))}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${row.title}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-3">
                        <Poster url={row.posterUrl} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <span className="truncate">{row.title}</span>
                            {row.isCoverFeature && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Nổi bật" />}
                          </div>
                          <div className="text-xs text-slate-500">
                            {'type' in row
                              ? `${MEDIA_TYPE_LABELS[row.type]} · ${row.year}`
                              : `${row.startYear}${row.endYear ? `–${row.endYear}` : ''}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><PublishBadge status={row.publishStatus} /></td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <span className="line-clamp-1">{row.genres.map((g) => g.genre.name).join(', ') || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {'type' in row ? (
                        <StreamBadge type={row.streamType} />
                      ) : (
                        <Badge tone="teal">{row._count.seasons} mùa · {row.episodeCount} tập</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{formatDateTime(row.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination total={total} page={page} totalPages={totalPages} onPage={setPage} unit={copy.noun} />
      </Card>
    </>
  );
}

export function Poster({ url, size = 'sm' }: { url?: string | null; size?: 'sm' | 'lg' }) {
  const [broken, setBroken] = useState(false);
  const cls = size === 'lg' ? 'h-36 w-24' : 'h-12 w-9';
  if (!url || broken) {
    return (
      <div className={`flex ${cls} shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400`}>
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return <img src={url} alt="" loading="lazy" className={`${cls} shrink-0 rounded bg-slate-100 object-cover`} onError={() => setBroken(true)} />;
}
