import { z } from 'zod';
import { importBatchPayload, importTitlePayload, refreshPayload } from '../jobs/payloads.js';

export const batchImportBodySchema = z.intersection(z.object({ kind: z.enum(['movie', 'series']) }), importBatchPayload);
export const titleImportBodySchema = importTitlePayload;
export const refreshBodySchema = refreshPayload;

export const jobListQuerySchema = z.object({
  status: z.enum(['QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'RETRYING']).optional(),
  type: z.string().trim().max(40).optional(),
  /** "imports" = all import job types. */
  group: z.enum(['imports']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const eventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const bulkRetrySchema = z.object({ ids: z.array(z.string().min(1).max(100)).min(1).max(200) });
