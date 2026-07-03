import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runSequentially, loadRawArticles } from '../scripts/orchestrate.js';

vi.mock('child_process', async (importOriginal) => {
  const mod = await importOriginal<typeof import('child_process')>();
  return {
    ...mod,
    execFileSync: vi.fn(),
  };
});

vi.mock('../scripts/plan.js', () => ({
  parseRequest: vi.fn(),
  writePlan: vi.fn(),
}));

vi.mock('../scripts/fetch.js', () => ({
  fetchSourceToFile: vi.fn(),
}));

vi.mock('../scripts/dedup.js', () => ({
  selectArticles: vi.fn(),
  writeSelected: vi.fn(),
}));

vi.mock('../scripts/generate.js', () => ({
  generateReport: vi.fn(),
  writeReport: vi.fn(),
}));

vi.mock('../scripts/finalize.js', () => ({
  finalizeReport: vi.fn(),
}));

import { parseRequest, writePlan, type PlanResult } from '../scripts/plan.js';
import { fetchSourceToFile } from '../scripts/fetch.js';
import { selectArticles, writeSelected, type SelectedArticle } from '../scripts/dedup.js';
import { generateReport, writeReport } from '../scripts/generate.js';
import { finalizeReport } from '../scripts/finalize.js';

describe('runSequentially', () => {
  let tmpDir: string;
  let originalCwd: string;

  const request = '写一份 AI 日报';
  const plan: PlanResult = {
    topic: 'AI 日报',
    audience: 'AI 从业者',
    style: '平衡',
    length: '中',
    keywords: ['AI', '大模型'],
    outputFile: './daily-report-2026-07-03.md',
    sources: [
      { name: 'aibase', category: null, limit: 20, keywords: 'AI' },
      { name: '36kr', category: 'AI', limit: 20, keywords: 'AI' },
    ],
    targetCount: 10,
  };

  const selectedArticles: SelectedArticle[] = [
    {
      id: '1',
      title: 'AI News',
      url: 'https://example.com/1',
      source: 'aibase',
      snippet: 'snippet',
      publishedAt: null,
      category: null,
      imageUrl: null,
      selectedReason: '来源权重3，时效分0.00，未命中关键词',
    },
  ];

  const reportContent = '# AI 日报';

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'orchestrate-test-'));
    process.chdir(tmpDir);
    mkdirSync('./tmp', { recursive: true });

    vi.mocked(execFileSync).mockImplementation((cmd: string, args?: readonly string[]) => {
      if (cmd === 'news' && args?.[0] === '--version') return '0.1.0\n';
      return '';
    });

    vi.mocked(parseRequest).mockReturnValue(plan);
    vi.mocked(fetchSourceToFile).mockReturnValue('./tmp/raw-mock.json');
    vi.mocked(selectArticles).mockReturnValue(selectedArticles);
    vi.mocked(generateReport).mockReturnValue(reportContent);
    vi.mocked(finalizeReport).mockReturnValue(plan.outputFile);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('按正确顺序调用各阶段并返回最终输出路径', async () => {
    const result = await runSequentially(request);

    expect(parseRequest).toHaveBeenCalledOnce();
    expect(parseRequest).toHaveBeenCalledWith(request);
    expect(writePlan).toHaveBeenCalledOnce();
    expect(writePlan).toHaveBeenCalledWith(plan);

    expect(fetchSourceToFile).toHaveBeenCalledTimes(plan.sources.length);
    for (const source of plan.sources) {
      expect(fetchSourceToFile).toHaveBeenCalledWith(source);
    }

    expect(selectArticles).toHaveBeenCalledOnce();
    expect(selectArticles).toHaveBeenCalledWith(
      [],
      { targetCount: plan.targetCount, keywords: plan.keywords },
    );
    expect(writeSelected).toHaveBeenCalledOnce();
    expect(writeSelected).toHaveBeenCalledWith(
      expect.objectContaining({ plan, articles: selectedArticles }),
    );
    expect(generateReport).toHaveBeenCalledOnce();
    expect(generateReport).toHaveBeenCalledWith(
      expect.objectContaining({ plan, articles: selectedArticles }),
    );
    expect(writeReport).toHaveBeenCalledOnce();
    expect(writeReport).toHaveBeenCalledWith(reportContent);
    expect(finalizeReport).toHaveBeenCalledOnce();
    expect(finalizeReport).toHaveBeenCalledWith(reportContent, plan.outputFile);
    expect(result).toBe(plan.outputFile);
  });

  it('news 命令不可用时抛出清晰错误', async () => {
    vi.mocked(execFileSync).mockImplementation(() => {
      const err = new Error('command not found');
      (err as NodeJS.ErrnoException).code = 'ENOENT';
      throw err;
    });

    await expect(runSequentially(request)).rejects.toThrow(
      'news 命令不可用，请先执行 npm run build && npm link',
    );
  });
});

describe('loadRawArticles', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'loadraw-test-'));
    process.chdir(tmpDir);
    mkdirSync('./tmp', { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('跳过损坏的 raw 文件并记录错误', () => {
    writeFileSync(
      './tmp/raw-valid.json',
      JSON.stringify([
        {
          id: '1',
          title: 'Valid',
          url: 'https://example.com/1',
          source: 'aibase',
          snippet: 'snippet',
          publishedAt: null,
          category: null,
          imageUrl: null,
        },
      ]),
      'utf8',
    );
    writeFileSync('./tmp/raw-broken.json', 'not json', 'utf8');

    const articles = loadRawArticles();

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Valid');
    const log = readFileSync('./tmp/fetch-errors.log', 'utf8');
    expect(log).toContain('raw-broken.json');
  });
});
