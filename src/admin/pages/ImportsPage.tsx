import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudDownload } from 'lucide-react';
import { jobsApi, metadataApi, type BatchImportRequest, type MergeMode, type MetadataKind, type MetadataProviderInfo } from '../../lib/api';
import { Alert, Button, Card, PageHeader, Spinner, inputClass, labelClass, selectClass, useToast } from '../ui';
import { WorkerStatus, useJobSummary } from './jobs-ui';
import { JobsTable } from './JobsPage';

type Source = 'query' | 'ids';

/** Split a pasted list on commas, whitespace and newlines; drop duplicates. */
export function parseIdList(text: string) {
  return [...new Set(text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))];
}

/**
 * Bulk metadata import. The request only queues a job; the worker does the
 * provider calls, so hundreds of titles never hold an HTTP request open.
 */
export function ImportsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const summary = useJobSummary();
  const [providers, setProviders] = useState<MetadataProviderInfo[] | null>(null);
  const [provider, setProvider] = useState('');
  const [kind, setKind] = useState<MetadataKind>('movie');
  const [source, setSource] = useState<Source>('query');
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [pageFrom, setPageFrom] = useState('1');
  const [pageTo, setPageTo] = useState('5');
  const [maxItems, setMaxItems] = useState('100');
  const [idText, setIdText] = useState('');
  const [mode, setMode] = useState<MergeMode>('fill-empty');
  const [publish, setPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    metadataApi
      .providers()
      .then((list) => {
        setProviders(list);
        setProvider(list.find((p) => p.configured)?.key ?? '');
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  if (!providers) return error ? <Alert>{error}</Alert> : <Spinner />;
  const current = providers.find((p) => p.key === provider);
  const ids = parseIdList(idText);
  const from = Number(pageFrom);
  const to = Number(pageTo);
  const pagesInvalid = source === 'query' && (!(from >= 1) || !(to >= from) || to - from >= 50);
  const canSubmit = !!provider && (source === 'query' ? !!query.trim() && !pagesInvalid && Number(maxItems) >= 1 : ids.length > 0 && ids.length <= 1000);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    const req: BatchImportRequest =
      source === 'query'
        ? { kind, provider, query: query.trim(), ...(year ? { year: Number(year) } : {}), pages: { from, to }, maxItems: Math.min(1000, Number(maxItems)), mode, publish }
        : { kind, provider, externalIds: ids, maxItems: ids.length, mode, publish };
    try {
      const res = await jobsApi.batchImport(req);
      toast('success', res.deduplicated ? 'Yêu cầu giống vậy đang chạy; mở công việc đó.' : 'Đã xếp hàng nhập hàng loạt.');
      navigate(`/admin/jobs/${res.jobId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Nhập hàng loạt"
        description="Nhập metadata nhiều tác phẩm từ API chính thức (TMDB, OMDb). Chạy nền trên worker; nội dung mới ở dạng nháp trừ khi chọn xuất bản."
      />
      <div className="mb-4"><WorkerStatus summary={summary} /></div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label>
              <span className={labelClass}>Nguồn</span>
              <select className={selectClass} value={provider} onChange={(e) => setProvider(e.target.value)}>
                {providers.map((p) => (
                  <option key={p.key} value={p.key} disabled={!p.configured}>
                    {p.name}{p.configured ? '' : ' (chưa cấu hình)'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Loại</span>
              <select className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as MetadataKind)}>
                <option value="movie">Phim lẻ</option>
                <option value="series">Series</option>
              </select>
            </label>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5" role="tablist" aria-label="Cách chọn">
              {([['query', 'Theo từ khóa'], ['ids', 'Theo danh sách mã']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={source === value}
                  onClick={() => setSource(value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer ${source === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!providers.some((p) => p.configured) && (
            <Alert tone="amber">Chưa cấu hình nguồn nào. Thêm <code>TMDB_API_TOKEN</code> hoặc <code>OMDB_API_KEY</code> vào biến môi trường (của máy chủ và của máy chạy worker).</Alert>
          )}

          {source === 'query' ? (
            <div className="grid gap-3 sm:grid-cols-6">
              <label className="sm:col-span-3">
                <span className={labelClass}>Từ khóa</span>
                <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="VD: Studio Ghibli, Star Trek…" />
              </label>
              <label>
                <span className={labelClass}>Năm (tùy chọn)</span>
                <input type="number" className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Trang kết quả</span>
                <div className="flex items-center gap-1">
                  <input aria-label="Từ trang" type="number" min={1} className={inputClass} value={pageFrom} onChange={(e) => setPageFrom(e.target.value)} />
                  <span className="text-slate-400">–</span>
                  <input aria-label="Đến trang" type="number" min={1} className={inputClass} value={pageTo} onChange={(e) => setPageTo(e.target.value)} />
                </div>
              </label>
              <label>
                <span className={labelClass}>Tối đa</span>
                <input type="number" min={1} max={1000} className={inputClass} value={maxItems} onChange={(e) => setMaxItems(e.target.value)} />
              </label>
              {pagesInvalid && <p className="text-xs text-red-600 sm:col-span-6">Khoảng trang không hợp lệ (tối đa 50 trang mỗi lần).</p>}
            </div>
          ) : (
            <label className="block">
              <span className={labelClass}>
                {current?.idNamespace === 'imdb' ? 'Mã IMDb (tt…)' : 'Mã TMDB (số)'}, cách nhau bởi dấu phẩy hoặc xuống dòng
              </span>
              <textarea className={`${inputClass} h-28 font-mono`} value={idText} onChange={(e) => setIdText(e.target.value)} placeholder={current?.idNamespace === 'imdb' ? 'tt0133093\ntt0234215' : '603\n604'} />
              <span className={`mt-1 block text-xs ${ids.length > 1000 ? 'text-red-600' : 'text-slate-500'}`}>{ids.length} mã{ids.length > 1000 ? ' (tối đa 1000)' : ''}</span>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Tác phẩm đã có:</span>
              <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as MergeMode)}>
                <option value="fill-empty">Chỉ điền trường trống</option>
                <option value="replace">Ghi đè bằng dữ liệu nguồn</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Xuất bản ngay nội dung mới tạo
            </label>
            <Button type="submit" variant="primary" className="ml-auto" icon={<CloudDownload className="h-4 w-4" />} loading={submitting} disabled={!canSubmit}>
              Bắt đầu nhập
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Tác phẩm trùng nhiều kết quả sẽ được bỏ qua để bạn chọn thủ công; mã không tồn tại được ghi là lỗi và có thể chạy lại riêng.
          </p>
          {error && <Alert>{error}</Alert>}
        </form>
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-900">Lịch sử nhập</h2>
      <JobsTable group="imports" emptyText="Chưa có lần nhập nào" />
    </>
  );
}
