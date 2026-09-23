import { describe, it, expect } from 'vitest';
import { toEmbedUrl } from '../embed';

describe('toEmbedUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42', 'https://www.youtube.com/embed/dQw4w9WgXcQ?start=42&rel=0'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'],
    ['https://youtu.be/dQw4w9WgXcQ?t=10', 'https://www.youtube.com/embed/dQw4w9WgXcQ?start=10&rel=0'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'],
    ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871'],
    ['https://vimeo.com/channels/staffpicks/76979871', 'https://player.vimeo.com/video/76979871'],
    ['https://www.dailymotion.com/video/x8abcd1_some-title', 'https://www.dailymotion.com/embed/video/x8abcd1'],
    ['https://dai.ly/x8abcd1', 'https://www.dailymotion.com/embed/video/x8abcd1'],
  ])('%s', (input, expected) => {
    expect(toEmbedUrl(input)).toBe(expected);
  });

  it('leaves other URLs alone', () => {
    for (const url of [
      'https://cdn.example.com/show/index.m3u8',
      'https://player.example.com/embed/abc',
      'https://www.youtube.com/@somechannel',
      'https://www.youtube.com/',
      'not a url',
    ]) {
      expect(toEmbedUrl(url)).toBe(url);
    }
  });
});
