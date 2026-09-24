import https from 'node:https';
import { Resolver } from 'node:dns/promises';
import { ProviderError } from './types.js';

/** The subset of `fetch` the providers use; tests pass a fake. */
export interface FetchResponse {
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}
export type Fetcher = (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<FetchResponse>;

export interface ProviderHttpOptions {
  fetch?: Fetcher;
  /** Retries after the first attempt, for transient failures only. */
  retries?: number;
  timeoutMs?: number;
  /** Injected so tests do not wait on real backoff. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * GET a provider JSON endpoint.
 * - 404 → NOT_FOUND, 401/403 → NOT_CONFIGURED (bad key), other 4xx → PERMANENT
 * - 429, 5xx, timeouts and network errors → TRANSIENT, retried with
 *   exponential backoff (honouring Retry-After), then thrown
 * `label` is what appears in errors: never the URL, which may carry an API key.
 */
export async function getJson(provider: string, url: string, label: string, headers: Record<string, string>, opts: ProviderHttpOptions = {}) {
  const fetcher = opts.fetch ?? (globalThis.fetch as unknown as Fetcher);
  const retries = opts.retries ?? 2;
  const sleep = opts.sleep ?? defaultSleep;

  for (let attempt = 0; ; attempt++) {
    let res: FetchResponse;
    try {
      res = await fetcher(url, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000) });
    } catch (err) {
      if (attempt < retries) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      throw new ProviderError(provider, 'TRANSIENT', `${provider} không phản hồi (${label}): ${(err as Error).message}`);
    }

    if (res.status >= 200 && res.status < 300) {
      try {
        return await res.json();
      } catch {
        throw new ProviderError(provider, 'PERMANENT', `${provider} trả về dữ liệu không đọc được (${label})`, res.status);
      }
    }
    if (res.status === 404) throw new ProviderError(provider, 'NOT_FOUND', `${provider}: không tìm thấy (${label})`, 404);
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError(provider, 'NOT_CONFIGURED', `${provider} từ chối khóa API (${res.status})`, res.status);
    }
    const transient = res.status === 429 || res.status >= 500;
    if (!transient) throw new ProviderError(provider, 'PERMANENT', `${provider} trả về lỗi ${res.status} (${label})`, res.status);
    if (attempt < retries) {
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 500 * 2 ** attempt);
      continue;
    }
    throw new ProviderError(provider, 'TRANSIENT', `${provider} tạm thời không khả dụng (${res.status}, ${label})`, res.status);
  }
}

/**
 * Fetch that resolves hostnames through public DNS (8.8.8.8 / 1.1.1.1) and
 * connects by IP with the right TLS SNI, for networks whose DNS blocks
 * themoviedb.org. Enabled with METADATA_PUBLIC_DNS=true; certificates are
 * still validated against the real hostname.
 */
export function publicDnsFetcher(): Fetcher {
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
  const ips = new Map<string, string>();

  return async (url, init) => {
    const u = new URL(url);
    let ip = ips.get(u.hostname);
    if (!ip) {
      ip = (await resolver.resolve4(u.hostname))[0];
      ips.set(u.hostname, ip);
    }
    return new Promise<FetchResponse>((resolve, reject) => {
      const req = https.request(
        {
          hostname: ip,
          servername: u.hostname,
          port: 443,
          path: u.pathname + u.search,
          method: 'GET',
          headers: { ...init.headers, Host: u.hostname },
          signal: init.signal,
        },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () =>
            resolve({
              status: res.statusCode ?? 0,
              headers: { get: (name) => (res.headers[name.toLowerCase()] as string | undefined) ?? null },
              json: async () => JSON.parse(body),
            })
          );
        }
      );
      req.on('error', reject);
      req.end();
    });
  };
}
