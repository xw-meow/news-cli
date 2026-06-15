import { describe, it, expect, beforeEach } from 'vitest';
import { registerSource, getSource, listSources, clearSources } from '../../src/core/registry.js';
import type { NewsSource, NewsArticle, FetchOptions } from '../../src/core/types.js';

function makeMockSource(name: string): NewsSource {
  return {
    name,
    description: `Mock source: ${name}`,
    async listCategories() { return []; },
    async fetch(_opts?: FetchOptions): Promise<NewsArticle[]> { return []; },
  };
}

describe('registry', () => {
  beforeEach(() => {
    // 每个测试前清空注册表
    clearSources();
  });

  describe('registerSource', () => {
    it('should register a source and make it retrievable', () => {
      const src = makeMockSource('test-source');
      registerSource(src);
      expect(getSource('test-source')).toBe(src);
    });

    it('should throw when registering a duplicate name', () => {
      registerSource(makeMockSource('dup'));
      expect(() => registerSource(makeMockSource('dup'))).toThrow(
        'Source "dup" already registered',
      );
    });
  });

  describe('getSource', () => {
    it('should return undefined for unknown source', () => {
      expect(getSource('nonexistent')).toBeUndefined();
    });
  });

  describe('listSources', () => {
    it('should return empty array when no sources registered', () => {
      expect(listSources()).toEqual([]);
    });

    it('should return all registered sources', () => {
      const a = makeMockSource('a');
      const b = makeMockSource('b');
      registerSource(a);
      registerSource(b);
      expect(listSources()).toEqual([a, b]);
    });
  });
});
