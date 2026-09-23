import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { env } from '../config/env.js';
import { ValidationError } from '../utils/errors.js';
import { toHttpUrl } from './stream.js';

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 15_000;
const MAX_BYTES = 5 * 1024 * 1024;
const USER_AGENT = 'OceanMovieAggregator/1.0 (+https://github.com/KOKONOI1706/Ocean-Movie)';

/** True for loopback, private, link-local, CGNAT, multicast and other non-public ranges. */
export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb') ||
      lower.startsWith('ff')
    );
  }
  return true;
}

function allowedHosts(): string[] {
  return env.AGGREGATOR_ALLOWED_HOSTS.split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function isHostAllowed(hostname: string): boolean {
  const hosts = allowedHosts();
  if (hosts.length === 0) return true;
  const host = hostname.toLowerCase();
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

async function assertPublicTarget(url: URL) {
  if (!isHostAllowed(url.hostname)) {
    throw new ValidationError(`Nguồn "${url.hostname}" không nằm trong danh sách AGGREGATOR_ALLOWED_HOSTS`);
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new ValidationError(`Không cho phép truy cập địa chỉ nội bộ: ${url.hostname}`);
  }
}

/**
 * Fetch a remote page for scraping. Only public http(s) targets are allowed,
 * redirects are re-validated on every hop, and the body is size-capped.
 */
export async function safeFetchText(rawUrl: string): Promise<{ url: string; body: string; contentType: string }> {
  let url = toHttpUrl(rawUrl);
  if (!url) throw new ValidationError(`URL không hợp lệ: ${rawUrl}`);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicTarget(url);

    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/json;q=0.9,*/*;q=0.5' },
    });

    if (res.status >= 300 && res.status < 400) {
      const next = toHttpUrl(res.headers.get('location'), url.toString());
      if (!next) throw new ValidationError(`Chuyển hướng không hợp lệ từ ${url}`);
      url = next;
      continue;
    }
    if (!res.ok) throw new ValidationError(`Nguồn trả về lỗi ${res.status}: ${url}`);

    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > MAX_BYTES) throw new ValidationError(`Trang quá lớn (${declared} bytes): ${url}`);

    const body = await readCapped(res);
    return { url: url.toString(), body, contentType: res.headers.get('content-type') || '' };
  }

  throw new ValidationError(`Quá nhiều lần chuyển hướng: ${rawUrl}`);
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new ValidationError('Trang vượt quá giới hạn kích thước cho phép');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
