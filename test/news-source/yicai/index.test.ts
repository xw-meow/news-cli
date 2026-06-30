import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { yicaiSource } from '../../../src/news-source/yicai/index.js';

function makeScriptHtml(headCount: number, latestCount: number): string {
  const headItems = Array.from({ length: headCount }, (_, i) => ({
    NewsID: 1000 + i,
    NewsTitle: `头条标题${i + 1}`,
    NewsNotes: `头条摘要${i + 1}`,
    CreateDate: '2026-06-17T08:00:00',
    url: `/news/${1000 + i}.html`,
  }));

  const latestItems = Array.from({ length: latestCount }, (_, i) => ({
    NewsID: 2000 + i,
    NewsTitle: `最新标题${i + 1}`,
    NewsNotes: `最新摘要${i + 1}`,
    CreateDate: '2026-06-17T10:00:00',
    url: `/news/${2000 + i}.html`,
  }));

  return `
    <script>
      headList = ${JSON.stringify(headItems)};
      latestList = ${JSON.stringify(latestItems)};
    </script>
  `;
}

describe('yicaiSource', () => {
  beforeEach(() => {
    const html = makeScriptHtml(30, 30);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "yicai"', () => {
    expect(yicaiSource.name).toBe('yicai');
  });

  it('should have a description', () => {
    expect(yicaiSource.description).toBeTruthy();
    expect(yicaiSource.description).toContain('第一财经');
  });

  describe('listCategories', () => {
    it('should return 头条 and 最新', async () => {
      const cats = await yicaiSource.listCategories();
      expect(cats).toEqual(['头条', '最新']);
    });
  });

  describe('fetch', () => {
    it('should default to 最新 category', async () => {
      const articles = await yicaiSource.fetch();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].category).toBe('最新');
      expect(articles[0].title).toBe('最新标题1');
    });

    it('should fetch 头条 category', async () => {
      const articles = await yicaiSource.fetch({ category: '头条' });
      expect(articles[0].category).toBe('头条');
      expect(articles[0].title).toBe('头条标题1');
    });

    it('should fallback to 最新 for unknown category', async () => {
      const articles = await yicaiSource.fetch({ category: '不存在的' });
      expect(articles[0].category).toBe('最新');
    });

    it('should respect limit option', async () => {
      const articles = await yicaiSource.fetch({ limit: 5 });
      expect(articles).toHaveLength(5);
    });

    it('should default limit to 20', async () => {
      const articles = await yicaiSource.fetch();
      expect(articles.length).toBeLessThanOrEqual(20);
    });

    it('should filter by keyword', async () => {
      const articles = await yicaiSource.fetch({ keyword: '标题5' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles.every((a) => a.title.includes('标题5'))).toBe(true);
    });

    it('should support keyword OR logic', async () => {
      const articles = await yicaiSource.fetch({ keyword: '标题1,标题2' });
      expect(articles.length).toBeGreaterThanOrEqual(1);
      expect(
        articles.every((a) => a.title.includes('标题1') || a.title.includes('标题2')),
      ).toBe(true);
    });

    it('should return empty for non-matching keyword', async () => {
      const articles = await yicaiSource.fetch({ keyword: '外星人攻打华尔街' });
      expect(articles).toEqual([]);
    });
  });
});
