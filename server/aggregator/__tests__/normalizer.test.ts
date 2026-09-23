import { describe, it, expect } from 'vitest';
import { parseEpisodeTitle, slugify, stripDiacritics } from '../normalizer.js';

describe('slugify', () => {
  it('strips Vietnamese diacritics including đ', () => {
    expect(slugify('Ngọa Hổ Tàng Long')).toBe('ngoa-ho-tang-long');
    expect(slugify('Đường Về Nhà')).toBe('duong-ve-nha');
    expect(stripDiacritics('Tập')).toBe('Tap');
  });

  it('collapses punctuation', () => {
    expect(slugify('Crouching Tiger, Hidden Dragon')).toBe('crouching-tiger-hidden-dragon');
    expect(slugify("Grey's Anatomy & Friends")).toBe('greys-anatomy-and-friends');
  });

  it('keeps non-latin scripts', () => {
    expect(slugify('卧虎藏龙')).toBe('卧虎藏龙');
  });
});

describe('parseEpisodeTitle', () => {
  const cases: Array<[string, { base: string; season: number; ep: number; epTitle?: string }]> = [
    ['Crouching Tiger, Hidden Dragon - Ep 1', { base: 'Crouching Tiger, Hidden Dragon', season: 1, ep: 1 }],
    ['Crouching Tiger, Hidden Dragon - Ep 2 [1080p]', { base: 'Crouching Tiger, Hidden Dragon', season: 1, ep: 2 }],
    ['Crouching Tiger Hidden Dragon Episode 03 (HD)', { base: 'Crouching Tiger Hidden Dragon', season: 1, ep: 3 }],
    ['Ngọa Hổ Tàng Long Tập 02 Vietsub', { base: 'Ngọa Hổ Tàng Long', season: 1, ep: 2 }],
    ['Ngọa Hổ Tàng Long - Tập 12 END', { base: 'Ngọa Hổ Tàng Long', season: 1, ep: 12 }],
    ['[Vietsub] Ngọa Hổ Tàng Long Tap 7 Thuyết Minh', { base: 'Ngọa Hổ Tàng Long', season: 1, ep: 7 }],
    ['Dark.S02E05.720p.WEB.x264', { base: 'Dark', season: 2, ep: 5 }],
    ['Dark S03E08 - Deja-vu', { base: 'Dark', season: 3, ep: 8, epTitle: 'Deja-vu' }],
    ['Dark 1x04', { base: 'Dark', season: 1, ep: 4 }],
    ['Dark Season 2 Episode 6', { base: 'Dark', season: 2, ep: 6 }],
    ['Dark Season 2 - Ep 6', { base: 'Dark', season: 2, ep: 6 }],
    ['Hậu Duệ Mặt Trời Phần 2 Tập 3', { base: 'Hậu Duệ Mặt Trời', season: 2, ep: 3 }],
    ['卧虎藏龙 第3集', { base: '卧虎藏龙', season: 1, ep: 3 }],
    ['卧虎藏龙 12集', { base: '卧虎藏龙', season: 1, ep: 12 }],
    ['Frieren EP.12 END', { base: 'Frieren', season: 1, ep: 12 }],
    ['Frieren - 05', { base: 'Frieren', season: 1, ep: 5 }],
    ['Frieren 05', { base: 'Frieren', season: 1, ep: 5 }],
    ['Frieren #9', { base: 'Frieren', season: 1, ep: 9 }],
    ['Shogun (2024) - Episode 4: The Eightfold Fence', { base: 'Shogun', season: 1, ep: 4, epTitle: 'The Eightfold Fence' }],
    ['The End Game - Ep 1', { base: 'The End Game', season: 1, ep: 1 }],
    ['Show Name - Ep 5: The End', { base: 'Show Name', season: 1, ep: 5, epTitle: 'The End' }],
    ['Tom &amp; Jerry Ep 3', { base: 'Tom & Jerry', season: 1, ep: 3 }],
  ];

  it.each(cases)('%s', (raw, expected) => {
    const parsed = parseEpisodeTitle(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.baseTitle).toBe(expected.base);
    expect(parsed!.seasonNumber).toBe(expected.season);
    expect(parsed!.episodeNumber).toBe(expected.ep);
    expect(parsed!.episodeTitle).toBe(expected.epTitle);
    expect(parsed!.slug).toBe(slugify(expected.base));
    expect(parsed!.normalizedTitle).toBe(parsed!.slug);
  });

  it('groups differently formatted titles under the same key', () => {
    const keys = [
      'Crouching Tiger, Hidden Dragon - Ep 1',
      'CROUCHING TIGER HIDDEN DRAGON Episode 2',
      'crouching tiger hidden dragon tap 3 vietsub',
    ].map((t) => parseEpisodeTitle(t)!.normalizedTitle);
    expect(new Set(keys).size).toBe(1);
  });

  it('does not mistake a year for an episode number', () => {
    expect(parseEpisodeTitle('Blade Runner 2049')).toBeNull();
    expect(parseEpisodeTitle('Dune - 2021')).toBeNull();
  });

  it('returns null when there is no episode marker', () => {
    expect(parseEpisodeTitle('Interstellar')).toBeNull();
    expect(parseEpisodeTitle('')).toBeNull();
    expect(parseEpisodeTitle('   ')).toBeNull();
  });
});
