import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, ExternalLink, RotateCcw } from 'lucide-react';
import { jobsApi, type JobDetail, type JobEvent } from '../../lib/api';
import { Alert, Badge, Button, Card, PageHeader, Spinner, buttonClass, formatDateTime, useConfirm, useToast } from '../ui';
import { JOB_TYPE_LABELS, JobProgress, JobStatusBadge, WorkerStatus, describeJob, isActive, useJobSummary, usePolling } from './jobs-ui';

const EVENT_TONES: Record<JobEvent['level'], 'neutral' | 'amber' | 'red'> = { info: 'neutral', warn: 'amber', error: 'red' };

function duration(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60} giây`;
}

export function JobDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const summary = useJobSummary();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = () =>
    jobsApi
      .get(id)
      .then((j) => {
        setJob(j);
        setError('');
      })
      .catch((err) => setError((err as Error).message));

  usePolling(load, !!job && isActive(job.status), [id], 2000);

  const act = async (name: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(name);
    try {
      await fn();
      toast('success', success);
      await load();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy('');
    }
  };

  if (!job) return error ? <Alert>{error}</Alert> : <Spinner />;

  const result = job.result;
  const failedIds = result?.failedIds ?? [];
  const isBatch = job.type !== 'IMPORT_TITLE';
  const titleKind = (job.payload.kind as string) === 'series' ? 'series' : 'movies';
  // Refresh jobs list our own title ids, which open in the editor; imports list provider ids.
  const itemLink = (itemId: string) => (job.type === 'REFRESH_METADATA' ? `/admin/${titleKind}/${itemId}` : null);

  return (
    <>
      <Link to="/admin/jobs" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Công việc nền
      </Link>
      <PageHeader
        title={JOB_TYPE_LABELS[job.type] ?? job.type}
        description={describeJob(job)}
        actions={
          <>
            {isActive(job.status) && !job.cancelRequested && (
              <Button
                variant="danger"
                icon={<Ban className="h-4 w-4" />}
                loading={busy === 'cancel'}
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Hủy công việc?',
                    message: job.status === 'RUNNING' ? 'Công việc dừng sau mục đang xử lý. Những mục đã nhập vẫn được giữ.' : 'Công việc sẽ không chạy nữa.',
                    confirmLabel: 'Hủy công việc',
                    danger: true,
                  });
                  if (ok) act('cancel', () => jobsApi.cancel(job.id), 'Đã yêu cầu hủy.');
                }}
              >
                Hủy
              </Button>
            )}
            {(job.status === 'FAILED' || job.status === 'CANCELLED') && (
              <Button variant="primary" icon={<RotateCcw className="h-4 w-4" />} loading={busy === 'retry'} onClick={() => act('retry', () => jobsApi.retry(job.id), 'Đã đưa công việc vào hàng đợi.')}>
                Chạy lại
              </Button>
            )}
            {!isActive(job.status) && isBatch && failedIds.length > 0 && (
              <Button
                icon={<RotateCcw className="h-4 w-4" />}
                loading={busy === 'retry-failed'}
                onClick={async () => {
                  setBusy('retry-failed');
                  try {
                    const res = await jobsApi.retryFailed(job.id);
                    toast('success', res.deduplicated ? 'Đã có công việc giống vậy đang chạy.' : `Đã tạo công việc mới cho ${failedIds.length} mục lỗi.`);
                    navigate(`/admin/jobs/${res.jobId}`);
                  } catch (err) {
                    toast('error', (err as Error).message);
                  } finally {
                    setBusy('');
                  }
                }}
              >
                Chạy lại {failedIds.length} mục lỗi
              </Button>
            )}
          </>
        }
      />

      {isActive(job.status) && <div className="mb-4"><WorkerStatus summary={summary} /></div>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Tiến độ" actions={<JobStatusBadge job={job} />}>
            <JobProgress job={job} large />
            {job.error && (
              <div className="mt-3">
                <Alert tone={job.status === 'RETRYING' ? 'amber' : 'red'}>
                  {job.error}
                  {job.status === 'RETRYING' && <> · Thử lại lúc {formatDateTime(job.runAt)} (lần {job.attempts + 1}/{job.maxAttempts}).</>}
                </Alert>
              </div>
            )}
            {job.type === 'IMPORT_TITLE' && result && typeof result.id === 'string' && (
              <p className="mt-3 text-sm text-slate-700">
                {result.created ? 'Đã tạo' : 'Đã cập nhật'}{' '}
                <Link to={`/admin/${titleKind}/${result.id}`} className="font-medium text-teal-700 hover:underline">“{String(result.title)}”</Link>
              </p>
            )}
            {isBatch && result && (typeof result.created === 'number' || typeof result.updated === 'number') && (
              <p className="mt-3 text-sm text-slate-600">{result.created ?? 0} tạo mới · {result.updated ?? 0} cập nhật</p>
            )}
          </Card>

          {result?.skipped && result.skipped.length > 0 && (
            <Card title={`Bỏ qua (${job.skipped})`} padded={false}>
              <p className="px-4 pt-3 text-xs text-slate-500">
                {job.type === 'REFRESH_METADATA'
                  ? 'Tác phẩm chưa liên kết với nguồn metadata. Liên kết ở trang chỉnh sửa.'
                  : 'Trùng với nhiều tác phẩm đã có nên cần chọn thủ công. Mở trang Nhập metadata, tìm theo mã để chọn tác phẩm cần cập nhật.'}
              </p>
              <ItemList items={result.skipped.map((s) => ({ id: s.id, text: s.reason }))} link={itemLink} total={job.skipped} />
            </Card>
          )}

          {result?.failed && result.failed.length > 0 && (
            <Card title={`Lỗi (${job.failed})`} padded={false}>
              <ItemList items={result.failed.map((f) => ({ id: f.id, text: f.error, tag: f.kind }))} link={itemLink} total={job.failed} />
            </Card>
          )}

          <Card title="Nhật ký" padded={false}>
            {job.events.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">{job.status === 'QUEUED' ? 'Chưa bắt đầu.' : 'Không có sự kiện.'}</p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {job.events.map((e) => (
                  <li key={e.id} className="flex flex-wrap gap-x-3 gap-y-0.5 px-4 py-2 text-sm sm:flex-nowrap">
                    <span className="w-20 shrink-0 tabular-nums text-xs text-slate-400" title={formatDateTime(e.createdAt)}>{new Date(e.createdAt).toLocaleTimeString('vi-VN')}</span>
                    <span className="w-24 shrink-0"><Badge tone={EVENT_TONES[e.level] ?? 'neutral'}>{e.stage}</Badge></span>
                    <span className={`min-w-0 basis-full break-words sm:flex-1 sm:basis-auto ${e.level === 'error' ? 'text-red-700' : 'text-slate-700'}`}>
                      {e.message}
                      {e.durationMs != null && <span className="ml-1.5 text-xs text-slate-400">({duration(e.durationMs)})</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {job.events.length >= 100 && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">Hiển thị 100 sự kiện mới nhất.</p>}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Chi tiết">
            <dl className="space-y-2 text-sm">
              <Row label="Mã">{job.id}</Row>
              <Row label="Người tạo">{job.createdBy?.email ?? 'Hệ thống (lịch tự động)'}</Row>
              <Row label="Tạo lúc">{formatDateTime(job.createdAt)}</Row>
              {job.startedAt && <Row label="Bắt đầu">{formatDateTime(job.startedAt)}</Row>}
              {job.completedAt && <Row label="Kết thúc">{formatDateTime(job.completedAt)}</Row>}
              {job.startedAt && job.completedAt && <Row label="Thời gian">{duration(new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime())}</Row>}
              <Row label="Lần chạy">{job.attempts}/{job.maxAttempts}</Row>
              {job.lockedBy && <Row label="Worker">{job.lockedBy}</Row>}
              {job.parentId && <Row label="Công việc cha"><Link to={`/admin/jobs/${job.parentId}`} className="text-teal-700 hover:underline">mở</Link></Row>}
            </dl>
          </Card>
          <Card title="Tham số">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(job.payload, null, 2)}</pre>
          </Card>
          {job.type === 'IMPORT_MOVIES' || job.type === 'IMPORT_SERIES' ? (
            <Link to={`/admin/${job.type === 'IMPORT_SERIES' ? 'series' : 'movies'}?status=DRAFT`} className={buttonClass('secondary', 'w-full')}>
              Xem nội dung nháp <ExternalLink className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 break-all text-right text-slate-800">{children}</dd>
    </div>
  );
}

function ItemList({ items, link, total }: { items: Array<{ id: string; text: string; tag?: string }>; link: (id: string) => string | null; total: number }) {
  return (
    <>
      <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
        {items.map((item, i) => {
          const to = link(item.id);
          return (
            <li key={`${item.id}-${i}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2 text-sm">
              {to ? <Link to={to} className="font-mono text-xs text-teal-700 hover:underline">{item.id}</Link> : <span className="font-mono text-xs text-slate-800">{item.id}</span>}
              {item.tag && <Badge tone={item.tag === 'TRANSIENT' ? 'amber' : 'red'}>{item.tag === 'TRANSIENT' ? 'tạm thời' : item.tag === 'NOT_FOUND' ? 'không tồn tại' : 'lỗi'}</Badge>}
              <span className="min-w-0 flex-1 text-slate-600">{item.text}</span>
            </li>
          );
        })}
      </ul>
      {total > items.length && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">Hiển thị {items.length}/{total} mục.</p>}
    </>
  );
}
