import { describe, it, expect } from 'vitest';
import { sources } from './sources';

describe('sources data', () => {
  it('has 17 sources', () => {
    expect(sources).toHaveLength(17);
  });

  it('every source has required fields', () => {
    for (const s of sources) {
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(['RSS', 'JSON', 'HTML']).toContain(s.type);
      expect(Array.isArray(s.categories)).toBe(true);
    }
  });

  it('every source name is unique', () => {
    const names = sources.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
