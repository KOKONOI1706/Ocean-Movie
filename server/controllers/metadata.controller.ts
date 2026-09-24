import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';
import { apiSuccess } from '../utils/response.js';
import { auditActor } from '../services/audit.service.js';
import { getMetadataProvider, metadataProviders } from '../ingestion/metadata/registry.js';
import { importTitle, previewImport, refreshTitle } from '../ingestion/metadata/importer.js';
import { ProviderError, type MetadataKind } from '../ingestion/metadata/types.js';

/** Provider failures as HTTP errors: 404 not found, 400 missing/bad key, 503 try later, 502 bad upstream data. */
function toHttpError(err: unknown) {
  if (!(err instanceof ProviderError)) return err;
  const map = {
    NOT_FOUND: [404, 'PROVIDER_NOT_FOUND'],
    NOT_CONFIGURED: [400, 'PROVIDER_NOT_CONFIGURED'],
    TRANSIENT: [503, 'PROVIDER_UNAVAILABLE'],
    PERMANENT: [502, 'PROVIDER_ERROR'],
  } as const;
  const [status, code] = map[err.kind];
  return new AppError(err.message, status, code, { provider: err.provider });
}

function handle(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return apiSuccess(res, await fn(req));
    } catch (err) {
      next(toHttpError(err));
    }
  };
}

export const metadataController = {
  providers: handle(async () =>
    metadataProviders().map((p) => ({ key: p.key, name: p.name, idNamespace: p.idNamespace, configured: p.isConfigured() }))
  ),

  /** Search results, each marked with the title it is already imported as (if any). */
  search: handle(async (req) => {
    const { provider: key, kind, q, year } = req.query as unknown as { provider: string; kind: MetadataKind; q: string; year?: number };
    const provider = getMetadataProvider(key);
    const results = await provider.search(q, kind, year);
    const links = await prisma.externalId.findMany({
      where: {
        entityType: kind === 'movie' ? 'MOVIE' : 'SERIES',
        provider: { key: provider.idNamespace },
        externalId: { in: results.map((r) => r.externalId) },
      },
      select: {
        externalId: true,
        movie: { select: { id: true, slug: true, title: true } },
        series: { select: { id: true, slug: true, title: true } },
      },
    });
    const imported = new Map(links.map((l) => [l.externalId, l.movie ?? l.series]));
    return results.map((r) => ({ ...r, imported: imported.get(r.externalId) ?? null }));
  }),

  preview: handle((req) => previewImport(req.body.provider, req.body.kind, req.body.externalId)),

  import: handle((req) => importTitle(auditActor(req), req.body)),

  refresh: handle((req) => refreshTitle(auditActor(req), req.body.kind, req.body.id, req.body.mode)),
};
