#!/usr/bin/env node
// skills/professional-daily-report/scripts/dedup-articles.js
// Merges ./tmp/raw-*.json, deduplicates, filters by today, filters by keywords,
// scores, and writes ./tmp/selected-articles.json.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const TMP_DIR = './tmp';
const PLAN_FILE = join(TMP_DIR, 'report-plan.json');
const OUT_FILE = join(TMP_DIR, 'selected-articles.json');

// Source preference: higher = more authoritative for a professional report.
const SOURCE_WEIGHT = {
  'google-news': 7,
  'google-news-cn': 7,
  bbc: 7,
  chinanews: 7,
  pengpai: 7,
  cls: 7,
  yicai: 7,
  peoplecn: 6,
  'tencent-news': 6,
  '36kr': 6,
  huxiu: 6,
  sspai: 6,
  ithome: 5,
  aibase: 5,
  autohome: 5,
  weibo: 4,
  hackernews: 5,
};

function readPlan() {
  if (!existsSync(PLAN_FILE)) throw new Error(`Plan file not found: ${PLAN_FILE}`);
  return JSON.parse(readFileSync(PLAN_FILE, 'utf8'));
}

function readRawArticles() {
  if (!existsSync(TMP_DIR)) return [];
  const files = readdirSync(TMP_DIR).filter((f) => f.startsWith('raw-') && f.endsWith('.json'));
  const all = [];
  for (const file of files) {
    const path = join(TMP_DIR, file);
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      if (Array.isArray(data)) all.push(...data);
    } catch (err) {
      console.error(`[dedup] skip ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return all;
}

function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ca = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const cb = b[j - 1];
      curr[j] =
        ca === cb
          ? prev[j - 1]
          : Math.min(prev[j - 1] + 1, Math.min(curr[j - 1] + 1, prev[j] + 1));
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return curr[n];
}

function titleSimilarity(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getLocalDateString(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTodayDateString() {
  return getLocalDateString(new Date());
}

function urlDedup(articles) {
  const map = new Map();
  for (const art of articles) {
    const url = art.url;
    if (!url) continue;
    const existing = map.get(url);
    if (!existing) {
      map.set(url, art);
    } else {
      const d1 = parseDate(art.publishedAt);
      const d2 = parseDate(existing.publishedAt);
      if (d1 && (!d2 || d1 > d2)) map.set(url, art);
    }
  }
  return Array.from(map.values());
}

function titleDedup(articles, threshold = 0.85) {
  const remaining = [...articles];
  const groups = [];
  while (remaining.length > 0) {
    const head = remaining.shift();
    const group = [head];
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (titleSimilarity(head.title, remaining[i].title) >= threshold) {
        group.push(remaining.splice(i, 1)[0]);
      }
    }
    groups.push(group);
  }
  return groups.map((group) => {
    group.sort((a, b) => {
      const da = parseDate(a.publishedAt);
      const db = parseDate(b.publishedAt);
      if (da && db) return db - da;
      if (da) return -1;
      if (db) return 1;
      return 0;
    });
    return group[0];
  });
}

function todayFilter(articles, planDate) {
  const targetDate = planDate || getTodayDateString();
  const before = articles.length;
  const filtered = articles.filter((art) => {
    const pub = parseDate(art.publishedAt);
    if (!pub) return false;
    return getLocalDateString(pub) === targetDate;
  });
  console.error(`[dedup] today filter (${targetDate}): ${filtered.length}/${before}`);
  return filtered;
}

function keywordFilter(articles, keywords) {
  if (!keywords || keywords.length === 0) return articles;
  const terms = keywords.map((k) => String(k).toLowerCase());
  return articles.filter((art) => {
    const text = `${art.title || ''} ${art.snippet || ''}`.toLowerCase();
    return terms.some((t) => text.includes(t));
  });
}

function scoreArticle(art, keywords) {
  let score = 0;

  // Recency: newer is better, decay over 7 days.
  const pub = parseDate(art.publishedAt);
  if (pub) {
    const hoursAgo = (Date.now() - pub.getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 100 - hoursAgo * 0.6);
  }

  // Source authority.
  const source = String(art.source || '').toLowerCase();
  score += SOURCE_WEIGHT[source] || 5;

  // Keyword relevance in title.
  if (keywords && keywords.length > 0) {
    const title = String(art.title || '').toLowerCase();
    for (const kw of keywords) {
      if (title.includes(String(kw).toLowerCase())) score += 10;
    }
  }

  return score;
}

function selectArticles(articles, plan) {
  let result = urlDedup(articles);
  result = titleDedup(result);
  result = todayFilter(result, plan.date);
  result = keywordFilter(result, plan.keywords);
  result.forEach((art) => {
    art._score = scoreArticle(art, plan.keywords);
  });
  result.sort((a, b) => b._score - a._score);
  const target = Math.max(1, plan.targetCount || 10);
  const selected = result.slice(0, target);

  // Clean internal fields.
  selected.forEach((art) => delete art._score);

  return selected;
}

function main() {
  const plan = readPlan();
  const articles = readRawArticles();
  console.error(`[dedup] merged ${articles.length} articles`);

  const selected = selectArticles(articles, plan);
  console.error(`[dedup] selected ${selected.length} articles`);

  const output = {
    plan,
    articles: selected,
  };
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
}

main();
