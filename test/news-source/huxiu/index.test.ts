import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { huxiuSource } from '../../../src/news-source/huxiu/index.js';
import type {
  HuxiuArticleItem,
  HuxiuArticleListResponse,
} from '../../../src/news-source/huxiu/parser.js';

function makeItem(aid: number, title: string): HuxiuArticleItem {
  return {
    aid,
    title,
    pic_path: `https://img.huxiucdn.com/cover/${aid}.jpg`,
    url: `https://www.huxiu.com/article/${aid}.html`,
    dateline: 1781612008,
    is_original: false,
    label: '',
    is_none_headpic: false,
    is_video_article: false,
    count_info: { favorite_num: 0, total_comment_num: 0 },
    user_info: {
      uid: 10001,
      username: '测试作者',
      avatar: '',
      ip_url: '',
    },
    video_info: { duration: '' },
  };
}

function makeArticleResponse(
  items: HuxiuArticleItem[],
  lastId: number,
): HuxiuArticleListResponse {
  return {
    success: true,
    data: {
      name: '虎嗅频道',
      last_id: lastId,
      datalist: items,
      share_info: {
        share_url: 'https://www.huxiu.com/channel/0.html',
        share_title: '虎嗅频道',
        share_desc: '',
        share_img: '',
      },
    },
  };
}

describe('huxiuSource', () => {
  beforeEach(() => {
    // 默认 mock：足够文章一次性满足
    const items = Array.from({ length: 30 }, (_, i) =>
      makeItem(10000 + i, `搞笑新闻标题${i + 1}`),
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(makeArticleResponse(items, 0)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "huxiu"', () => {
    expect(huxiuSource.name).toBe('huxiu');
  });

  it('should have a description', () => {
    expect(huxiuSource.description).toBeTruthy();
    expect(huxiuSource.description).toContain('虎嗅网');
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await huxiuSource.fetch();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].source).toBe('虎嗅网');
      expect(articles[0].title).toBe('搞笑新闻标题1');
    });

    it('should respect limit option', async () => {
      const articles = await huxiuSource.fetch({ limit: 10 });
      expect(articles).toHaveLength(10);
    });

    it('should default limit to 20', async () => {
      const articles = await huxiuSource.fetch();
      expect(articles.length).toBeLessThanOrEqual(20);
    });

    it('should filter by keyword', async () => {
      const articles = await huxiuSource.fetch({ keyword: '标题5' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles.every((a) => a.title.includes('标题5'))).toBe(true);
    });

    it('should support keyword OR logic', async () => {
      const articles = await huxiuSource.fetch({ keyword: '标题1,标题2' });
      expect(articles.length).toBeGreaterThanOrEqual(1);
      expect(
        articles.every(
          (a) => a.title.includes('标题1') || a.title.includes('标题2'),
        ),
      ).toBe(true);
    });

    it('should return empty for non-matching keyword', async () => {
      const articles = await huxiuSource.fetch({
        keyword: '火星人攻打地球全攻略',
      });
      expect(articles).toEqual([]);
    });
  });

  describe('pagination', () => {
    it('should paginate when first page has less than limit', async () => {
      vi.restoreAllMocks();

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            new Response(
              JSON.stringify(
                makeArticleResponse(
                  [makeItem(10001, '第一页新闻'), makeItem(10002, '第一页新闻2')],
                  1781610000,
                ),
              ),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          );
        }
        return Promise.resolve(
          new Response(
            JSON.stringify(
              makeArticleResponse(
                Array.from({ length: 20 }, (_, i) =>
                  makeItem(20000 + i, `第二页新闻${i + 1}`),
                ),
                0,
              ),
            ),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      });

      const articles = await huxiuSource.fetch({ limit: 10 });
      expect(callCount).toBe(2);
      expect(articles.length).toBeGreaterThanOrEqual(3);
    });

    it('should deduplicate by aid across pages', async () => {
      vi.restoreAllMocks();

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        // 故意返回跟第一页重复的数据
        return Promise.resolve(
          new Response(
            JSON.stringify(
              makeArticleResponse(
                [makeItem(10001, '重复新闻')],
                0,
              ),
            ),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      });

      const articles = await huxiuSource.fetch({ limit: 5 });
      // 第二页全是重复 → 应该只有第一页的数据（或0如果第一页没mock）
      expect(articles.length).toBeLessThanOrEqual(1);
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });
});
