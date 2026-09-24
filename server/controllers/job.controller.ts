import { Request, Response, NextFunction } from 'express';
import { auditActor } from '../services/audit.service.js';
import { jobAdminService } from '../services/job-admin.service.js';
import { apiPaginated, apiSuccess } from '../utils/response.js';

const IMPORT_TYPES = ['IMPORT_TITLE', 'IMPORT_MOVIES', 'IMPORT_SERIES'];

function handle(fn: (req: Request) => Promise<unknown>, status = 200) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return apiSuccess(res, await fn(req), status);
    } catch (err) {
      next(err);
    }
  };
}

function handleList(fn: (req: Request) => Promise<{ items: unknown[]; pagination: Parameters<typeof apiPaginated>[2] }>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, pagination } = await fn(req);
      return apiPaginated(res, items, pagination);
    } catch (err) {
      next(err);
    }
  };
}

export const jobController = {
  // Enqueue: 202 Accepted with the job id; the work happens in the worker.
  batchImport: handle((req) => {
    const { kind, ...payload } = req.body;
    return jobAdminService.enqueueBatchImport(auditActor(req), kind, payload);
  }, 202),
  titleImport: handle((req) => jobAdminService.enqueueTitleImport(auditActor(req), req.body), 202),
  refresh: handle((req) => jobAdminService.enqueueRefresh(auditActor(req), req.body), 202),

  list: handleList((req) => {
    const q = req.query as any;
    return jobAdminService.list({ ...q, types: q.group === 'imports' ? IMPORT_TYPES : undefined });
  }),
  summary: handle(() => jobAdminService.summary()),
  get: handle((req) => jobAdminService.get(req.params.id)),
  events: handleList((req) => jobAdminService.events(req.params.id, (req.query as any).page, (req.query as any).limit)),
  cancel: handle((req) => jobAdminService.cancel(auditActor(req), req.params.id)),
  retry: handle((req) => jobAdminService.retry(auditActor(req), req.params.id)),
  retryFailed: handle((req) => jobAdminService.retryFailedItems(auditActor(req), req.params.id), 202),
  bulkRetry: handle((req) => jobAdminService.bulkRetry(auditActor(req), req.body.ids)),
};
