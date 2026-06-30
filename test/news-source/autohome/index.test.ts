import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { autohomeSource } from '../../../src/news-source/autohome/index.js';

function makePageHtml(articleCount: number, startIndex = 0): string {
  const items: string[] = [];
  for (let i = 0; i < articleCount; i++) {
    const idx = startIndex + i;
    items.push(`
      <li>
        <a href="//www.autohome.com.cn/news/202506/${String(idx).padStart(7, '0')}.html#pvareaid=102624">
          <img src="//img3.autoimg.cn/chejiahaodfs/thumb_${idx}.png">
          <h3>汽车新闻标题 ${idx}</h3>
          <div class="meta"><span>${(idx % 24) + 1}小时前</span></div>
          <p>[汽车之家 行业] 这是第${idx}条新闻的摘要内容</p>
        </a>
      </li>`);
  }
  return `<html><body><ul>${items.join('\n')}</ul></body></html>`;
}

function mockFetchHTML(html: string) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve(
      new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    ),
  );
}

describe('autohomeSource', () => {
  beforeEach(() => {
    mockFetchHTML(makePageHtml(25));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "autohome"', () => {
    expect(autohomeSource.name).toBe('autohome');
  });

  it('should have a description', () => {
    expect(autohomeSource.description).toBeTruthy();
    expect(autohomeSource.description).toContain('汽车之家');
  });

  describe('listCategories', () => {
    it('should return 11 categories', async () => {
      const cats = await autohomeSource.listCategories();
      expect(cats).toHaveLength(11);
      expect(cats).toContain('最新');
      expect(cats).toContain('车闻');
      expect(cats).toContain('导购');
      expect(cats).toContain('行业');
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await autohomeSource.fetch();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].source).toBe('汽车之家');
      expect(articles[0].title).toContain('汽车新闻标题');
    });

    it('should respect limit option', async () => {
      const articles = await autohomeSource.fetch({ limit: 10 });
      expect(articles).toHaveLength(10);
    });

    it('should default limit to 20', async () => {
      const articles = await autohomeSource.fetch();
      expect(articles.length).toBeLessThanOrEqual(20);
    });

    it('should set category on articles', async () => {
      const articles = await autohomeSource.fetch({ category: '车闻' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].category).toBe('车闻');
    });

    it('should default category to 最新', async () => {
      const articles = await autohomeSource.fetch();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].category).toBe('最新');
    });

    it('should fallback to 最新 for unknown category', async () => {
      const articles = await autohomeSource.fetch({ category: '不存在的分类' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].category).toBe('最新');
    });

    it('should filter by keyword', async () => {
      vi.restoreAllMocks();
      const html = `
        <li>
          <a href="//www.autohome.com.cn/news/202506/001.html#pvareaid=102624">
            <h3>特斯拉发布新车型</h3>
            <div class="meta"><span>1小时前</span></div>
          </a>
        </li>
        <li>
          <a href="//www.autohome.com.cn/news/202506/002.html#pvareaid=102624">
            <h3>比亚迪销量创新高</h3>
            <div class="meta"><span>2小时前</span></div>
          </a>
        </li>`;

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } }),
          );
        }
        // 后续页面返回空，阻止翻页
        return Promise.resolve(
          new Response('', { status: 200, headers: { 'Content-Type': 'text/html' } }),
        );
      });

      const articles = await autohomeSource.fetch({ keyword: '特斯拉' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toContain('特斯拉');
    });

    it('should support keyword OR logic', async () => {
      vi.restoreAllMocks();
      const html = `
        <li>
          <a href="//www.autohome.com.cn/news/202506/001.html#pvareaid=102624">
            <h3>特斯拉发布新车型</h3>
            <div class="meta"><span>1小时前</span></div>
          </a>
        </li>
        <li>
          <a href="//www.autohome.com.cn/news/202506/002.html#pvareaid=102624">
            <h3>比亚迪销量创新高</h3>
            <div class="meta"><span>2小时前</span></div>
          </a>
        </li>
        <li>
          <a href="//www.autohome.com.cn/news/202506/003.html#pvareaid=102624">
            <h3>蔚来换电站突破</h3>
            <div class="meta"><span>3小时前</span></div>
          </a>
        </li>`;

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } }),
          );
        }
        return Promise.resolve(
          new Response('', { status: 200, headers: { 'Content-Type': 'text/html' } }),
        );
      });

      const articles = await autohomeSource.fetch({ keyword: '特斯拉,比亚迪' });
      expect(articles.length).toBe(2);
      expect(articles.every((a) => a.title.includes('特斯拉') || a.title.includes('比亚迪'))).toBe(true);
    });

    it('should return empty array for no matching keyword', async () => {
      const articles = await autohomeSource.fetch({ keyword: '火星人攻打地球' });
      expect(articles).toEqual([]);
    });

    it('should generate unique IDs for articles', async () => {
      const articles = await autohomeSource.fetch({ limit: 5 });
      expect(articles).toHaveLength(5);
      const ids = new Set(articles.map((a) => a.id));
      expect(ids.size).toBe(5);
    });
  });

  describe('pagination', () => {
    it('should fetch multiple pages when first page has too few articles', async () => {
      vi.restoreAllMocks();

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            new Response(makePageHtml(8, 0), {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            }),
          );
        }
        if (callCount === 2) {
          return Promise.resolve(
            new Response(makePageHtml(8, 8), {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            }),
          );
        }
        return Promise.resolve(
          new Response(makePageHtml(8, 16), {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        );
      });

      const articles = await autohomeSource.fetch({ limit: 20 });
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(articles.length).toBeGreaterThanOrEqual(16);
    });

    it('should stop pagination when page returns empty', async () => {
      vi.restoreAllMocks();

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            new Response(makePageHtml(5, 0), {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            }),
          );
        }
        // Page 2 returns empty
        return Promise.resolve(
          new Response('<html><body><ul></ul></body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        );
      });

      const articles = await autohomeSource.fetch({ limit: 20 });
      expect(callCount).toBe(2); // Only 2 pages: first has articles, second is empty
      expect(articles).toHaveLength(5);
    });
  });
});
