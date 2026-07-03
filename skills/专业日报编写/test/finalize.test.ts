import { describe, it, expect } from 'vitest';
import { finalizeReport } from '../scripts/finalize.js';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('finalizeReport', () => {
  it('写入文件并自动创建父目录', () => {
    const dir = join(tmpdir(), `news-cli-skill-test-${Date.now()}`);
    const path = join(dir, 'sub', 'report.md');
    finalizeReport('hello world', path);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toBe('hello world');
    rmSync(dir, { recursive: true, force: true });
  });
});
