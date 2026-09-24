import React, { useEffect, useRef, useState } from 'react';
import { Cpu, PowerOff } from 'lucide-react';
import { jobsApi, type JobRow, type JobStatus, type JobSummary } from '../../lib/api';
import { Badge, formatDateTime } from '../ui';

export const JOB_TYPE_LABELS: Record<string, string> = {
  IMPORT_TITLE: 'Nhập một tác phẩm',
  IMPORT_MOVIES: 'Nhập phim hàng loạt',
  IMPORT_SERIES: 'Nhập series hàng loạt',
  REFRESH_METADATA: 'Làm mới metadata',
};

const STATUS: Record<JobStatus, { label: string; tone: 'neutral' | 'teal' | 'amber' | 'red' | 'green' }> = {
  QUEUED: { label: 'Đang chờ', tone: 'neutral' },
  RUNNING: { label: 'Đang chạy', tone: 'teal' },
  RETRYING: { label: 'Sẽ thử lại', tone: 'amber' },
  SUCCESS: { label: 'Hoàn tất', tone: 'green' },
  FAILED: { label: 'Thất bại', tone: 'red' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
};

export const ACTIVE_STATUSES: JobStatus[] = ['QUEUED', 'RUNNING', 'RETRYING'];
export const isActive = (s: JobStatus) => ACTIVE_STATUSES.includes(s);

export function JobStatusBadge({ job }: { job: Pick<JobRow, 'status' | 'cancelRequested'> }) {
  if (job.status === 'RUNNING' && job.cancelRequested) return <Badge tone="amber">Đang hủy…</Badge>;
  const s = STATUS[job.status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** One-line description of what a job works on, from its payload. */
export function describeJob(job: Pick<JobRow, 'type' | 'payload'>) {
  const p = job.payload as Record<string, any>;
  if (job.type === 'IMPORT_TITLE') return `${p.provider?.toUpperCase()} ${p.kind === 'series' ? 'series' : 'phim'} ${p.externalId}`;
  if (job.type === 'IMPORT_MOVIES' || job.type === 'IMPORT_SERIES') {
    return p.externalIds ? `${p.provider?.toUpperCase()} · ${p.externalIds.length} mã` : `${p.provider?.toUpperCase()} · “${p.query}”${p.year ? ` (${p.year})` : ''} · tối đa ${p.maxItems}`;
  }
  if (job.type === 'REFRESH_METADATA') return p.ids ? `${p.ids.length} tác phẩm` : `Chưa đồng bộ > ${p.staleDays ?? 30} ngày · tối đa ${p.limit ?? 200}`;
  return '';
}

/** Progress bar with counters: "72% · 720 đã xử lý · 681 thành công · 29 bỏ qua · 10 lỗi". */
export function JobProgress({ job, large = false }: { job: JobRow; large?: boolean }) {
  const pct = job.status === 'SUCCESS' ? 100 : job.progress;
  const bar = job.status === 'FAILED' ? 'bg-red-500' : job.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-teal-600';
  return (
    <div className="min-w-40">
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${large ? 'h-3' : 'h-1.5'}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${bar} ${job.status === 'RUNNING' ? 'transition-all duration-500' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`mt-1 flex flex-wrap gap-x-2 tabular-nums text-slate-500 ${large ? 'text-sm' : 'text-[11px]'}`}>
        <span className="font-medium text-slate-700">{pct}%</span>
        {job.processed > 0 && <span>{job.processed} đã xử lý</span>}
        {job.succeeded > 0 && <span className="text-emerald-700">{job.succeeded} thành công</span>}
        {job.skipped > 0 && <span className="text-amber-700">{job.skipped} bỏ qua</span>}
        {job.failed > 0 && <span className="text-red-700">{job.failed} lỗi</span>}
      </div>
    </div>
  );
}

/** Re-run `load` every `ms` while `active` is true (and once whenever deps change). */
export function usePolling(load: () => Promise<unknown>, active: boolean, deps: unknown[], ms = 3000) {
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    loadRef.current();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => loadRef.current(), ms);
    return () => clearInterval(t);
  }, [active, ms]);
}

/**
 * Whether any worker is running. Jobs only progress while one is, so the
 * offline state says exactly how to start one.
 */
export function WorkerStatus({ summary }: { summary: JobSummary | null }) {
  if (!summary) return null;
  const waiting = summary.counts.QUEUED + summary.counts.RETRYING;
  if (summary.workers.length > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        <Cpu className="h-4 w-4" />
        Worker đang chạy: {summary.workers.map((w) => `${w.hostname}${w.mode === 'once' ? ' (một lượt)' : ''}`).join(', ')}
        <span className="text-emerald-700">· {summary.counts.RUNNING} đang chạy · {waiting} đang chờ</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <div className="flex items-center gap-2 font-medium">
        <PowerOff className="h-4 w-4" /> Chưa có worker nào đang chạy{waiting > 0 ? ` · ${waiting} công việc đang chờ` : ''}
      </div>
      <p className="mt-1 text-amber-800">
        Công việc được giữ trong hàng đợi và sẽ chạy khi worker bật. Trên máy chạy worker, mở terminal trong thư mục dự án và chạy <code className="rounded bg-amber-100 px-1">pnpm worker</code>.
        {summary.lastSeenOffline && <> Lần cuối thấy worker: {formatDateTime(summary.lastSeenOffline.lastSeenAt)} ({summary.lastSeenOffline.hostname}).</>}
      </p>
    </div>
  );
}

/** Summary + polling for pages that show the worker banner. */
export function useJobSummary(pollMs = 5000) {
  const [summary, setSummary] = useState<JobSummary | null>(null);
  usePolling(() => jobsApi.summary().then(setSummary).catch(() => {}), true, [], pollMs);
  return summary;
}
