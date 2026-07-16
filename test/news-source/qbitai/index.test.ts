import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { qbitaiSource } from '../../../src/news-source/qbitai/index.js';

function makePageHtml(articleCount: number, startIndex = 0): string {
  const items: string[] = [];
  for (let i = 0; i < articleCount; i++) {
    const idx = startIndex + i;
    items.push(`
      <div class="picture_text">
        <div class="picture"><a href="https://www.qbitai.com/2026/07/${String(idx).padStart(6, '0')}.html"><img src="https://i.qbitai.com/thumb_${idx}.jpeg" /></a></div>
        <div class="text_box">
          <h4><a href="https://www.qbitai.com/2026/07/${String(idx).padStart(6, '0')}.html">量子位新闻标题 ${idx}</a></h4>
          <p><p>这是第${idx}条新闻的摘要内容</p></p>
          <div class="info">
            <span class="author"><a href="/?author=19">量子位</a></span>
            <span class="time">${(idx % 24) + 1}小时前</span>
          </div>
        </div>
      </div>`);
  }
  return `<html><body><div class="article_list">${items.join('\n')}</div></body></html>`;
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

describe('qbitaiSource', () => {
  beforeEach(() => {
    mockFetchHTML(makePageHtml(25));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "qbitai"', () => {
    expect(qbitaiSource.name).toBe('qbitai');
  });

  it('should have a description', () => {
    expect(qbitaiSource.description).toBeTruthy();
    expect(qbitaiSource.description).toContain('量子位');
  });

  describe('listCategories', () => {
    it('should return 4 categories', async () => {
      const cats = await qbitaiSource.listCategories();
      expect(cats).toHaveLength(4);
      expect(cats).toContain('资讯');
      expect(cats).toContain('智能车');
      expect(cats).toContain('智库');
      expect(cats).toContain('活动');
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await qbitaiSource.fetch();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].source).toBe('量子位');
      expect(articles[0].title).toContain('量子位新闻标题');
    });

    it('should respect limit option', async () => {
      const articles = await qbitaiSource.fetch({ limit: 10 });
      expect(articles).toHaveLength(10);
    });

    it('should default limit to 20', async () => {
      const articles = await qbitaiSource.fetch();
      expect(articles.length).toBeLessThanOrEqual(20);
    });

    it('should set category on articles', async () => {
      const articles = await qbitaiSource.fetch({ category: '智能车' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].category).toBe('智能车');
    });

    it('should default category to 资讯', async () => {
      const articles = await qbitaiSource.fetch();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].category).toBe('资讯');
    });

    it('should fallback to 资讯 for unknown category', async () => {
      const articles = await qbitaiSource.fetch({ category: '不存在的分类' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].category).toBe('资讯');
    });

    it('should filter by keyword', async () => {
      vi.restoreAllMocks();
      const html = `
        <div class="article_list">
          <div class="picture_text">
            <div class="text_box">
              <h4><a href="https://www.qbitai.com/2026/07/001.html">OpenAI 发布新模型</a></h4>
              <div class="info"><span class="time">1小时前</span></div>
            </div>
          </div>
          <div class="picture_text">
            <div class="text_box">
              <h4><a href="https://www.qbitai.com/2026/07/002.html">百度发布新产品</a></h4>
              <div class="info"><span class="time">2小时前</span></div>
            </div>
          </div>
        </div>`;

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

      const articles = await qbitaiSource.fetch({ keyword: 'OpenAI' });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toContain('OpenAI');
    });

    it('should support keyword OR logic', async () => {
      vi.restoreAllMocks();
      const html = `
        <div class="article_list">
          <div class="picture_text">
            <div class="text_box">
              <h4><a href="https://www.qbitai.com/2026/07/001.html">OpenAI 发布新模型</a></h4>
              <div class="info"><span class="time">1小时前</span></div>
            </div>
          </div>
          <div class="picture_text">
            <div class="text_box">
              <h4><a href="https://www.qbitai.com/2026/07/002.html">Anthropic 新论文</a></h4>
              <div class="info"><span class="time">2小时前</span></div>
            </div>
          </div>
          <div class="picture_text">
            <div class="text_box">
              <h4><a href="https://www.qbitai.com/2026/07/003.html">具身智能新突破</a></h4>
              <div class="info"><span class="time">3小时前</span></div>
            </div>
          </div>
        </div>`;

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

      const articles = await qbitaiSource.fetch({ keyword: 'OpenAI,Anthropic' });
      expect(articles).toHaveLength(2);
      expect(articles.every((a) => a.title.includes('OpenAI') || a.title.includes('Anthropic'))).toBe(true);
    });

    it('should return empty array for no matching keyword', async () => {
      const articles = await qbitaiSource.fetch({ keyword: '火星人攻打地球' });
      expect(articles).toEqual([]);
    });

    it('should generate unique IDs for articles', async () => {
      const articles = await qbitaiSource.fetch({ limit: 5 });
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

      const articles = await qbitaiSource.fetch({ limit: 20 });
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
        return Promise.resolve(
          new Response('<html><body><div class="article_list"></div></body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        );
      });

      const articles = await qbitaiSource.fetch({ limit: 20 });
      expect(callCount).toBe(2);
      expect(articles).toHaveLength(5);
    });
  });
});
