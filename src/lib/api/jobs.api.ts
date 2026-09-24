import { apiClient, unwrap } from './client.js';
import type { MergeMode, MetadataKind } from './metadata.api.js';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'RETRYING';
export type JobType = 'IMPORT_TITLE' | 'IMPORT_MOVIES' | 'IMPORT_SERIES' | 'REFRESH_METADATA' | string;

export interface JobRow {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  progress: number;
  processed: number;
  succeeded: number;
  skipped: number;
  failed: number;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  errorKind: string | null;
  cancelRequested: boolean;
  runAt: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  payload: Record<string, unknown>;
  parentId: string | null;
  createdBy: { id: string; email: string; displayName: string } | null;
}

export interface JobEvent {
  id: string;
  stage: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data: Record<string, unknown> | null;
  durationMs: number | null;
  createdAt: string;
}

export interface JobResult {
  created?: number;
  updated?: number;
  skipped?: Array<{ id: string; reason: string }>;
  failed?: Array<{ id: string; error: string; kind: string }>;
  failedIds?: string[];
  [key: string]: unknown;
}

export interface JobDetail extends JobRow {
  result: JobResult | null;
  lockedBy: string | null;
  events: JobEvent[];
  children: Partial<Record<JobStatus, number>>;
}

export interface WorkerInfo {
  id: string;
  hostname: string;
  pid: number;
  mode: string;
  startedAt: string;
  lastSeenAt: string;
  currentJobId: string | null;
}

export interface JobSummary {
  counts: Record<JobStatus, number>;
  workers: WorkerInfo[];
  lastSeenOffline: { lastSeenAt: string; hostname: string } | null;
}

export interface EnqueueResult {
  jobId: string;
  status: JobStatus;
  deduplicated: boolean;
}

export interface BatchImportRequest {
  kind: MetadataKind;
  provider: string;
  externalIds?: string[];
  query?: string;
  year?: number;
  pages?: { from: number; to: number };
  maxItems?: number;
  mode?: MergeMode;
  publish?: boolean;
}

export const jobsApi = {
  list: async (params: { status?: JobStatus; type?: string; group?: 'imports'; page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<JobRow[]>('/admin/jobs', params);
    return { items: unwrap(res), pagination: res.pagination! };
  },
  summary: async () => unwrap(await apiClient.get<JobSummary>('/admin/jobs/summary')),
  get: async (id: string) => unwrap(await apiClient.get<JobDetail>(`/admin/jobs/${id}`)),
  cancel: async (id: string) => unwrap(await apiClient.post<JobRow>(`/admin/jobs/${id}/cancel`)),
  retry: async (id: string) => unwrap(await apiClient.post<JobRow>(`/admin/jobs/${id}/retry`)),
  retryFailed: async (id: string) => unwrap(await apiClient.post<EnqueueResult>(`/admin/jobs/${id}/retry-failed`)),
  bulkRetry: async (ids: string[]) => unwrap(await apiClient.post<{ retried: number; errors: Array<{ id: string; error: string }> }>('/admin/jobs/bulk-retry', { ids })),

  batchImport: async (req: BatchImportRequest) => unwrap(await apiClient.post<EnqueueResult>('/admin/imports', req)),
  titleImport: async (req: { provider: string; kind: MetadataKind; externalId: string; target?: string; mode?: MergeMode; publish?: boolean; seasons?: number[] }) =>
    unwrap(await apiClient.post<EnqueueResult>('/admin/imports/title', req)),
  refreshMetadata: async (kind: MetadataKind, ids: string[], mode: MergeMode = 'fill-empty') =>
    unwrap(await apiClient.post<EnqueueResult>('/admin/metadata/refresh-bulk', { kind, ids, mode })),
};
