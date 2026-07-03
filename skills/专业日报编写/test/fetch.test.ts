import { describe, it, expect, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, rmSync } from 'fs';
import { fetchSource, buildArgs, fetchSourceToFile } from '../scripts/fetch.js';

vi.mock('child_process', async (importOriginal) => {
  const mod = await importOriginal<typeof import('child_process')>();
  return {
    ...mod,
    execFileSync: vi.fn(),
  };
});

describe('buildArgs', () => {
  it('构建无分类的参数', () => {
    const args = buildArgs({ name: 'aibase', category: null, limit: 20, keywords: 'AI' });
    expect(args).toEqual(['get', 'aibase', '-l', '20', '-k', 'AI', '--json']);
  });

  it('构建带分类的参数', () => {
    const args = buildArgs({ name: '36kr', category: 'AI', limit: 10, keywords: null });
    expect(args).toEqual(['get', '36kr', '-c', 'AI', '-l', '10', '--json']);
  });
});

describe('fetchSource', () => {
  it('mock 返回 NewsArticle 数组', () => {
    const mockArticle = { id: '1', title: 'T', url: 'https://example.com', source: 'aibase', snippet: 'S', publishedAt: null, category: null, imageUrl: null };
    vi.mocked(execFileSync).mockReturnValue(JSON.stringify([mockArticle]));

    const result = fetchSource({ name: 'aibase', category: null, limit: 20, keywords: null });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('T');
    expect(execFileSync).toHaveBeenCalledWith('news', ['get', 'aibase', '-l', '20', '--json'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  });

  it('news 不可用时抛出清晰错误', () => {
    vi.mocked(execFileSync).mockImplementation((file) => {
      if (file === 'news') {
        const err = new Error('command not found');
        (err as NodeJS.ErrnoException).code = 'ENOENT';
        throw err;
      }
      return '';
    });

    expect(() => fetchSource({ name: 'aibase', category: null, limit: 20, keywords: null })).toThrow(
      'The `news` CLI is not available in PATH. Please run `npm run build && npm link` from the project root.',
    );
  });

  it('execFileSync 非零退出时抛出带上下文的错误', () => {
    vi.mocked(execFileSync).mockImplementation((file, args) => {
      if (args?.[0] === '--version') return '';
      const err = new Error('Command failed');
      Object.assign(err, { status: 1, stderr: Buffer.from('network error') });
      throw err;
    });

    expect(() => fetchSource({ name: 'aibase', category: null, limit: 20, keywords: null })).toThrow(
      'Failed to fetch source "aibase" (exit code 1, stderr: network error)',
    );
  });

  it('JSON 解析失败时抛出带上下文的错误', () => {
    vi.mocked(execFileSync).mockImplementation((file, args) => {
      if (args?.[0] === '--version') return '';
      return 'not-json';
    });

    expect(() => fetchSource({ name: 'aibase', category: null, limit: 20, keywords: null })).toThrow(
      'Failed to parse news output as JSON for source "aibase"',
    );
  });
});

describe('fetchSourceToFile', () => {
  it('将文章写入文件并返回路径', () => {
    const mockArticle = { id: '1', title: 'T', url: 'https://example.com', source: 'aibase', snippet: 'S', publishedAt: null, category: null, imageUrl: null };
    vi.mocked(execFileSync).mockReturnValue(JSON.stringify([mockArticle]));

    const outDir = './tmp-test-fetch';
    const path = fetchSourceToFile({ name: 'aibase', category: null, limit: 20, keywords: null }, outDir);

    expect(existsSync(path)).toBe(true);
    const content = JSON.parse(readFileSync(path, 'utf8')) as unknown[];
    expect(content).toHaveLength(1);
    expect((content[0] as { title: string }).title).toBe('T');
    expect(path).toBe(`${outDir}/raw-aibase.json`);

    rmSync(outDir, { recursive: true, force: true });
  });
});
