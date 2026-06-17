import { describe, it, expect } from 'vitest';
import {
  extractList,
  parseArticles,
  listCategories,
} from '../../../src/news-source/yicai/parser.js';
import type { YicaiNewsItem } from '../../../src/news-source/yicai/parser.js';

const makeItem = (overrides: Partial<YicaiNewsItem> = {}): YicaiNewsItem => ({
  NewsID: 103233716,
  NewsTitle: '程序员深夜写bug被自家猫强制关机',
  NewsNotes: '猫咪表示代码质量太差看不下去了',
  NewsThumbs: '2026/06/abc123.jpg',
  CreateDate: '2026-06-17T10:16:13',
  url: '/news/103233716.html',
  originPic: 'https://imgcdn.yicai.com/uppics/slides/2026/06/abc.jpg',
  ...overrides,
});

const SCRIPT_HTML = `
<script>
  headList = [{"NewsID":1,"NewsTitle":"头条新闻标题","CreateDate":"2026-06-17T08:00:00","url":"/news/1.html","originPic":"https://imgcdn.yicai.com/uppics/slides/1.jpg"}];
  latestList = [{"NewsID":2,"NewsTitle":"最新新闻标题","NewsNotes":"摘要内容","CreateDate":"2026-06-17T10:00:00","url":"/news/2.html"}];
</script>
`;

describe('extractList', () => {
  it('should extract headList', () => {
    const list = extractList(SCRIPT_HTML, 'headList');
    expect(list).toHaveLength(1);
    expect(list[0].NewsTitle).toBe('头条新闻标题');
  });

  it('should extract latestList', () => {
    const list = extractList(SCRIPT_HTML, 'latestList');
    expect(list).toHaveLength(1);
    expect(list[0].NewsTitle).toBe('最新新闻标题');
  });

  it('should return empty array for missing variable', () => {
    expect(extractList(SCRIPT_HTML, 'nonExistent')).toEqual([]);
  });

  it('should return empty array for empty HTML', () => {
    expect(extractList('', 'headList')).toEqual([]);
  });
});

describe('parseArticles', () => {
  it('should parse articles from items', () => {
    const articles = parseArticles([makeItem(), makeItem({ NewsID: 99999, NewsTitle: '第二个新闻' })], '最新');
    expect(articles).toHaveLength(2);
  });

  it('should extract title', () => {
    const articles = parseArticles([makeItem()], '最新');
    expect(articles[0].title).toBe('程序员深夜写bug被自家猫强制关机');
  });

  it('should construct full URL from relative path', () => {
    const articles = parseArticles([makeItem()], '最新');
    expect(articles[0].url).toBe('https://www.yicai.com/news/103233716.html');
  });

  it('should set source to 第一财经', () => {
    const articles = parseArticles([makeItem()], '最新');
    expect(articles[0].source).toBe('第一财经');
  });

  it('should set category', () => {
    const articles = parseArticles([makeItem()], '头条');
    expect(articles[0].category).toBe('头条');
  });

  it('should parse CreateDate to ISO', () => {
    const articles = parseArticles([makeItem()], '最新');
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should leave publishedAt undefined if no CreateDate', () => {
    const articles = parseArticles([makeItem({ CreateDate: undefined })], '最新');
    expect(articles[0].publishedAt).toBeUndefined();
  });

  it('should extract snippet from NewsNotes', () => {
    const articles = parseArticles([makeItem()], '最新');
    expect(articles[0].snippet).toBe('猫咪表示代码质量太差看不下去了');
  });

  it('should leave snippet undefined if no NewsNotes', () => {
    const articles = parseArticles([makeItem({ NewsNotes: undefined })], '最新');
    expect(articles[0].snippet).toBeUndefined();
  });

  it('should generate unique SHA-256 IDs', () => {
    const articles = parseArticles([
      makeItem(),
      makeItem({ NewsID: 88888, url: '/news/88888.html' }),
    ], '最新');
    expect(articles[0].id).toHaveLength(12);
    expect(articles[1].id).toHaveLength(12);
    expect(articles[0].id).not.toBe(articles[1].id);
  });

  it('should use originPic as imageUrl', () => {
    const articles = parseArticles([makeItem()], '最新');
    expect(articles[0].imageUrl).toBe('https://imgcdn.yicai.com/uppics/slides/2026/06/abc.jpg');
  });

  it('should fallback to NewsThumbs for imageUrl', () => {
    const articles = parseArticles([makeItem({ originPic: undefined, NewsThumbs: 'thumbs/thumb.jpg' })], '最新');
    expect(articles[0].imageUrl).toBe('https://imgcdn.yicai.com/uppics/thumbs/thumbs/thumb.jpg');
  });

  it('should leave imageUrl undefined if no image fields', () => {
    const articles = parseArticles([makeItem({ originPic: undefined, NewsThumbs: undefined })], '最新');
    expect(articles[0].imageUrl).toBeUndefined();
  });
});

describe('listCategories', () => {
  it('should return 头条 and 最新', () => {
    expect(listCategories()).toEqual(['头条', '最新']);
  });
});
