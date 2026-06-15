import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '../dist/index.js');

function run(args: string): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30_000,
    });
    return { stdout, stderr: '', status: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer; stderr?: Buffer; status?: number };
    return {
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
      status: e.status ?? 1,
    };
  }
}

describe('CLI E2E', () => {
  it('should list available sources', () => {
    const { stdout, status } = run('list');
    expect(status).toBe(0);
    expect(stdout).toContain('google-news');
  });

  it('should list categories for google-news', () => {
    const { stdout, status } = run('categories google-news');
    expect(status).toBe(0);
    expect(stdout).toContain('technology');
    expect(stdout).toContain('business');
  });

  it('should error on unknown source', () => {
    const { stderr, status } = run('get fake-source');
    expect(status).toBe(1);
    expect(stderr).toContain('Unknown source');
  });

  it('should error on invalid --limit', () => {
    const { stderr, status } = run('get google-news --limit abc');
    expect(status).toBe(1);
    expect(stderr).toContain('--limit');
  });

  it('should fetch google-news in table mode (requires network)', async () => {
    const { stdout, status } = run('get google-news --limit 3');
    expect(status).toBe(0);
    expect(stdout.length).toBeGreaterThan(0);
  }, 30_000);

  it('should fetch google-news in JSON mode (requires network)', async () => {
    const { stdout, status } = run('get google-news --limit 2 --json');
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeLessThanOrEqual(2);
  }, 30_000);
});
