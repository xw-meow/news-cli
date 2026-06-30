import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hackernewsSource } from '../../../src/news-source/hackernews/index.js';
import { CATEGORIES, DEFAULT_CATEGORY } from '../../../src/news-source/hackernews/constants.js';

vi.mock('../../../src/core/fetcher.js', () => ({
  fetchRSS: vi.fn(),
}));

import { fetchRSS } from '../../../src/core/fetcher.js';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Hacker News</title>
    <link>https://news.ycombinator.com/</link>
    <item>
      <title>Show HN: A new CLI tool</title>
      <link>https://example.com/cli-tool</link>
      <pubDate>Mon, 30 Jun 2025 12:00:00 GMT</pubDate>
      <comments>https://news.ycombinator.com/item?id=12345</comments>
      <description><![CDATA[100 points and 42 comments]]></description>
    </item>
    <item>
      <title>Ask HN: How do you test RSS parsers?</title>
      <link>https://news.ycombinator.com/item?id=12346</link>
      <pubDate>Mon, 30 Jun 2025 10:00:00 GMT</pubDate>
      <comments>https://news.ycombinator.com/item?id=12346</comments>
      <description><![CDATA[50 points and 12 comments]]></description>
    </item>
  </channel>
</rss>`;

describe('hackernewsSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have name "hackernews"', () => {
    expect(hackernewsSource.name).toBe('hackernews');
  });

  it('should have a description', () => {
    expect(hackernewsSource.description).toBeTruthy();
    expect(hackernewsSource.description).toContain('Hacker News');
  });

  describe('listCategories', () => {
    it('should return top, new, ask, show, jobs categories', async () => {
      const cats = await hackernewsSource.listCategories();
      expect(cats).toEqual(['top', 'new', 'ask', 'show', 'jobs']);
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
      const articles = await hackernewsSource.fetch();
      expect(fetchRSS).toHaveBeenCalledWith(
        CATEGORIES[DEFAULT_CATEGORY],
        expect.any(Number),
      );
      expect(articles.length).toBe(2);
      expect(articles[0].source).toBe('Hacker News');
      expect(articles[0].title).toBe('Show HN: A new CLI tool');
      expect(articles[0].url).toBe('https://example.com/cli-tool');
      expect(articles[0].snippet).toBe('100 points and 42 comments');
    });

    it('should default to new category', async () => {
      vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
      const articles = await hackernewsSource.fetch();
      expect(articles[0].category).toBe('new');
    });

    it('should fetch a specified category', async () => {
      vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
      await hackernewsSource.fetch({ category: 'ask' });
      expect(fetchRSS).toHaveBeenCalledWith(CATEGORIES['ask'], expect.any(Number));
    });

    it('should throw NewsCliError for unknown category', async () => {
      await expect(
        hackernewsSource.fetch({ category: 'nonexistent' }),
      ).rejects.toMatchObject({
        name: 'NewsCliError',
        code: 'INVALID_OPTION',
      });
    });

    it('should filter by keyword', async () => {
      vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
      const articles = await hackernewsSource.fetch({ keyword: 'CLI' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Show HN: A new CLI tool');
    });

    it('should support comma-separated OR keywords', async () => {
      vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
      const articles = await hackernewsSource.fetch({ keyword: 'CLI,RSS' });
      expect(articles).toHaveLength(2);
    });

    it('should respect limit option', async () => {
      vi.mocked(fetchRSS).mockResolvedValue(SAMPLE_RSS);
      const articles = await hackernewsSource.fetch({ limit: 1 });
      expect(articles).toHaveLength(1);
    });
  });
});
