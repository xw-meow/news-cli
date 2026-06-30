import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { peopleCnSource } from '../../../src/news-source/people-cn/index.js';

function makeHtml(dateStr: string, articleCount: number): string {
  const jokes = [
    '老板说公司像家一样温暖结果真的装了暖气',
    '程序员用代码写情书对方报了个SyntaxError',
    '大爷把扫地机器人当宠物天天带出去遛弯',
    '网友帮同事改PPT改着改着开始写小说',
    '狗子学会了用马桶但坚持要人帮忙冲水',
    '健身房老板跑路会员把器材搬回家抵债',
    '外卖小哥送到时饭凉了结果赔了一首歌',
    '室友在梦里背单词隔壁床跟着学会了',
    '幼儿园让带小鱼结果带了条中华鲟过来',
    'AI大模型学会讲冷笑话后开始怀疑人生',
  ];

  const items = Array.from({ length: articleCount }, (_, i) => {
    const title = jokes[i % jokes.length];
    return `<li><a href="http://politics.people.com.cn/n1/2026/0616/c1001-${String(i).padStart(5, '0')}.html" target="_blank">${title}</a> [${dateStr}日10:00]</li>`;
  }).join('\n');

  return `
    <table id="ta_1" style="display:block;">
      <tr>
        <td class="p6">
          ${items}
        </td>
      </tr>
    </table>`;
}

function mockFetchHTML(html: string) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }),
  );
}

describe('peopleCnSource', () => {
  beforeEach(() => {
    const todayStr = '2026年06月16';
    mockFetchHTML(makeHtml(todayStr, 45));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "people-cn"', () => {
    expect(peopleCnSource.name).toBe('people-cn');
  });

  it('should have a description', () => {
    expect(peopleCnSource.description).toBeTruthy();
    expect(peopleCnSource.description).toContain('人民网');
  });

  describe('listCategories', () => {
    it('should return empty array', async () => {
      const cats = await peopleCnSource.listCategories();
      expect(cats).toEqual([]);
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await peopleCnSource.fetch();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].source).toBe('人民网');
      expect(articles[0].title).toBe('老板说公司像家一样温暖结果真的装了暖气');
    });

    it('should respect limit option', async () => {
      const articles = await peopleCnSource.fetch({ limit: 10 });
      expect(articles).toHaveLength(10);
    });

    it('should default limit to 20', async () => {
      const articles = await peopleCnSource.fetch();
      expect(articles.length).toBeLessThanOrEqual(20);
    });

    it('should filter by keyword', async () => {
      const articles = await peopleCnSource.fetch({ keyword: '狗子' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles.every((a) => a.title.includes('狗子'))).toBe(true);
    });

    it('should support keyword OR logic', async () => {
      const articles = await peopleCnSource.fetch({ keyword: '程序员,外卖' });
      expect(articles.length).toBeGreaterThanOrEqual(1);
      expect(
        articles.every(
          (a) => a.title.includes('程序员') || a.title.includes('外卖'),
        ),
      ).toBe(true);
    });

    it('should return empty array for no matching keyword', async () => {
      const articles = await peopleCnSource.fetch({ keyword: '火星人攻打地球' });
      expect(articles).toEqual([]);
    });

    it('should not set category on articles', async () => {
      const articles = await peopleCnSource.fetch();
      for (const article of articles) {
        expect(article.category).toBeUndefined();
      }
    });
  });

  describe('date backtracking', () => {
    it('should fetch previous days when today has not enough articles', async () => {
      vi.restoreAllMocks();

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            new Response(makeHtml('2026年06月16', 5), {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            }),
          );
        }
        if (callCount === 2) {
          return Promise.resolve(
            new Response(makeHtml('2026年06月15', 10), {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            }),
          );
        }
        return Promise.resolve(
          new Response(makeHtml('2026年06月14', 20), {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        );
      });

      const articles = await peopleCnSource.fetch({ limit: 20 });
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(articles.length).toBeGreaterThanOrEqual(15);
    });
  });
});
