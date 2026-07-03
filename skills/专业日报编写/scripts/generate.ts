import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { SelectedArticles } from './dedup.js';

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function renderArticle(a: SelectedArticles['articles'][number], topic: string): string {
  const category = a.category ? ` · ${a.category}` : '';
  return `### ${a.title}\n\n${a.snippet || '暂无摘要'}\n\n> 该消息来自 ${a.source}${category}，与 ${topic} 主题相关。\n\n[原文链接](${a.url})\n`;
}

export function generateReport(data: SelectedArticles): string {
  const { plan, articles } = data;
  const lines: string[] = [];
  lines.push(`# ${plan.topic} · ${todayStr()}`);
  lines.push('');
  lines.push(`> 读者：${plan.audience} | 风格：${plan.style} | 共 ${articles.length} 条`);
  lines.push('');
  lines.push('## 导语');
  lines.push('');
  lines.push(`以下是今日 ${plan.topic} 的核心动态，涵盖 ${articles.length} 条精选信息。`);
  lines.push('');

  const bySource = groupBy(articles, a => a.source);
  for (const [source, list] of Object.entries(bySource)) {
    lines.push(`## ${source}`);
    lines.push('');
    for (const a of list) {
      lines.push(renderArticle(a, plan.topic));
    }
  }

  lines.push('## 今日来源');
  lines.push('');
  for (const [source, list] of Object.entries(bySource)) {
    lines.push(`- ${source}: ${list.length} 条`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`生成于 ${nowStr()} · 由 news-cli + 专业日报编写 Skill 生成`);
  lines.push('');

  return lines.join('\n');
}

export function writeReport(content: string, path = './tmp/report-content.md'): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}
