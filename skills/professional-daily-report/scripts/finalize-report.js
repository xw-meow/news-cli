#!/usr/bin/env node
// skills/professional-daily-report/scripts/finalize-report.js
// Reads ./tmp/report-content.md + ./tmp/selected-articles.json,
// prepends metadata and appends source stats / generation footer,
// then writes the final file named in report-plan.json.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const TMP_DIR = './tmp';
const PLAN_FILE = join(TMP_DIR, 'report-plan.json');
const CONTENT_FILE = join(TMP_DIR, 'report-content.md');
const SELECTED_FILE = join(TMP_DIR, 'selected-articles.json');

function readPlan() {
  if (!existsSync(PLAN_FILE)) throw new Error(`Plan file not found: ${PLAN_FILE}`);
  return JSON.parse(readFileSync(PLAN_FILE, 'utf8'));
}

function readSelected() {
  if (!existsSync(SELECTED_FILE)) throw new Error(`Selected file not found: ${SELECTED_FILE}`);
  return JSON.parse(readFileSync(SELECTED_FILE, 'utf8'));
}

function readContent() {
  if (!existsSync(CONTENT_FILE)) throw new Error(`Content file not found: ${CONTENT_FILE}`);
  return readFileSync(CONTENT_FILE, 'utf8');
}

function countBySource(articles) {
  const counts = {};
  for (const art of articles) {
    const s = art.source || 'unknown';
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

function formatDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateTime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function buildSourceStats(articles) {
  const counts = countBySource(articles);
  const lines = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => `- ${source}: ${count} 条`);
  return lines.join('\n');
}

function main() {
  const plan = readPlan();
  const { articles } = readSelected();
  const body = readContent();

  const outputFile = plan.outputFile || `./daily-report-${formatDate(new Date())}.md`;
  const parentDir = dirname(outputFile);
  if (parentDir && !existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });

  const metadata = `---
topic: ${plan.topic}
audience: ${plan.audience || '对该主题感兴趣的读者'}
style: ${plan.style || '平衡'}
length: ${plan.length || '中'}
keywords: ${(plan.keywords || []).join(', ')}
generatedAt: ${formatDateTime(new Date())}
totalArticles: ${articles.length}
---

`;

  const sourceStats = buildSourceStats(articles);
  const footer = `

---

生成于 ${formatDateTime(new Date())} · 由 news-cli + professional-daily-report skill 生成
`;

  const finalContent = metadata + body + footer;
  writeFileSync(outputFile, finalContent, 'utf8');
  console.error(`[finalize] wrote ${outputFile} (${articles.length} articles)`);
}

main();
