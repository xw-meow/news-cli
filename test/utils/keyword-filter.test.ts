import { describe, it, expect } from 'vitest';
import { titleContains } from '../../src/utils/index.js';
import type { NewsArticle } from '../../src/core/types.js';

function makeArticle(title: string): NewsArticle {
  return {
    id: 'test-id',
    title,
    url: 'https://example.com',
    source: 'test',
  };
}

describe('titleContains', () => {
  it('should return true when keyword is empty', () => {
    expect(titleContains(makeArticle('任何标题'), '')).toBe(true);
  });

  it('should match exact keyword case-insensitively', () => {
    expect(titleContains(makeArticle('Hello World'), 'hello')).toBe(true);
    expect(titleContains(makeArticle('hello world'), 'HELLO')).toBe(true);
  });

  it('should support comma-separated OR keywords', () => {
    expect(titleContains(makeArticle('Apple Pie'), 'banana,apple')).toBe(true);
    expect(titleContains(makeArticle('Apple Pie'), 'banana,orange')).toBe(false);
  });

  it('should trim whitespace from keywords', () => {
    expect(titleContains(makeArticle('Hello'), '  hello , world  ')).toBe(true);
  });

  it('should ignore empty terms from trailing commas', () => {
    expect(titleContains(makeArticle('Hello'), 'hello,')).toBe(true);
  });

  it('should return false when no keyword matches', () => {
    expect(titleContains(makeArticle('Hello World'), 'foo')).toBe(false);
  });
});
