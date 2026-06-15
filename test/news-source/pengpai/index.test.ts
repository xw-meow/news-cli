import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pengpaiSource } from '../../../src/news-source/pengpai/index.js';

const mockChannelPage = {
  code: 200,
  data: {
    hasNext: false,
    startTime: 1781516538864,
    list: [
      {
        contId: '33382993',
        name: '北航今年新增两个卓越人才培养试验班',
        pubTime: '刚刚',
        pubTimeLong: 1781516538864,
        nodeInfo: { nodeId: 25487, name: '教育家' },
      },
      {
        contId: '33382760',
        name: '肺动脉高压新药在沪完成首针',
        pubTime: '刚刚',
        pubTimeLong: 1781516538000,
        nodeInfo: { nodeId: 25422, name: '浦江头条' },
      },
    ],
  },
};

const mockSearchPage = {
  code: 200,
  data: {
    list: [
      {
        contId: '33382600',
        name: '活力中国调研行｜AI硬科技是一个时代机遇',
        pubTimeLong: 1781513471394,
        nodeInfo: { nodeId: 25438, name: '财经上下游' },
      },
      {
        contId: '33382562',
        name: '华润置地约6.57亿元拍下合肥苏宁广场',
        pubTimeLong: 1781513332035,
        nodeInfo: { nodeId: 25433, name: '地产界' },
      },
      {
        contId: '33382000',
        name: '无名新闻',
        pubTimeLong: 1781510000000,
      },
    ],
  },
};

describe('pengpaiSource', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : '';
      const body = (init as RequestInit)?.body as string | undefined;

      if (urlStr.includes('getByChannelId')) {
        return new Response(JSON.stringify(mockChannelPage), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('search/web/news')) {
        return new Response(JSON.stringify(mockSearchPage), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    });
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
    it('should return 22 categories', async () => {
      const cats = await pengpaiSource.listCategories();
      expect(cats).toHaveLength(22);
      expect(cats[0]).toBe('要闻');
    });

    it('should not contain removed channels', async () => {
      const cats = await pengpaiSource.listCategories();
      expect(cats).not.toContain('问吧');
      expect(cats).not.toContain('专题');
    });
  });

  describe('fetch', () => {
    it('should default to 要闻 channel', async () => {
      const articles = await pengpaiSource.fetch();
      expect(articles).toHaveLength(2);
      expect(articles[0].title).toContain('北航');
    });

    it('should use channel API for specified category', async () => {
      const articles = await pengpaiSource.fetch({ category: '时事' });
      expect(articles).toHaveLength(2);
    });

    it('should use search API when only keyword given', async () => {
      const articles = await pengpaiSource.fetch({ keyword: 'AI' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toContain('AI');
    });

    it('should use channel API + keyword filter when both given', async () => {
      const articles = await pengpaiSource.fetch({ category: '时事', keyword: '北航' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toContain('北航');
    });

    it('should support OR keyword', async () => {
      const articles = await pengpaiSource.fetch({ keyword: 'AI,华润' });
      expect(articles).toHaveLength(2);
    });

    it('should respect limit', async () => {
      const articles = await pengpaiSource.fetch({ limit: 1 });
      expect(articles).toHaveLength(1);
    });

    it('should return empty when API returns no data', async () => {
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: null }), { status: 200 }),
      );
      const articles = await pengpaiSource.fetch();
      expect(articles).toEqual([]);
    });
  });
});
