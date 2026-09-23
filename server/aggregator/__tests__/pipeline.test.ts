import { describe, it, expect } from 'vitest';
import { normalizeItems } from '../aggregator.service.js';
import { isHostAllowed, isPrivateAddress } from '../http.js';
import { extractPageMeta, extractStreamCandidates, resolvePageStream } from '../sources/html.source.js';
import { detectStreamType } from '../stream.js';

describe('detectStreamType', () => {
  it('classifies playable URLs', () => {
    expect(detectStreamType('https://cdn.example.com/show/ep1/index.m3u8')).toBe('HLS');
    expect(detectStreamType('https://cdn.example.com/show/ep1/index.m3u8?token=abc')).toBe('HLS');
    expect(detectStreamType('https://cdn.example.com/ep1.mp4')).toBe('FILE');
    expect(detectStreamType('https://player.example.com/embed/xyz')).toBe('EMBED');
  });
});

describe('extractStreamCandidates', () => {
  const page = `
    <html><head>
      <title>Ngọa Hổ Tàng Long Tập 4 Vietsub</title>
      <meta property="og:image" content="https://img.example.com/ep4.jpg">
    </head><body>
      <iframe src="//player.example.com/embed/ep4"></iframe>
      <video><source src="/media/ep4.mp4"></video>
      <script>var cfg = {"file":"https:\\/\\/cdn.example.com\\/hls\\/ep4\\/master.m3u8"};</script>
    </body></html>`;

  it('finds HLS, file and embed sources, best first', () => {
    const candidates = extractStreamCandidates(page, 'https://site.example.com/watch/ep4');
    expect(candidates[0]).toBe('https://cdn.example.com/hls/ep4/master.m3u8');
    expect(candidates).toContain('https://site.example.com/media/ep4.mp4');
    expect(candidates).toContain('https://player.example.com/embed/ep4');
    expect(candidates.map(detectStreamType)).toEqual(['HLS', 'FILE', 'EMBED']);
  });

  it('reads page metadata', () => {
    const meta = extractPageMeta(page);
    expect(meta.title).toBe('Ngọa Hổ Tàng Long Tập 4 Vietsub');
    expect(meta.thumbnailUrl).toBe('https://img.example.com/ep4.jpg');
  });

  it('never picks sign-in, consent, analytics or social iframes', () => {
    const html = `
      <iframe src="https://accounts.google.com/ServiceLogin?service=youtube&amp;passive=true"></iframe>
      <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-1"></iframe>
      <iframe src="https://www.facebook.com/plugins/like.php?href=x"></iframe>
      <iframe src="https://www.google.com/recaptcha/api2/anchor?k=1"></iframe>
      <iframe src="https://player.example.com/embed/ep9"></iframe>`;
    expect(extractStreamCandidates(html, 'https://site.example.com/watch/9')).toEqual(['https://player.example.com/embed/ep9']);
  });

  it('rewrites embedded video-site page links to their embed form', () => {
    const html = '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>';
    expect(extractStreamCandidates(html, 'https://site.example.com/x')).toEqual(['https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0']);
  });

  it('uses the video itself when the crawled page is a YouTube/Vimeo watch page', () => {
    // A real YouTube watch page carries a hidden Google sign-in iframe.
    const youtubeWatchHtml = '<meta property="og:title" content="Some Video"><iframe src="https://accounts.google.com/ServiceLogin?service=youtube"></iframe>';
    expect(resolvePageStream('https://www.youtube.com/watch?v=YdBY9EIsrpk', youtubeWatchHtml)).toBe(
      'https://www.youtube.com/embed/YdBY9EIsrpk?rel=0'
    );
    expect(resolvePageStream('https://vimeo.com/76979871', '')).toBe('https://player.vimeo.com/video/76979871');
    expect(resolvePageStream('https://site.example.com/p', '<video src="/a.mp4"></video>')).toBe('https://site.example.com/a.mp4');
  });

  it('ignores non-http sources', () => {
    expect(extractStreamCandidates('<iframe src="javascript:alert(1)"></iframe>', 'https://a.example.com')).toEqual([]);
  });
});

describe('normalizeItems', () => {
  it('groups fragmented links into one ordered series and keeps the best stream per episode', () => {
    const { groups, skipped } = normalizeItems([
      { title: 'Crouching Tiger, Hidden Dragon - Ep 2', streamUrl: 'https://p.example.com/embed/2' },
      { title: 'CROUCHING TIGER HIDDEN DRAGON Episode 1 [HD]', streamUrl: 'https://p.example.com/embed/1' },
      { title: 'Crouching Tiger Hidden Dragon Tập 2', streamUrl: 'https://cdn.example.com/2/index.m3u8' },
      { title: 'Crouching Tiger Hidden Dragon Ep 2', streamUrl: 'https://p.example.com/embed/2b' },
      { title: 'Some Random Trailer', streamUrl: 'https://p.example.com/embed/x' },
    ]);

    expect(groups).toHaveLength(1);
    const [group] = groups;
    expect(group.normalizedTitle).toBe('crouching-tiger-hidden-dragon');
    expect(group.episodes.map((e) => e.episodeNumber)).toEqual([1, 2]);
    expect(group.episodes[1].streamType).toBe('HLS');
    expect(group.episodes[1].item.streamUrl).toBe('https://cdn.example.com/2/index.m3u8');
    expect(skipped.map((s) => s.title)).toContain('Some Random Trailer');
    expect(skipped).toHaveLength(3);
  });
});

describe('SSRF guard', () => {
  it('rejects private and loopback ranges', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });

  it('allows any host when no allowlist is configured', () => {
    expect(isHostAllowed('anything.example.com')).toBe(true);
  });
});
