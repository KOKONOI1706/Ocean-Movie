import type { StreamType } from '@prisma/client';

const FILE_EXTENSIONS = /\.(mp4|m4v|webm|ogv|ogg|mov)$/i;

/** Returns the URL if it is an absolute http(s) URL, otherwise null. */
export function toHttpUrl(value: string | undefined | null, base?: string): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim(), base);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** Classify a playable URL: HLS playlist, progressive file, or an embeddable player page. */
export function detectStreamType(streamUrl: string): StreamType {
  const url = toHttpUrl(streamUrl);
  const path = url ? url.pathname : streamUrl;
  if (/\.m3u8$/i.test(path) || /[?&](format|type)=m3u8/i.test(url?.search || '')) return 'HLS';
  if (FILE_EXTENSIONS.test(path)) return 'FILE';
  return 'EMBED';
}

/** Lower is better: direct playback beats a third-party embed. */
export const STREAM_TYPE_RANK: Record<StreamType, number> = { HLS: 0, FILE: 1, EMBED: 2 };
