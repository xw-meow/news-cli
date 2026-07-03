#!/usr/bin/env node
// skills/professional-daily-report/scripts/finalize-report.js
// Reads ./tmp/report-content.md + ./tmp/selected-articles.json,
// appends a generation footer, writes the final file named in report-plan.json,
// then cleans up ./tmp.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const TMP_DIR = './tmp';
const DEFAULT_OUTPUT_DIR = './daily/docs';
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

function resolveOutputFile(plan) {
  if (plan.outputFile) return plan.outputFile;

  const dateStr = plan.date || formatDate(new Date());
  return join(DEFAULT_OUTPUT_DIR, `daily-report-${dateStr}.md`);
}

function cleanTmp() {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true });
    console.error(`[finalize] cleaned ${TMP_DIR}`);
  }
}

function main() {
  const plan = readPlan();
  const { articles } = readSelected();
  const body = readContent();

  const outputFile = resolveOutputFile(plan);
  const parentDir = dirname(outputFile);
  if (parentDir && !existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });

  const footer = `

---

生成于 ${formatDateTime(new Date())} · 由 news-cli + professional-daily-report skill 生成
`;

  const finalContent = body + footer;
  writeFileSync(outputFile, finalContent, 'utf8');
  console.error(`[finalize] wrote ${outputFile} (${articles.length} articles)`);

  cleanTmp();
}

main();
