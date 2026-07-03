import { describe, it, expect } from 'vitest';
import { deduplicate, selectArticles, levenshteinSimilarity } from '../scripts/dedup.js';
import type { NewsArticle } from '../scripts/fetch.js';

const article = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  id: 'id',
  title: 'Title',
  url: 'https://example.com',
  source: 'src',
  snippet: 'snippet',
  publishedAt: '2026-07-03T10:00:00Z',
  category: null,
  imageUrl: null,
  ...overrides,
});

describe('levenshteinSimilarity', () => {
  it('相同标题相似度为 1', () => {
    expect(levenshteinSimilarity('abc', 'abc')).toBe(1);
  });

  it('完全不同标题相似度低', () => {
    expect(levenshteinSimilarity('abc', 'xyz')).toBeLessThan(0.5);
  });
});

describe('deduplicate', () => {
  it('按 URL 去重', () => {
    const arts = [article({ id: '1', url: 'https://a.com' }), article({ id: '2', url: 'https://a.com' })];
    expect(deduplicate(arts)).toHaveLength(1);
  });

  it('按标题相似度去重保留最新', () => {
    const arts = [
      article({ id: '1', title: 'OpenAI 发布新模型', publishedAt: '2026-07-02T10:00:00Z' }),
      article({ id: '2', title: 'OpenAI 发布新模型', publishedAt: '2026-07-03T10:00:00Z' }),
    ];
    const result = deduplicate(arts);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

describe('selectArticles', () => {
  it('按目标条数截断', () => {
    const arts = Array.from({ length: 20 }, (_, i) => article({ id: String(i), title: `Title ${i}`, url: `https://example.com/${i}` }));
    const result = selectArticles(arts, { targetCount: 5, keywords: [] });
    expect(result).toHaveLength(5);
  });
});
