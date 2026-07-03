import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { SourcePlan } from './plan.js';

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  snippet: string;
  publishedAt: string | null;
  category: string | null;
  imageUrl: string | null;
}

export function buildCommand(plan: SourcePlan): string {
  const parts = ['news', 'get', plan.name];
  if (plan.category) parts.push('-c', plan.category);
  parts.push('-l', String(plan.limit));
  if (plan.keywords) parts.push('-k', `"${plan.keywords}"`);
  parts.push('--json');
  return parts.join(' ');
}

export function fetchSource(plan: SourcePlan): NewsArticle[] {
  const cmd = buildCommand(plan);
  const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  return JSON.parse(output) as NewsArticle[];
}

export function fetchSourceToFile(plan: SourcePlan, outDir = './tmp'): string {
  const articles = fetchSource(plan);
  const path = `${outDir}/raw-${plan.name}.json`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(articles, null, 2), 'utf8');
  return path;
}
