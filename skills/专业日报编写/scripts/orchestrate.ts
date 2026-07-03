import { execSync } from 'child_process';
import { parseRequest, writePlan, type PlanResult } from './plan.js';
import { fetchSourceToFile } from './fetch.js';
import { selectArticles, writeSelected, type SelectedArticles } from './dedup.js';
import { generateReport, writeReport } from './generate.js';
import { finalizeReport } from './finalize.js';
import { readFileSync, readdirSync } from 'fs';
import type { NewsArticle } from './fetch.js';

export function checkNewsAvailable(): boolean {
  try {
    execSync('news --version', { encoding: 'utf8', stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function loadRawArticles(tmpDir = './tmp'): NewsArticle[] {
  const files = readdirSync(tmpDir).filter(f => f.startsWith('raw-') && f.endsWith('.json'));
  const articles: NewsArticle[] = [];
  for (const file of files) {
    const data = JSON.parse(readFileSync(`${tmpDir}/${file}`, 'utf8')) as NewsArticle[];
    articles.push(...data);
  }
  return articles;
}

export async function runSequentially(request: string): Promise<string> {
  if (!checkNewsAvailable()) {
    throw new Error('news 命令不可用，请先执行 npm run build && npm link');
  }

  const plan = parseRequest(request);
  writePlan(plan);

  for (const source of plan.sources) {
    fetchSourceToFile(source);
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
