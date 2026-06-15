import { describe, it, expect } from 'vitest';
import { parseSearchResults, extractCategories, matchKeyword } from '../../../src/news-source/pengpai/parser.js';
import type { PengpaiNewsItem } from '../../../src/news-source/pengpai/parser.js';
import type { NewsArticle } from '../../../src/core/types.js';

const sampleItems: PengpaiNewsItem[] = [
  {
    contId: '33382650',
    name: '以开放型经济为轴，丽水莲都区多维度编织"全球贸易链接网"',
    summary: '…摘要内容…',
    pubTime: '1小时前',
    pubTimeLong: 1781513621719,
    pic: 'https://imgpai.thepaper.cn/image.png',
    nodeInfo: { nodeId: 12345, name: '澎湃浙江' },
  },
  {
    contId: '33382600',
    name: '活力中国调研行｜北洋海棠基金刘毅：国内工程师红利全面释放，AI硬科技是一个时代机遇',
    summary: '…主题采访活动期间…',
    pubTime: '2小时前',
    pubTimeLong: 1781513471394,
    pic: 'https://imgpai.thepaper.cn/image2.png',
    nodeInfo: { nodeId: 25438, name: '财经上下游' },
  },
  {
    contId: '33382562',
    name: '华润置地约6.57亿元拍下合肥苏宁广场，项目已停工五年',
    // no summary — should be undefined
    pubTime: '3小时前',
    pubTimeLong: 1781513332035,
    // no pic — should be undefined
    nodeInfo: { nodeId: 25433, name: '地产界' },
  },
  {
    contId: '33382000',
    name: '',  // empty title
    // no nodeInfo
  },
];

describe('parseSearchResults', () => {
  it('should parse PengpaiNewsItem[] into NewsArticle[]', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles).toHaveLength(4);
  });

  it('should set title from name field', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[0].title).toBe('以开放型经济为轴，丽水莲都区多维度编织"全球贸易链接网"');
    expect(articles[1].title).toContain('活力中国调研行');
  });

  it('should strip HTML tags from title', () => {
    const items: PengpaiNewsItem[] = [
      { contId: '1', name: '澎湃<font color="#00a5eb">新闻</font>｜艺术评论' },
    ];
    const articles = parseSearchResults(items);
    expect(articles[0].title).toBe('澎湃新闻｜艺术评论');
  });

  it('should build URL from contId', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[0].url).toBe('https://www.thepaper.cn/newsDetail_forward_33382650');
  });

  it('should set source to 澎湃新闻', () => {
    const articles = parseSearchResults(sampleItems);
    articles.forEach((a) => expect(a.source).toBe('澎湃新闻'));
  });

  it('should extract snippet from summary field', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[0].snippet).toBe('…摘要内容…');
    expect(articles[1].snippet).toBe('…主题采访活动期间…');
  });

  it('should strip HTML tags from summary', () => {
    const items: PengpaiNewsItem[] = [
      { contId: '1', name: 'test', summary: '摘要<font color="red">重点</font>内容' },
    ];
    const articles = parseSearchResults(items);
    expect(articles[0].snippet).toBe('摘要重点内容');
  });

  it('should leave snippet undefined when no summary', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[2].snippet).toBeUndefined();
  });

  it('should parse pubTimeLong to ISO string', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[0].publishedAt).toBe('2026-06-15T08:53:41.719Z');
    expect(articles[1].publishedAt).toBe('2026-06-15T08:51:11.394Z');
  });

  it('should leave publishedAt undefined when no pubTimeLong', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[3].publishedAt).toBeUndefined();
  });

  it('should set category from nodeInfo.name', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[0].category).toBe('澎湃浙江');
    expect(articles[1].category).toBe('财经上下游');
    expect(articles[3].category).toBeUndefined();
  });

  it('should set imageUrl from pic field', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[0].imageUrl).toBe('https://imgpai.thepaper.cn/image.png');
    expect(articles[2].imageUrl).toBeUndefined();
  });

  it('should generate unique id for each article', () => {
    const articles = parseSearchResults(sampleItems);
    const ids = articles.map((a) => a.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('should handle empty title gracefully', () => {
    const articles = parseSearchResults(sampleItems);
    expect(articles[3].title).toBe('Untitled');
  });

  it('should return empty array for empty input', () => {
    expect(parseSearchResults([])).toEqual([]);
  });
});

describe('extractCategories', () => {
  it('should return unique sorted categories', () => {
    const cats = extractCategories(sampleItems);
    expect(cats).toEqual(['地产界', '澎湃浙江', '财经上下游']);
  });

  it('should return empty array when no items have category', () => {
    const items: PengpaiNewsItem[] = [{ contId: '1', name: 'test' }];
    expect(extractCategories(items)).toEqual([]);
  });

  it('should return empty array for empty input', () => {
    expect(extractCategories([])).toEqual([]);
  });
});

describe('matchKeyword', () => {
  const article: NewsArticle = {
    id: 'abc',
    title: '活力中国调研行｜AI硬科技是一个时代机遇',
    url: 'https://example.com',
    source: '澎湃新闻',
    snippet: '刘毅谈了关于科创投资的看法',
  };

  it('should match when keyword appears in title', () => {
    expect(matchKeyword(article, 'AI')).toBe(true);
  });

  it('should match when keyword appears in snippet', () => {
    expect(matchKeyword(article, '科创')).toBe(true);
  });

  it('should not match when keyword is absent', () => {
    expect(matchKeyword(article, '芯片')).toBe(false);
  });

  it('should support comma-separated OR logic', () => {
    expect(matchKeyword(article, '芯片,AI')).toBe(true);
    expect(matchKeyword(article, '芯片,5G')).toBe(false);
  });

  it('should match case-insensitively', () => {
    expect(matchKeyword(article, 'ai')).toBe(true);
    expect(matchKeyword(article, 'AI')).toBe(true);
  });

  it('should handle empty keyword gracefully', () => {
    expect(matchKeyword(article, '')).toBe(true);
    expect(matchKeyword(article, '  ,  ')).toBe(true);
  });
});
