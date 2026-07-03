import { describe, it, expect, vi } from 'vitest';
import { execSync } from 'child_process';
import { fetchSource, buildCommand } from '../scripts/fetch.js';

vi.mock('child_process', async (importOriginal) => {
  const mod = await importOriginal<typeof import('child_process')>();
  return {
    ...mod,
    execSync: vi.fn(),
  };
});

describe('buildCommand', () => {
  it('构建无分类的命令', () => {
    const cmd = buildCommand({ name: 'aibase', category: null, limit: 20, keywords: 'AI' });
    expect(cmd).toBe('news get aibase -l 20 -k "AI" --json');
  });

  it('构建带分类的命令', () => {
    const cmd = buildCommand({ name: '36kr', category: 'AI', limit: 10, keywords: null });
    expect(cmd).toBe('news get 36kr -c AI -l 10 --json');
  });
});

describe('fetchSource', () => {
  it('mock 返回 NewsArticle 数组', async () => {
    const mockArticle = { id: '1', title: 'T', url: 'https://example.com', source: 'aibase', snippet: 'S', publishedAt: null, category: null, imageUrl: null };
    vi.mocked(execSync).mockReturnValue(JSON.stringify([mockArticle]));

    const result = await fetchSource({ name: 'aibase', category: null, limit: 20, keywords: null });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('T');
    expect(execSync).toHaveBeenCalledWith('news get aibase -l 20 --json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  });
});
