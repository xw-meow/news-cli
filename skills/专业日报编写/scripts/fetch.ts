import { execFileSync } from 'child_process';
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

export function buildArgs(plan: SourcePlan): string[] {
  const args = ['get', plan.name];
  if (plan.category) args.push('-c', plan.category);
  args.push('-l', String(plan.limit));
  if (plan.keywords) args.push('-k', plan.keywords);
  args.push('--json');
  return args;
}

export function fetchSource(plan: SourcePlan): NewsArticle[] {
  try {
    execFileSync('news', ['--version'], { encoding: 'utf8', stdio: 'ignore' });
  } catch {
    throw new Error(
      'The `news` CLI is not available in PATH. Please run `npm run build && npm link` from the project root.',
    );
  }

  const args = buildArgs(plan);
  let output: string;
  try {
    output = execFileSync('news', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    const status = err instanceof Error && 'status' in err ? (err as { status: number | null }).status : null;
    const stderr = err instanceof Error && 'stderr' in err ? String((err as { stderr: Buffer | string }).stderr) : '';
    const detail = `exit code ${status ?? 'unknown'}${stderr ? `, stderr: ${stderr.trim()}` : ''}`;
    throw new Error(`Failed to fetch source "${plan.name}" (${detail})`);
  }

  try {
    return JSON.parse(output) as NewsArticle[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse news output as JSON for source "${plan.name}": ${message}`);
  }
}

export function fetchSourceToFile(plan: SourcePlan, outDir = './tmp'): string {
  const articles = fetchSource(plan);
  const path = `${outDir}/raw-${plan.name}.json`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(articles, null, 2), 'utf8');
  return path;
}
