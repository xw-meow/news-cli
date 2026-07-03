import { execFileSync } from 'child_process';
import { parseRequest, writePlan, type PlanResult } from './plan.js';
import { fetchSourceToFile } from './fetch.js';
import { selectArticles, writeSelected, type SelectedArticles } from './dedup.js';
import { generateReport, writeReport } from './generate.js';
import { finalizeReport } from './finalize.js';
import { readFileSync, readdirSync, appendFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import type { NewsArticle } from './fetch.js';

export function checkNewsAvailable(): boolean {
  try {
    execFileSync('news', ['--version'], { encoding: 'utf8', stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function loadRawArticles(tmpDir = './tmp'): NewsArticle[] {
  const files = readdirSync(tmpDir).filter(f => f.startsWith('raw-') && f.endsWith('.json'));
  const articles: NewsArticle[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(`${tmpDir}/${file}`, 'utf8')) as NewsArticle[];
      articles.push(...data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[warning] 跳过损坏文件 "${file}": ${message}`);
      logFetchError(file, message);
    }
  }
  return articles;
}

function ensureTmpDir(tmpDir = './tmp'): void {
  mkdirSync(tmpDir, { recursive: true });
}

function cleanRawFiles(tmpDir = './tmp'): void {
  ensureTmpDir(tmpDir);
  for (const file of readdirSync(tmpDir)) {
    if (file.startsWith('raw-') && file.endsWith('.json')) {
      rmSync(`${tmpDir}/${file}`, { force: true });
    }
  }
}

function clearFetchErrors(tmpDir = './tmp'): void {
  ensureTmpDir(tmpDir);
  writeFileSync(`${tmpDir}/fetch-errors.log`, '', 'utf8');
}

function logFetchError(sourceName: string, message: string, tmpDir = './tmp'): void {
  ensureTmpDir(tmpDir);
  const timestamp = new Date().toISOString();
  appendFileSync(`${tmpDir}/fetch-errors.log`, `[${timestamp}] ${sourceName}: ${message}\n`, 'utf8');
}

export async function runSequentially(request: string): Promise<string> {
  if (!checkNewsAvailable()) {
    throw new Error('news 命令不可用，请先执行 npm run build && npm link');
  }

  const plan = parseRequest(request);
  writePlan(plan);

  cleanRawFiles();
  clearFetchErrors();

  for (const source of plan.sources) {
    try {
      // fetchSourceToFile 是同步函数，直接调用即可
      fetchSourceToFile(source);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[warning] 跳过来源 "${source.name}": ${message}`);
      logFetchError(source.name, message);
    }
  }

  const articles = loadRawArticles();
  const selected = selectArticles(articles, { targetCount: plan.targetCount, keywords: plan.keywords });
  const data: SelectedArticles = { plan, articles: selected };
  writeSelected(data);

  const report = generateReport(data);
  writeReport(report);

  return finalizeReport(report, plan.outputFile);
}

export async function runWithSubagents(_request: string): Promise<string> {
  // 由 SKILL.md 中的 SOP 指导，通过 OpenCode task 工具派发各阶段子代理。
  // 此函数作为类型占位，实际逻辑在 SKILL.md 的 SOP 中描述。
  throw new Error('子代理模式由 SKILL.md SOP 直接调度，不通过本函数执行');
}
