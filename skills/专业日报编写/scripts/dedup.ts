import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { NewsArticle } from './fetch.js';
import type { PlanResult } from './plan.js';

export interface SelectedArticle extends NewsArticle {
  selectedReason: string;
}

export interface SelectedArticles {
  plan: PlanResult;
  articles: SelectedArticle[];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const len = Math.max(a.length, b.length);
  if (len === 0) return 1;
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return 1 - matrix[a.length][b.length] / len;
}

function parseDate(date: string | null): number {
  return date ? new Date(date).getTime() : 0;
}

const sourceWeight: Record<string, number> = {
  aibase: 3,
  '36kr': 3,
  'tencent-news': 3,
  cls: 3,
  yicai: 3,
  pengpai: 2,
  chinanews: 2,
  ithome: 2,
  autohome: 2,
  bbc: 2,
  'google-news': 2,
  'google-news-cn': 2,
  hackernews: 2,
  weibo: 1,
  sspai: 2,
  huxiu: 2,
  'people-cn': 2,
};

export function deduplicate(articles: NewsArticle[]): NewsArticle[] {
  const byUrl = new Map<string, NewsArticle>();
  for (const a of articles) {
    const existing = byUrl.get(a.url);
    if (!existing || parseDate(a.publishedAt) > parseDate(existing.publishedAt)) {
      byUrl.set(a.url, a);
    }
  }

  const list = Array.from(byUrl.values());
  const groups: NewsArticle[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < list.length; i++) {
    if (used.has(i)) continue;
    const group = [list[i]];
    used.add(i);
    for (let j = i + 1; j < list.length; j++) {
      if (used.has(j)) continue;
      if (levenshteinSimilarity(list[i].title, list[j].title) >= 0.85) {
        group.push(list[j]);
        used.add(j);
      }
    }
    group.sort((x, y) => parseDate(y.publishedAt) - parseDate(x.publishedAt));
    groups.push(group);
  }

  return groups.map(g => g[0]);
}

export function filterByKeywords(articles: NewsArticle[], keywords: string[]): NewsArticle[] {
  if (keywords.length === 0) return articles;
  return articles.filter(a => {
    const text = `${a.title} ${a.snippet}`.toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });
}

export interface ScoreBreakdown {
  score: number;
  recencyScore: number;
  sourceScore: number;
  keywordScore: number;
}

function scoreArticleDetailed(a: NewsArticle, keywords: string[], now: number): ScoreBreakdown {
  const age = now - parseDate(a.publishedAt);
  const recencyScore = Math.max(0, 1 - age / (1000 * 60 * 60 * 24 * 7));
  const sourceScore = sourceWeight[a.source] || 1;
  const t = `${a.title} ${a.snippet}`.toLowerCase();
  const keywordScore = keywords.reduce((sum, k) => sum + (t.includes(k.toLowerCase()) ? 1 : 0), 0);
  return {
    score: recencyScore * 3 + sourceScore * 2 + keywordScore,
    recencyScore,
    sourceScore,
    keywordScore,
  };
}

export function scoreArticle(a: NewsArticle, keywords: string[], now = Date.now()): number {
  return scoreArticleDetailed(a, keywords, now).score;
}

function buildReason(s: ScoreBreakdown): string {
  const parts: string[] = [];
  parts.push(`来源权重${s.sourceScore}`);
  parts.push(`时效分${s.recencyScore.toFixed(2)}`);
  if (s.keywordScore > 0) {
    parts.push(`命中${s.keywordScore}个关键词`);
  } else {
    parts.push('未命中关键词');
  }
  return parts.join('，');
}

export function selectArticles(
  articles: NewsArticle[],
  opts: { targetCount: number; keywords: string[] }
): SelectedArticle[] {
  let list = filterByKeywords(articles, opts.keywords);
  list = deduplicate(list);
  list.sort((a, b) => scoreArticle(b, opts.keywords) - scoreArticle(a, opts.keywords));
  const selected = list.slice(0, opts.targetCount);
  return selected.map(a => {
    const s = scoreArticleDetailed(a, opts.keywords, Date.now());
    return {
      ...a,
      selectedReason: buildReason(s),
    };
  });
}

export function writeSelected(data: SelectedArticles, path = './tmp/selected-articles.json'): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}
