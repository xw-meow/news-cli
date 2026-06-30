import { describe, it, expect } from 'vitest';
import { parseHotBand, extractCategories, matchKeyword } from '../../../src/news-source/weibo/parser.js';
import type { HotBandItem } from '../../../src/news-source/weibo/parser.js';
import type { NewsArticle } from '../../../src/core/types.js';

const sampleItems: HotBandItem[] = [
  {
    word: '印度苦行僧坚持站立5年不坐不躺',
    word_scheme: '#印度苦行僧坚持站立5年不坐不躺#',
    note: '印度苦行僧坚持站立5年不坐不躺',
    num: 1172418,
    rank: 0,
    realpos: 1,
    category: '海外新闻',
    onboard_time: 1781500760,
  },
  {
    word: '怀疑出轨 泼硫酸',
    word_scheme: '怀疑出轨 泼硫酸',
    note: '怀疑出轨 泼硫酸',
    num: 841519,
    rank: 1,
    realpos: 2,
    category: '民生新闻',
    onboard_time: 1781510299,
    flag: 1,
  },
  {
    word: '我国成功发射一箭8星',
    // no word_scheme — falls back to word
    note: '我国成功发射一箭8星',
    num: 662267,
    rank: 2,
    realpos: 3,
    category: '国内时政',
    onboard_time: 1781508440,
  },
  {
    word: '   ',  // whitespace-only title
    word_scheme: '#空白话题#',
    note: '',
  },
];

describe('parseHotBand', () => {
  it('should parse HotBandItem[] into NewsArticle[]', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles).toHaveLength(4);
  });

  it('should set title from word field', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[0].title).toBe('印度苦行僧坚持站立5年不坐不躺');
    expect(articles[1].title).toBe('怀疑出轨 泼硫酸');
    expect(articles[2].title).toBe('我国成功发射一箭8星');
  });

  it('should build URL from word_scheme', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[0].url).toContain('s.weibo.com/weibo?q=');
    expect(decodeURIComponent(articles[0].url)).toContain('印度苦行僧坚持站立5年不坐不躺');
  });

  it('should fall back URL to word when no word_scheme', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[2].url).toContain('s.weibo.com/weibo?q=');
    expect(decodeURIComponent(articles[2].url)).toContain('我国成功发射一箭8星');
  });

  it('should set source to 微博热搜', () => {
    const articles = parseHotBand(sampleItems);
    articles.forEach((a) => expect(a.source).toBe('微博热搜'));
  });

  it('should extract snippet from note field', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[0].snippet).toBe('印度苦行僧坚持站立5年不坐不躺');
  });

  it('should set snippet to undefined for empty note', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[3].snippet).toBeUndefined();
  });

  it('should parse onboard_time to ISO string', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[0].publishedAt).toBe('2026-06-15T05:19:20.000Z');
    expect(articles[1].publishedAt).toBe('2026-06-15T07:58:19.000Z');
  });

  it('should leave publishedAt undefined when no onboard_time', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[3].publishedAt).toBeUndefined();
  });

  it('should set category from category field', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[0].category).toBe('海外新闻');
    expect(articles[1].category).toBe('民生新闻');
    expect(articles[3].category).toBeUndefined();
  });

  it('should generate unique id for each article', () => {
    const articles = parseHotBand(sampleItems);
    const ids = articles.map((a) => a.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('should handle whitespace-only title gracefully', () => {
    const articles = parseHotBand(sampleItems);
    expect(articles[3].title).toBe('Untitled');
  });

  it('should return empty array for empty input', () => {
    expect(parseHotBand([])).toEqual([]);
  });
});

describe('extractCategories', () => {
  it('should return unique sorted categories', () => {
    const cats = extractCategories(sampleItems);
    expect(cats).toEqual(['国内时政', '民生新闻', '海外新闻']);
  });

  it('should return empty array when no items have category', () => {
    const items: HotBandItem[] = [{ word: 'test' }];
    expect(extractCategories(items)).toEqual([]);
  });

  it('should return empty array for empty input', () => {
    expect(extractCategories([])).toEqual([]);
  });
});

describe('matchKeyword', () => {
  const article: NewsArticle = {
    id: 'abc',
    title: '印度苦行僧坚持站立5年不坐不躺',
    url: 'https://example.com',
    source: '微博热搜',
    snippet: '印度苦行僧的传奇故事',
  };

  it('should match when keyword appears in title', () => {
    expect(matchKeyword(article, '印度')).toBe(true);
  });

  it('should match when keyword appears in snippet', () => {
    expect(matchKeyword(article, '传奇')).toBe(true);
  });

  it('should not match when keyword is absent', () => {
    expect(matchKeyword(article, '航天')).toBe(false);
  });

  it('should support comma-separated OR logic', () => {
    expect(matchKeyword(article, '航天,印度')).toBe(true);
    expect(matchKeyword(article, '航天,卫星')).toBe(false);
  });

  it('should match case-insensitively', () => {
    const enArticle: NewsArticle = {
      id: 'def',
      title: 'Breaking News',
      url: 'https://example.com',
      source: '微博热搜',
    };
    expect(matchKeyword(enArticle, 'breaking')).toBe(true);
    expect(matchKeyword(enArticle, 'BREAKING')).toBe(true);
  });

  it('should handle empty keyword gracefully', () => {
    expect(matchKeyword(article, '')).toBe(true);
    expect(matchKeyword(article, '  ,  ')).toBe(true);
  });

  it('should handle missing snippet gracefully', () => {
    const noSnippet: NewsArticle = {
      id: 'ghi',
      title: '测试标题',
      url: 'https://example.com',
      source: '微博热搜',
    };
    expect(matchKeyword(noSnippet, '测试')).toBe(true);
    expect(matchKeyword(noSnippet, '不存在')).toBe(false);
  });
});
