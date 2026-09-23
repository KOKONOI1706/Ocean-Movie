import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Radar, RefreshCw, Tv } from 'lucide-react';
import { aggregatorApi, AdminStats } from '../../lib/api';
import { Alert, Button, buttonClass, Card, EmptyState, PageHeader, Spinner, StreamBadge, formatDateTime } from '../ui';

const STREAM_LABELS: Record<string, string> = {
  HLS: 'HLS (.m3u8)',
  FILE: 'Tệp video (.mp4/.webm)',
  EMBED: 'Trình phát nhúng',
};

export function OverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    aggregatorApi
      .stats()
      .then(setStats)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Tình trạng kho phim và các nguồn phát đã thu thập."
        actions={
          <>
            <Button variant="ghost" icon={<RefreshCw className="h-4 w-4" />} onClick={load} disabled={loading}>
              Làm mới
            </Button>
            <Link to="/admin/crawl" className={buttonClass('primary')}>
              <Radar className="h-4 w-4" /> Thu thập phim
            </Link>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}
      {loading && !stats && <Spinner />}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Phim trong kho" value={stats.totals.movies} hint={`${stats.crawled.movies} có luồng phát`} />
            <Stat label="Series" value={stats.totals.series} hint={`${stats.crawled.series} từ thu thập`} />
            <Stat label="Tập phim" value={stats.totals.episodes} hint={`${stats.crawled.episodes} có luồng phát`} />
            <Stat label="Người dùng" value={stats.totals.users} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Luồng phát theo loại">
              <Breakdown
                rows={Object.entries(stats.byStreamType).map(([type, count]) => ({ label: STREAM_LABELS[type] || type, count: Number(count) }))}
              />
            </Card>
            <Card title="Nguồn thu thập" className="lg:col-span-2">
              {stats.bySource.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
              ) : (
                <Breakdown rows={stats.bySource.map((s) => ({ label: s.name, count: s.count }))} />
              )}
            </Card>
          </div>

          <Card title="Thu thập gần đây" padded={false} actions={<Link to="/admin/library" className="text-sm text-teal-700 hover:underline">Xem kho nội dung</Link>}>
            {stats.recent.length === 0 ? (
              <EmptyState icon={<Radar className="h-5 w-5" />} title="Chưa thu thập nội dung nào">
                Bắt đầu ở mục <Link to="/admin/crawl" className="text-teal-700 hover:underline">Thu thập phim</Link>.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.recent.map((r) => (
                  <li key={`${r.kind}-${r.id}`} className="flex items-center gap-3 px-4 py-3 text-sm">
                    {r.kind === 'movie' ? <Film className="h-4 w-4 shrink-0 text-slate-400" /> : <Tv className="h-4 w-4 shrink-0 text-slate-400" />}
                    <div className="min-w-0 flex-1">
                      <a
                        href={r.kind === 'movie' ? `/movie/${r.slug}` : `/series/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-slate-900 hover:text-teal-700"
                      >
                        {r.title}
                      </a>
                      <div className="truncate text-xs text-slate-500">{r.subtitle}{r.sourceName ? ` · ${r.sourceName}` : ''}</div>
                    </div>
                    <StreamBadge type={r.streamType} />
                    <span className="hidden w-32 shrink-0 text-right text-xs text-slate-500 sm:block">{formatDateTime(r.lastScrapedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value.toLocaleString('vi-VN')}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function Breakdown({ rows }: { rows: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-slate-700">{r.label}</span>
            <span className="tabular-nums font-medium text-slate-900">{r.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
