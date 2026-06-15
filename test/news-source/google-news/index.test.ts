import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { googleNewsSource } from '../../../src/news-source/google-news/index.js';

const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Breaking News - CNN</title>
      <link>https://news.google.com/rss/articles/test123</link>
      <guid isPermaLink="false">test123</guid>
      <pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate>
      <description>Breaking news description.</description>
      <source url="https://cnn.com">CNN</source>
    </item>
  </channel>
</rss>`;

describe('googleNewsSource', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(mockRSS, { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "google-news"', () => {
    expect(googleNewsSource.name).toBe('google-news');
  });

  it('should have a description', () => {
    expect(googleNewsSource.description).toBeTruthy();
  });

  describe('listCategories', () => {
    it('should return category keys', async () => {
      const cats = await googleNewsSource.listCategories();
      expect(cats.length).toBeGreaterThan(0);
      expect(cats).toContain('technology');
      expect(cats).toContain('business');
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await googleNewsSource.fetch({ category: 'technology', limit: 5 });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Breaking News');
    });

    it('should default to headlines category when none specified', async () => {
      const articles = await googleNewsSource.fetch();
      expect(articles).toHaveLength(1);
    });

    it('should throw NewsCliError for unknown category', async () => {
      await expect(
        googleNewsSource.fetch({ category: 'nonexistent' }),
      ).rejects.toMatchObject({
        name: 'NewsCliError',
        code: 'INVALID_OPTION',
      });
    });

    it('should respect limit option', async () => {
      const multiItemRSS = `<?xml version="1.0"?><rss><channel>${
        Array.from({ length: 5 }, (_, i) =>
          `<item><title>News ${i}</title><link>https://example.com/${i}</link><guid>g${i}</guid><pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate><description>Desc ${i}</description><source url="https://s.com">Src</source></item>`
        ).join('')
      }</channel></rss>`;
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(multiItemRSS, { status: 200 }),
      );

      const articles = await googleNewsSource.fetch({ limit: 2 });
      expect(articles).toHaveLength(2);
    });
  });
});
