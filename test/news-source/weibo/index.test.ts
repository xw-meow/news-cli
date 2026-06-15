import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { weiboSource } from '../../../src/news-source/weibo/index.js';

const mockHotBandResponse = {
  ok: 1,
  data: {
    band_list: [
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
        note: '我国成功发射一箭8星',
        num: 662267,
        rank: 2,
        realpos: 3,
        category: '国内时政',
        onboard_time: 1781508440,
      },
      {
        word: '今晚8点天猫618巅峰价6.8折起',
        word_scheme: '#今晚8点天猫618巅峰价6.8折起#',
        note: '今晚8点天猫618巅峰价6.8折起',
        num: 550000,
        rank: 3,
        realpos: 4,
        // no category — advertisement
      },
    ],
  },
};

describe('weiboSource', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockHotBandResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "weibo"', () => {
    expect(weiboSource.name).toBe('weibo');
  });

  it('should have a description', () => {
    expect(weiboSource.description).toBeTruthy();
  });

  describe('listCategories', () => {
    it('should return unique categories from hot_band', async () => {
      const cats = await weiboSource.listCategories();
      expect(cats).toEqual(['国内时政', '民生新闻', '海外新闻']);
    });

    it('should return empty array when API returns no band_list', async () => {
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: 1, data: {} }), { status: 200 }),
      );
      const cats = await weiboSource.listCategories();
      expect(cats).toEqual([]);
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await weiboSource.fetch();
      expect(articles).toHaveLength(4);
      expect(articles[0].title).toBe('印度苦行僧坚持站立5年不坐不躺');
    });

    it('should filter by category', async () => {
      const articles = await weiboSource.fetch({ category: '民生新闻' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('怀疑出轨 泼硫酸');
    });

    it('should return empty when category matches nothing', async () => {
      const articles = await weiboSource.fetch({ category: '不存在' });
      expect(articles).toEqual([]);
    });

    it('should filter by keyword', async () => {
      const articles = await weiboSource.fetch({ keyword: '印度' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toContain('印度');
    });

    it('should support keyword OR logic', async () => {
      const articles = await weiboSource.fetch({ keyword: '印度,出轨' });
      expect(articles).toHaveLength(2);
    });

    it('should combine category and keyword filters', async () => {
      // Only 民生新闻 with keyword '出轨' → 1 match
      const articles = await weiboSource.fetch({
        category: '民生新闻',
        keyword: '出轨',
      });
      expect(articles).toHaveLength(1);
      expect(articles[0].category).toBe('民生新闻');
    });

    it('should respect limit option', async () => {
      const articles = await weiboSource.fetch({ limit: 2 });
      expect(articles).toHaveLength(2);
    });

    it('should default limit to 20', async () => {
      const articles = await weiboSource.fetch();
      expect(articles.length).toBeLessThanOrEqual(20);
    });

    it('should return empty array when API returns no band_list', async () => {
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: 1, data: {} }), { status: 200 }),
      );
      const articles = await weiboSource.fetch();
      expect(articles).toEqual([]);
    });

    it('should include articles without category when no category filter', async () => {
      const articles = await weiboSource.fetch();
      const withoutCategory = articles.filter((a) => !a.category);
      expect(withoutCategory).toHaveLength(1);
      expect(withoutCategory[0].title).toBe('今晚8点天猫618巅峰价6.8折起');
    });
  });
});
