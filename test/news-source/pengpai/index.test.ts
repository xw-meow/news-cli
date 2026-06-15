import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pengpaiSource } from '../../../src/news-source/pengpai/index.js';

const mockSearchResponse = {
  code: 200,
  data: {
    list: [
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
        name: '活力中国调研行｜AI硬科技是一个时代机遇',
        summary: '…主题采访活动期间…',
        pubTime: '2小时前',
        pubTimeLong: 1781513471394,
        pic: 'https://imgpai.thepaper.cn/image2.png',
        nodeInfo: { nodeId: 25438, name: '财经上下游' },
      },
      {
        contId: '33382562',
        name: '华润置地约6.57亿元拍下合肥苏宁广场，项目已停工五年',
        pubTime: '3小时前',
        pubTimeLong: 1781513332035,
        nodeInfo: { nodeId: 25433, name: '地产界' },
      },
      {
        contId: '33382000',
        name: '无名新闻',
        // no nodeInfo — no category
      },
    ],
  },
};

describe('pengpaiSource', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockSearchResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "pengpai"', () => {
    expect(pengpaiSource.name).toBe('pengpai');
  });

  it('should have a description', () => {
    expect(pengpaiSource.description).toBeTruthy();
  });

  describe('listCategories', () => {
    it('should return unique categories from search results', async () => {
      const cats = await pengpaiSource.listCategories();
      expect(cats).toEqual(['地产界', '澎湃浙江', '财经上下游']);
    });

    it('should return empty array when API returns no list', async () => {
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), { status: 200 }),
      );
      const cats = await pengpaiSource.listCategories();
      expect(cats).toEqual([]);
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await pengpaiSource.fetch();
      expect(articles).toHaveLength(4);
      expect(articles[0].title).toContain('丽水莲都区');
    });

    it('should filter by category', async () => {
      const articles = await pengpaiSource.fetch({ category: '地产界' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toContain('华润置地');
    });

    it('should return empty when category matches nothing', async () => {
      const articles = await pengpaiSource.fetch({ category: '不存在' });
      expect(articles).toEqual([]);
    });

    it('should do local keyword filter on title only', async () => {
      // mock: only 1 article has "AI" in title
      const articles = await pengpaiSource.fetch({ keyword: 'AI' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toContain('AI');
    });

    it('should support comma-separated OR keyword logic in title', async () => {
      // "AI硬科技..." has AI, "华润置地..." has 华润 → 2 matches
      const articles = await pengpaiSource.fetch({ keyword: 'AI,华润' });
      expect(articles).toHaveLength(2);
    });

    it('should combine category and keyword filters', async () => {
      const articles = await pengpaiSource.fetch({
        category: '财经上下游',
        keyword: 'AI',
      });
      expect(articles).toHaveLength(1);
      expect(articles[0].category).toBe('财经上下游');
    });

    it('should respect limit option', async () => {
      const articles = await pengpaiSource.fetch({ limit: 2 });
      expect(articles).toHaveLength(2);
    });

    it('should return empty array when API returns no list', async () => {
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), { status: 200 }),
      );
      const articles = await pengpaiSource.fetch();
      expect(articles).toEqual([]);
    });

    it('should include articles without category when no category filter', async () => {
      const articles = await pengpaiSource.fetch();
      const withoutCategory = articles.filter((a) => !a.category);
      expect(withoutCategory).toHaveLength(1);
    });
  });
});
