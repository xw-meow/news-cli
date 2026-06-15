import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chinanewsSource } from '../../../src/news-source/chinanews/index.js';
import { CATEGORIES } from '../../../src/news-source/chinanews/constants.js';

// Mock the fetcher
vi.mock('../../../src/core/fetcher.js', () => ({
  fetchRSS: vi.fn(),
}));

import { fetchRSS } from '../../../src/core/fetcher.js';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>中国新闻网-即时新闻</title>
    <item>
      <title>新闻标题A</title>
      <link>https://www.chinanews.com.cn/a.shtml</link>
      <description>描述A</description>
      <pubDate>Mon, 01 Jan 2024 12:00:00 +0800</pubDate>
    </item>
    <item>
      <title>新闻标题B</title>
      <link>https://www.chinanews.com.cn/b.shtml</link>
      <description>描述B</description>
      <pubDate>Tue, 02 Jan 2024 12:00:00 +0800</pubDate>
    </item>
    <item>
      <title>包含关键词的新闻</title>
      <link>https://www.chinanews.com.cn/c.shtml</link>
      <description>描述C</description>
      <pubDate>Wed, 03 Jan 2024 12:00:00 +0800</pubDate>
    </item>
  </channel>
</rss>`;

describe('chinanews source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(chinanewsSource.name).toBe('chinanews');
  });

  it('should list all 24 categories', async () => {
    const cats = await chinanewsSource.listCategories();
    expect(cats).toHaveLength(24);
    expect(cats).toContain('即时新闻');
    expect(cats).toContain('国际新闻');
    expect(cats).toContain('体育新闻');
  });

  it('should default to 即时新闻 category', async () => {
    vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
    const articles = await chinanewsSource.fetch();
    expect(fetchRSS).toHaveBeenCalledWith(
      CATEGORIES['即时新闻'],
      expect.any(Number),
    );
    expect(articles).toHaveLength(3);
    expect(articles[0].category).toBe('即时新闻');
  });

  it('should fetch a specified category', async () => {
    vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
    await chinanewsSource.fetch({ category: '体育新闻' });
    expect(fetchRSS).toHaveBeenCalledWith(
      CATEGORIES['体育新闻'],
      expect.any(Number),
    );
  });

  it('should throw on unknown category', async () => {
    await expect(
      chinanewsSource.fetch({ category: '不存在的分类' }),
    ).rejects.toThrow('Unknown category');
  });

  it('should filter by keyword (title match)', async () => {
    vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
    const articles = await chinanewsSource.fetch({ keyword: '关键词' });
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('包含关键词的新闻');
  });

  it('should support comma-separated OR keywords', async () => {
    vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
    const articles = await chinanewsSource.fetch({ keyword: '关键词,标题A' });
    expect(articles).toHaveLength(2);
  });

  it('should respect limit option', async () => {
    vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
    const articles = await chinanewsSource.fetch({ limit: 2 });
    expect(articles).toHaveLength(2);
  });
});
