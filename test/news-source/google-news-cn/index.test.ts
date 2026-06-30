import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { googleNewsCNSource } from '../../../src/news-source/google-news-cn/index.js';

const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>中国航天再创佳绩 - 新华社</title>
      <link>https://news.google.com/rss/articles/test123</link>
      <guid isPermaLink="false">test123</guid>
      <pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate>
      <description>中国载人航天工程取得重大突破。</description>
      <source url="https://xinhuanet.com">新华社</source>
    </item>
  </channel>
</rss>`;

describe('googleNewsCNSource', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(mockRSS, { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "google-news-cn"', () => {
    expect(googleNewsCNSource.name).toBe('google-news-cn');
  });

  it('should have a description', () => {
    expect(googleNewsCNSource.description).toBeTruthy();
  });

  describe('listCategories', () => {
    it('should return category keys', async () => {
      const cats = await googleNewsCNSource.listCategories();
      expect(cats.length).toBeGreaterThan(0);
      expect(cats).toContain('technology');
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await googleNewsCNSource.fetch({ category: 'technology', limit: 5 });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('中国航天再创佳绩');
    });

    it('should include CN locale params in URL', async () => {
      await googleNewsCNSource.fetch({ category: 'headlines' });
      const fetchCalls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const url = fetchCalls[fetchCalls.length - 1]?.[0] as string;
      expect(url).toContain('hl=zh-CN');
      expect(url).toContain('gl=CN');
    });
  });
});
