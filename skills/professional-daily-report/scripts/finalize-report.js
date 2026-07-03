#!/usr/bin/env node
// skills/professional-daily-report/scripts/finalize-report.js
// Reads ./tmp/report-content.{md,html} + ./tmp/selected-articles.json,
// writes the final file named in report-plan.json, then cleans up ./tmp.
// Supports both Markdown and HTML output via report-plan.json.format.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const TMP_DIR = './tmp';
const DEFAULT_OUTPUT_DIR = './daily/docs';
const PLAN_FILE = join(TMP_DIR, 'report-plan.json');
const SELECTED_FILE = join(TMP_DIR, 'selected-articles.json');

function readPlan() {
  if (!existsSync(PLAN_FILE)) throw new Error(`Plan file not found: ${PLAN_FILE}`);
  return JSON.parse(readFileSync(PLAN_FILE, 'utf8'));
}

function readSelected() {
  if (!existsSync(SELECTED_FILE)) throw new Error(`Selected file not found: ${SELECTED_FILE}`);
  return JSON.parse(readFileSync(SELECTED_FILE, 'utf8'));
}

function contentFileFor(plan) {
  return plan.format === 'html'
    ? join(TMP_DIR, 'report-content.html')
    : join(TMP_DIR, 'report-content.md');
}

function defaultExtensionFor(plan) {
  return plan.format === 'html' ? 'html' : 'md';
}

function readContent(plan) {
  const contentFile = contentFileFor(plan);
  if (!existsSync(contentFile)) throw new Error(`Content file not found: ${contentFile}`);
  return readFileSync(contentFile, 'utf8');
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
  const ext = defaultExtensionFor(plan);
  return join(DEFAULT_OUTPUT_DIR, `daily-report-${dateStr}.${ext}`);
}

function buildFooter(plan) {
  if (plan.format === 'html') return '';
  return `

---

生成于 ${formatDateTime(new Date())} · 由 news-cli + professional-daily-report skill 生成
`;
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
  const body = readContent(plan);

  const outputFile = resolveOutputFile(plan);
  const parentDir = dirname(outputFile);
  if (parentDir && !existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });

  const finalContent = body + buildFooter(plan);
  writeFileSync(outputFile, finalContent, 'utf8');
  console.error(`[finalize] wrote ${outputFile} (${articles.length} articles)`);

  cleanTmp();
}

main();
