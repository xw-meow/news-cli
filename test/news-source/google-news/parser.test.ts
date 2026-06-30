import { describe, it, expect } from 'vitest';
import { parseRSS } from '../../../src/news-source/google-news/parser.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, '../../fixtures/google-news.xml');
const rssXML = fs.readFileSync(fixturePath, 'utf-8');

describe('parseRSS', () => {
  it('should parse RSS XML into NewsArticle array', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles).toHaveLength(3);
  });

  it('should extract title correctly (strip source suffix)', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].title).toBe('Test Article One');
    expect(articles[1].title).toBe('Second Article');
  });

  it('should extract source from <source> element', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].source).toBe('Example Source');
    expect(articles[1].source).toBe('Another Source');
  });

  it('should fall back to "Google News" when no source element', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[2].source).toBe('Google News');
  });

  it('should set the category from the argument', () => {
    const articles = parseRSS(rssXML, 'sports');
    articles.forEach((a) => expect(a.category).toBe('sports'));
  });

  it('should parse publishedAt', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].publishedAt).toBe('2026-06-15T08:00:00.000Z');
  });

  it('should extract snippet from description', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].snippet).toBe('This is the snippet for article one.');
  });

  it('should generate unique id for each article', () => {
    const articles = parseRSS(rssXML, 'technology');
    const ids = articles.map((a) => a.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('should return empty array for empty RSS', () => {
    const emptyRSS = '<rss version="2.0"><channel></channel></rss>';
    expect(parseRSS(emptyRSS, 'technology')).toEqual([]);
  });

  it('should throw NewsCliError on malformed XML', () => {
    expect(() => parseRSS('not xml at all', 'technology')).toThrow();
  });
});
