import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCRIPT = join(__dirname, '../../../skills/professional-daily-report/scripts/finalize-report.js');

function makeWorkDir() {
  return mkdtempSync(join(tmpdir(), 'finalize-report-'));
}

function runFinalize(cwd) {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function writeFixture(workDir, plan, articles, content) {
  const tmpDir = join(workDir, 'tmp');
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(join(tmpDir, 'report-plan.json'), JSON.stringify(plan), 'utf8');
  writeFileSync(join(tmpDir, 'selected-articles.json'), JSON.stringify({ articles }), 'utf8');

  if (content !== undefined) {
    const contentFile = plan.format === 'html' ? 'report-content.html' : 'report-content.md';
    writeFileSync(join(tmpDir, contentFile), content, 'utf8');
  }
}

describe('finalize-report', () => {
  let workDir;

  beforeEach(() => {
    workDir = makeWorkDir();
  });

  afterEach(() => {
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it('writes the default Markdown report and cleans tmp when format is omitted', () => {
    const plan = {
      topic: 'Markdown Test',
      date: '2026-07-03',
      sources: [{ name: 'aibase' }],
      targetCount: 2,
    };
    const articles = [
      { title: 'Article One', url: 'https://example.com/1', source: 'aibase' },
      { title: 'Article Two', url: 'https://example.com/2', source: 'aibase' },
    ];
    writeFixture(workDir, plan, articles, '# Markdown Test\n\nDaily report body.\n');

    const result = runFinalize(workDir);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('[finalize] wrote daily/docs/daily-report-2026-07-03.md (2 articles)');
    expect(result.stderr).toContain('[finalize] cleaned ./tmp');

    const outputFile = join(workDir, 'daily', 'docs', 'daily-report-2026-07-03.md');
    expect(existsSync(outputFile)).toBe(true);

    const output = readFileSync(outputFile, 'utf8');
    expect(output).toContain('# Markdown Test');
    expect(output).toContain('Daily report body.');
    expect(output).toContain('生成于');
    expect(output).toContain('news-cli + professional-daily-report skill');

    expect(existsSync(join(workDir, 'tmp'))).toBe(false);
  });

  it('writes the default HTML report and skips Markdown footer when format is html', () => {
    const plan = {
      topic: 'HTML Test',
      format: 'html',
      date: '2026-07-03',
      sources: [{ name: 'aibase' }],
      targetCount: 2,
    };
    const articles = [
      { title: 'HTML Article One', url: 'https://example.com/1', source: 'aibase' },
      { title: 'HTML Article Two', url: 'https://example.com/2', source: 'aibase' },
    ];
    const html = '<!DOCTYPE html>\n<html><body><h1>HTML Test</h1></body></html>\n';
    writeFixture(workDir, plan, articles, html);

    const result = runFinalize(workDir);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('[finalize] wrote daily/docs/daily-report-2026-07-03.html (2 articles)');
    expect(result.stderr).toContain('[finalize] cleaned ./tmp');

    const outputFile = join(workDir, 'daily', 'docs', 'daily-report-2026-07-03.html');
    expect(existsSync(outputFile)).toBe(true);

    const output = readFileSync(outputFile, 'utf8');
    expect(output).toContain('<h1>HTML Test</h1>');
    expect(output).not.toContain('生成于');
    expect(output).not.toContain('news-cli + professional-daily-report skill');

    expect(existsSync(join(workDir, 'tmp'))).toBe(false);
  });

  it('honors a custom outputFile path', () => {
    const plan = {
      topic: 'Custom Output',
      format: 'html',
      date: '2026-07-03',
      outputFile: './custom/output/report.html',
      sources: [{ name: 'aibase' }],
      targetCount: 1,
    };
    const articles = [{ title: 'Custom Article', url: 'https://example.com/c', source: 'aibase' }];
    const html = '<!DOCTYPE html>\n<html><body><h1>Custom Output</h1></body></html>\n';
    writeFixture(workDir, plan, articles, html);

    const result = runFinalize(workDir);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('[finalize] wrote ./custom/output/report.html (1 articles)');

    const outputFile = join(workDir, 'custom', 'output', 'report.html');
    expect(existsSync(outputFile)).toBe(true);
    expect(readFileSync(outputFile, 'utf8')).toContain('<h1>Custom Output</h1>');

    expect(existsSync(join(workDir, 'tmp'))).toBe(false);
  });

  it('fails when the Markdown content file is missing', () => {
    const plan = {
      topic: 'Missing Content',
      date: '2026-07-03',
      sources: [{ name: 'aibase' }],
      targetCount: 1,
    };
    const articles = [{ title: 'Only Article', url: 'https://example.com/1', source: 'aibase' }];
    writeFixture(workDir, plan, articles, undefined);

    const result = runFinalize(workDir);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Content file not found');
  });

  it('fails when the HTML content file is missing', () => {
    const plan = {
      topic: 'Missing HTML Content',
      format: 'html',
      date: '2026-07-03',
      sources: [{ name: 'aibase' }],
      targetCount: 1,
    };
    const articles = [{ title: 'Only Article', url: 'https://example.com/1', source: 'aibase' }];
    writeFixture(workDir, plan, articles, undefined);

    const result = runFinalize(workDir);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Content file not found');
  });

  it('fails when the plan file is missing', () => {
    mkdirSync(join(workDir, 'tmp'), { recursive: true });
    writeFileSync(
      join(workDir, 'tmp', 'selected-articles.json'),
      JSON.stringify({ articles: [] }),
      'utf8',
    );

    const result = runFinalize(workDir);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Plan file not found');
  });

  it('fails when selected-articles.json is missing', () => {
    mkdirSync(join(workDir, 'tmp'), { recursive: true });
    writeFileSync(
      join(workDir, 'tmp', 'report-plan.json'),
      JSON.stringify({ topic: 'Missing Selected', date: '2026-07-03' }),
      'utf8',
    );

    const result = runFinalize(workDir);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Selected file not found');
  });
});
