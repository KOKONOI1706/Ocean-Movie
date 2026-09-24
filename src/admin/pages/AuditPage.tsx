import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, ScrollText, X } from 'lucide-react';
import { adminApi, AuditEntry } from '../../lib/api';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Pagination, Spinner, formatDateTime, selectClass } from '../ui';

const PAGE_SIZE = 30;

const RESOURCE_TYPES = [
  { value: '', label: 'Mọi đối tượng' },
  { value: 'Movie', label: 'Phim' },
  { value: 'Series', label: 'Series' },
  { value: 'Episode', label: 'Tập' },
  { value: 'Import', label: 'Thu thập' },
  { value: 'User', label: 'Người dùng' },
];

const ACTION_LABELS: Record<string, string> = {
  'movie.update': 'Sửa phim',
  'series.update': 'Sửa series',
  'movie.stream.remove': 'Gỡ luồng phim',
  'episode.stream.remove': 'Gỡ luồng tập',
  'aggregator.ingest': 'Nhập liên kết',
  'aggregator.scrape': 'Cào trang web',
  'aggregator.search': 'Tìm trên nguồn',
  'user.role.change': 'Đổi vai trò',
};

/**
 * Admin audit log (ADMIN+). Filters live in the URL so other pages can link
 * here, e.g. /admin/audit?resourceType=User&resourceId=<id>.
 */
export function AuditPage() {
  const [params, setParams] = useSearchParams();
  const resourceType = params.get('resourceType') || '';
  const resourceId = params.get('resourceId') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    adminApi
      .audit({ resourceType: resourceType || undefined, resourceId: resourceId || undefined, page, limit: PAGE_SIZE })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setTotalPages(Math.max(1, pagination.totalPages));
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [resourceType, resourceId, page]);

  const setFilter = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  return (
    <>
      <PageHeader title="Nhật ký quản trị" description="Mọi thay đổi trong khu quản trị: ai làm, lúc nào, dữ liệu trước và sau." />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
          <select
            aria-label="Lọc theo đối tượng"
            className={selectClass}
            value={resourceType}
            onChange={(e) => setFilter({ resourceType: e.target.value, resourceId: '' })}
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {resourceId && (
            <Button variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => setFilter({ resourceId: '' })}>
              Chỉ bản ghi <code className="text-xs">{resourceId.slice(0, 8)}…</code>
            </Button>
          )}
        </div>

        {error && <div className="p-4"><Alert>{error}</Alert></div>}
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={<ScrollText className="h-5 w-5" />} title="Chưa có mục nào" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((entry) => {
              const expanded = open === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => setOpen(expanded ? null : entry.id)}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                    <span className="w-32 shrink-0 text-slate-500 tabular-nums">{formatDateTime(entry.createdAt)}</span>
                    <Badge tone={entry.action.startsWith('user.') ? 'red' : entry.action.startsWith('aggregator.') ? 'teal' : 'neutral'}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-slate-700">
                      {entry.resourceType}
                      {entry.resourceId && <code className="ml-1 text-xs text-slate-500">{entry.resourceId.slice(0, 8)}</code>}
                    </span>
                    <span className="hidden truncate text-slate-500 sm:block">{entry.actorEmail}</span>
                  </button>
                  {expanded && <AuditDetail entry={entry} />}
                </li>
              );
            })}
          </ul>
        )}

        <Pagination total={total} page={page} totalPages={totalPages} onPage={(p) => setFilter({ page: String(p) })} unit="mục" />
      </Card>
    </>
  );
}

function AuditDetail({ entry }: { entry: AuditEntry }) {
  return (
    <div className="space-y-3 bg-slate-50 px-4 pb-4 pt-1 text-sm">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
        <div><dt className="inline text-slate-400">Người thực hiện: </dt><dd className="inline">{entry.actorEmail}</dd></div>
        <div><dt className="inline text-slate-400">Hành động: </dt><dd className="inline font-mono">{entry.action}</dd></div>
        {entry.resourceId && <div><dt className="inline text-slate-400">Mã bản ghi: </dt><dd className="inline font-mono">{entry.resourceId}</dd></div>}
        {entry.ip && <div><dt className="inline text-slate-400">IP: </dt><dd className="inline font-mono">{entry.ip}</dd></div>}
      </dl>
      <div className="grid gap-3 md:grid-cols-2">
        <JsonBlock label="Trước" value={entry.before} />
        <JsonBlock label="Sau" value={entry.after} />
      </div>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
        {value === null || value === undefined ? '—' : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
