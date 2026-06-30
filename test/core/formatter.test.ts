import { describe, it, expect } from 'vitest';
import { formatOutput } from '../../src/core/formatter.js';
import type { NewsArticle } from '../../src/core/types.js';

const sampleArticles: NewsArticle[] = [
  {
    id: 'hash1',
    title: 'Test Article One',
    url: 'https://example.com/1',
    source: 'Example Source',
    snippet: 'This is a test.',
    publishedAt: '2026-06-15',
  },
  {
    id: 'hash2',
    title: 'Another Article',
    url: 'https://example.com/2',
    source: 'Other Source',
  },
];

describe('formatOutput', () => {
  describe('JSON mode', () => {
    it('should output formatted JSON string', () => {
      const result = formatOutput(sampleArticles, { json: true });
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].title).toBe('Test Article One');
      expect(parsed[0].id).toBe('hash1');
    });
  });

  describe('table mode', () => {
    it('should include article titles in table output', () => {
      const result = formatOutput(sampleArticles, { json: false });
      expect(result).toContain('Test Article One');
      expect(result).toContain('Another Article');
      expect(result).toContain('Example Source');
    });

    it('should show placeholder for empty list', () => {
      const result = formatOutput([], { json: false });
      expect(result).toBe('(no news)');
    });
  });
});
