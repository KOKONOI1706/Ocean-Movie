/**
 * Video-site page URLs can't be framed (YouTube, Vimeo and Dailymotion send
 * X-Frame-Options / CSP frame-ancestors on their normal pages). Only their
 * dedicated embed URLs work inside an <iframe>, so rewrite known page URLs
 * to the embed form. Unknown URLs are returned unchanged.
 *
 * Shared by the server (normalise at ingest) and the player (fix rows that
 * were stored before this existed).
 */

const YOUTUBE_ID = /^[\w-]{11}$/;

export function toEmbedUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '').toLowerCase();

  // YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /live/ID, /embed/ID
  let youtubeId: string | null = null;
  if (host === 'youtu.be') youtubeId = url.pathname.split('/')[1] || null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    const [, first, second] = url.pathname.split('/');
    if (first === 'watch') youtubeId = url.searchParams.get('v');
    else if (['shorts', 'live', 'embed', 'v'].includes(first)) youtubeId = second || null;
  }
  if (youtubeId && YOUTUBE_ID.test(youtubeId)) {
    const embed = new URL(`https://www.youtube.com/embed/${youtubeId}`);
    const start = url.searchParams.get('t') || url.searchParams.get('start');
    const seconds = start ? parseInt(start, 10) : NaN;
    if (Number.isFinite(seconds) && seconds > 0) embed.searchParams.set('start', String(seconds));
    embed.searchParams.set('rel', '0');
    return embed.toString();
  }

  // Vimeo: vimeo.com/ID (optionally /channels/x/ID) → player.vimeo.com/video/ID
  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).find((p) => /^\d+$/.test(p));
    if (id) return `https://player.vimeo.com/video/${id}`;
  }

  // Dailymotion: /video/ID or dai.ly/ID → /embed/video/ID
  if (host === 'dailymotion.com' && url.pathname.startsWith('/video/')) {
    const id = url.pathname.split('/')[2]?.split('_')[0];
    if (id) return `https://www.dailymotion.com/embed/video/${id}`;
  }
  if (host === 'dai.ly') {
    const id = url.pathname.split('/')[1];
    if (id) return `https://www.dailymotion.com/embed/video/${id}`;
  }

  return raw;
}
