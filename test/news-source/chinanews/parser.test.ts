import { describe, it, expect } from 'vitest';
import { parseRSS } from '../../../src/news-source/chinanews/parser.js';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>中国新闻网-即时新闻</title>
    <link>https://www.chinanews.com.cn/</link>
    <description>中国新闻网即时新闻</description>
    <item>
      <title>测试新闻标题一</title>
      <link>https://www.chinanews.com.cn/gn/2024/01-01/12345.shtml</link>
      <description>&lt;p&gt;这是一条测试新闻的描述内容。&lt;/p&gt;</description>
      <pubDate>Mon, 01 Jan 2024 12:00:00 +0800</pubDate>
      <guid>https://www.chinanews.com.cn/gn/2024/01-01/12345.shtml</guid>
    </item>
    <item>
      <title>测试新闻标题二</title>
      <link>https://www.chinanews.com.cn/sh/2024/01-02/67890.shtml</link>
      <description>第二条新闻的描述</description>
      <pubDate>Tue, 02 Jan 2024 15:30:00 +0800</pubDate>
    </item>
    <item>
      <title></title>
      <link>https://www.chinanews.com.cn/ty/2024/01-03/11111.shtml</link>
      <description>空标题新闻</description>
    </item>
  </channel>
</rss>`;

describe('chinanews parser', () => {
  it('should parse RSS XML into NewsArticle array', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles).toHaveLength(3);
  });

  it('should extract title correctly', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles[0].title).toBe('测试新闻标题一');
    expect(articles[1].title).toBe('测试新闻标题二');
  });

  it('should use "Untitled" for empty title', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles[2].title).toBe('Untitled');
  });

  it('should strip HTML from description', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles[0].snippet).toBe('这是一条测试新闻的描述内容。');
  });

  it('should generate unique ID from URL', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles[0].id).toHaveLength(12);
    expect(articles[0].id).not.toBe(articles[1].id);
  });

  it('should set source to 中国新闻网', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles[0].source).toBe('中国新闻网');
  });

  it('should parse pubDate to ISO string', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles[0].publishedAt).toBeDefined();
  });

  it('should set category correctly', () => {
    const articles = parseRSS(SAMPLE_RSS, '即时新闻');
    expect(articles[0].category).toBe('即时新闻');
  });

  it('should return empty array for RSS without items', () => {
    const emptyRSS = '<rss version="2.0"><channel><title>Empty</title></channel></rss>';
    const articles = parseRSS(emptyRSS, '即时新闻');
    expect(articles).toEqual([]);
  });

  it('should throw on malformed XML', () => {
    expect(() => parseRSS('not xml', '即时新闻')).toThrow('Failed to parse RSS XML');
  });
});
