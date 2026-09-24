import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, RotateCcw } from 'lucide-react';
import { jobsApi, type JobRow, type JobStatus } from '../../lib/api';
import { Alert, Button, Card, EmptyState, PageHeader, Pagination, TableSkeleton, formatDateTime, selectClass, useToast } from '../ui';
import { JOB_TYPE_LABELS, JobProgress, JobStatusBadge, WorkerStatus, describeJob, isActive, useJobSummary, usePolling } from './jobs-ui';

const TABS: Array<{ value: JobStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'RUNNING', label: 'Đang chạy' },
  { value: 'QUEUED', label: 'Đang chờ' },
  { value: 'RETRYING', label: 'Sẽ thử lại' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'SUCCESS', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const PAGE_SIZE = 25;

/** Table of jobs; `group="imports"` limits it to import jobs (used on the imports page too). */
export function JobsTable({ group, status, emptyText }: { group?: 'imports'; status?: JobStatus | ''; emptyText: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<JobRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const load = () =>
    jobsApi
      .list({ group, status: status || undefined, type: type || undefined, page, limit: PAGE_SIZE })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setTotalPages(Math.max(1, pagination.totalPages));
        setError('');
      })
      .catch((err) => setError((err as Error).message));

  // Poll while anything visible is still moving.
  usePolling(load, !!rows?.some((r) => isActive(r.status)), [group, status, type, page]);

  const failedOnPage = rows?.filter((r) => r.status === 'FAILED') ?? [];

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        {!group && (
          <select aria-label="Loại công việc" className={selectClass} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">Mọi loại</option>
            {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        {failedOnPage.length > 0 && (
          <Button
            className="ml-auto"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={async () => {
              try {
                const res = await jobsApi.bulkRetry(failedOnPage.map((r) => r.id));
                toast('success', `Đã đưa ${res.retried} công việc thất bại vào hàng đợi.`);
                load();
              } catch (err) {
                toast('error', (err as Error).message);
              }
            }}
          >
            Chạy lại {failedOnPage.length} công việc lỗi
          </Button>
        )}
      </div>
      {error && <div className="p-4"><Alert>{error}</Alert></div>}
      {!rows ? (
        <TableSkeleton cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-5 w-5" />} title={emptyText} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Công việc</th>
                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                <th className="w-64 px-4 py-2 text-left font-medium">Tiến độ</th>
                <th className="px-4 py-2 text-left font-medium">Tạo lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((job) => (
                <tr key={job.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{JOB_TYPE_LABELS[job.type] ?? job.type}</div>
                    <div className="text-xs text-slate-500">{describeJob(job)}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <JobStatusBadge job={job} />
                    {job.status === 'RETRYING' && <div className="mt-0.5 text-[11px] text-slate-500">lúc {formatDateTime(job.runAt)}</div>}
                  </td>
                  <td className="px-4 py-2.5"><JobProgress job={job} /></td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {formatDateTime(job.createdAt)}
                    <div className="text-[11px] text-slate-400">{job.createdBy?.email ?? 'Hệ thống (lịch tự động)'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination total={total} page={page} totalPages={totalPages} onPage={setPage} unit="công việc" />
    </Card>
  );
}

export function JobsPage() {
  const summary = useJobSummary();
  const [status, setStatus] = useState<JobStatus | ''>('');
  return (
    <>
      <PageHeader title="Công việc nền" description="Nhập hàng loạt, làm mới metadata và các việc chạy nền khác. Trang tự cập nhật khi có việc đang chạy." />
      <div className="mb-4"><WorkerStatus summary={summary} /></div>
      <div className="mb-3 flex flex-wrap gap-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={status === t.value}
            onClick={() => setStatus(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer ${status === t.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t.label}
            {t.value && summary && summary.counts[t.value] > 0 && <span className="ml-1.5 tabular-nums opacity-70">{summary.counts[t.value]}</span>}
          </button>
        ))}
      </div>
      <React.Fragment key={status}><JobsTable status={status} emptyText="Không có công việc nào" /></React.Fragment>
    </>
  );
}
