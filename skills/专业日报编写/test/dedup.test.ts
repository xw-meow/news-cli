import { describe, it, expect } from 'vitest';
import { deduplicate, selectArticles, levenshteinSimilarity, filterByKeywords, scoreArticle } from '../scripts/dedup.js';
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

  it('按标题相似度阈值 0.85 去重', () => {
    const arts = [
      article({ id: '1', title: 'OpenAI 发布新模型', publishedAt: '2026-07-02T10:00:00Z' }),
      article({ id: '2', title: 'OpenAI 发布新模型！', publishedAt: '2026-07-03T10:00:00Z' }),
    ];
    const result = deduplicate(arts);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

describe('filterByKeywords', () => {
  it('无关键词时返回全部文章', () => {
    const arts = [article({ title: 'AI 新闻' }), article({ title: '科技新闻' })];
    expect(filterByKeywords(arts, [])).toHaveLength(2);
  });

  it('按标题关键词过滤', () => {
    const arts = [article({ title: 'AI 新闻' }), article({ title: '体育新闻' })];
    const result = filterByKeywords(arts, ['AI']);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('AI 新闻');
  });

  it('按摘要关键词过滤', () => {
    const arts = [article({ snippet: '关于人工智能的报道' }), article({ snippet: '关于体育的报道' })];
    const result = filterByKeywords(arts, ['人工智能']);
    expect(result).toHaveLength(1);
    expect(result[0].snippet).toBe('关于人工智能的报道');
  });

  it('多个关键词为 OR 关系', () => {
    const arts = [article({ title: 'AI 新闻' }), article({ title: '区块链新闻' }), article({ title: '体育新闻' })];
    const result = filterByKeywords(arts, ['AI', '区块链']);
    expect(result).toHaveLength(2);
  });

  it('关键词匹配大小写不敏感', () => {
    const arts = [article({ title: 'AI 新闻' })];
    expect(filterByKeywords(arts, ['ai'])).toHaveLength(1);
  });
});

describe('scoreArticle', () => {
  const now = Date.parse('2026-07-03T12:00:00Z');

  it('新文章得分高于旧文章', () => {
    const newer = article({ source: 'weibo', publishedAt: '2026-07-03T10:00:00Z' });
    const older = article({ source: 'weibo', publishedAt: '2026-07-02T10:00:00Z' });
    expect(scoreArticle(newer, [], now)).toBeGreaterThan(scoreArticle(older, [], now));
  });

  it('高来源权重得分高于低来源权重', () => {
    const high = article({ source: 'aibase', publishedAt: '2026-07-03T10:00:00Z' });
    const low = article({ source: 'weibo', publishedAt: '2026-07-03T10:00:00Z' });
    expect(scoreArticle(high, [], now)).toBeGreaterThan(scoreArticle(low, [], now));
  });

  it('命中更多关键词得分更高', () => {
    const one = article({ source: 'weibo', title: 'AI 新闻', snippet: '', publishedAt: '2026-07-03T10:00:00Z' });
    const two = article({ source: 'weibo', title: 'AI 区块链新闻', snippet: '', publishedAt: '2026-07-03T10:00:00Z' });
    expect(scoreArticle(two, ['AI', '区块链'], now)).toBeGreaterThan(scoreArticle(one, ['AI', '区块链'], now));
  });
});

describe('selectArticles', () => {
  it('按目标条数截断', () => {
    const arts = Array.from({ length: 20 }, (_, i) => article({ id: String(i), title: `Item ${String.fromCharCode(65 + i)}`, url: `https://example.com/${i}` }));
    const result = selectArticles(arts, { targetCount: 5, keywords: [] });
    expect(result).toHaveLength(5);
  });

  it('生成基于实际评分组件的选中理由', () => {
    const arts = [article({ source: 'aibase', title: 'AI 新闻', snippet: '人工智能' })];
    const result = selectArticles(arts, { targetCount: 1, keywords: ['AI'] });
    expect(result[0].selectedReason).toContain('来源权重3');
    expect(result[0].selectedReason).toContain('命中1个关键词');
  });

  it('注入固定 now 后选中理由完全确定', () => {
    const now = Date.parse('2026-07-03T12:00:00Z');
    const arts = [article({ source: 'aibase', title: 'AI 新闻', snippet: '人工智能', publishedAt: '2026-07-03T10:00:00Z' })];
    const result = selectArticles(arts, { targetCount: 1, keywords: ['AI'] }, now);
    expect(result[0].selectedReason).toBe('来源权重3，时效分0.99，命中1个关键词');
  });
});
