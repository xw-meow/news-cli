import { describe, it, expect } from 'vitest';
import { parseHTML } from '../../../src/news-source/baidu-news/parser.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, '../../fixtures/baidu-news.html');
const html = fs.readFileSync(fixturePath, 'utf-8');

describe('parseHTML (baidu-news)', () => {
  it('should parse HTML into NewsArticle array', () => {
    const articles = parseHTML(html, 'guonei', 'https://news.baidu.com');
    expect(articles.length).toBeGreaterThan(0);
  });

  it('should extract titles from links', () => {
    const articles = parseHTML(html, 'guonei', 'https://news.baidu.com');
    const titles = articles.map((a) => a.title);
    expect(titles.some((t) => t.includes('中国航天'))).toBe(true);
    expect(titles.some((t) => t.includes('人工智能'))).toBe(true);
  });

  it('should set category from argument', () => {
    const articles = parseHTML(html, 'tech', 'https://news.baidu.com');
    articles.forEach((a) => expect(a.category).toBe('tech'));
  });

  it('should generate unique IDs', () => {
    const articles = parseHTML(html, 'guonei', 'https://news.baidu.com');
    const ids = articles.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should resolve relative URLs', () => {
    const articles = parseHTML(html, 'guonei', 'https://news.baidu.com');
    articles.forEach((a) => {
      expect(a.url.startsWith('http')).toBe(true);
    });
  });

  it('should return empty array for empty HTML', () => {
    expect(parseHTML('<html><body></body></html>', 'guonei', 'https://news.baidu.com')).toEqual([]);
  });

  it('should parse Chinese datetime', () => {
    const articles = parseHTML(html, 'guonei', 'https://news.baidu.com');
    const withTime = articles.filter((a) => a.publishedAt);
    expect(withTime.length).toBeGreaterThan(0);
  });

  it('should extract snippet when available', () => {
    const articles = parseHTML(html, 'guonei', 'https://news.baidu.com');
    const withSnippet = articles.filter((a) => a.snippet);
    expect(withSnippet.length).toBeGreaterThan(0);
  });
});
