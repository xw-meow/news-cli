import { describe, it, expect, vi } from 'vitest';
import { runSequentially } from '../scripts/orchestrate.js';

describe('runSequentially', () => {
  it(' mock 执行全流程', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const result = await runSequentially('写一份 AI 日报');
    expect(typeof result).toBe('string');
    vi.unstubAllGlobals();
  });
});
