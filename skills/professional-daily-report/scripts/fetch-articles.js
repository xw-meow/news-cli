#!/usr/bin/env node
// skills/professional-daily-report/scripts/fetch-articles.js
// Reads ./tmp/report-plan.json and fetches each source via `news get --json`.
// Writes ./tmp/raw-<source>.json. Errors are logged to stderr and skipped.

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const TMP_DIR = './tmp';
const PLAN_FILE = join(TMP_DIR, 'report-plan.json');

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readPlan() {
  if (!existsSync(PLAN_FILE)) {
    throw new Error(`Plan file not found: ${PLAN_FILE}`);
  }
  return JSON.parse(readFileSync(PLAN_FILE, 'utf8'));
}

function checkNewsAvailable() {
  try {
    execFileSync('news', ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getRepoRoot() {
  let dir = process.cwd();
  while (dir !== dirname(dir)) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (pkg.name === 'news-cli') return dir;
    }
    dir = dirname(dir);
  }
  return null;
}

function installFromRepo(repoRoot) {
  console.error(`[fetch] Detected news-cli repo at ${repoRoot}`);
  execFileSync('npm', ['install'], { cwd: repoRoot, stdio: 'inherit', timeout: 120000 });
  execFileSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit', timeout: 120000 });
  execFileSync('npm', ['link'], { cwd: repoRoot, stdio: 'inherit', timeout: 120000 });
}

function installGlobally() {
  console.error('[fetch] Trying global npm install: npm install -g news-cli');
  execFileSync('npm', ['install', '-g', 'news-cli'], { stdio: 'inherit', timeout: 120000 });
}

function ensureNewsInstalled() {
  if (checkNewsAvailable()) return true;

  console.error('[fetch] `news` command not found. Attempting auto-install...');

  const repoRoot = getRepoRoot();
  if (repoRoot) {
    try {
      installFromRepo(repoRoot);
      if (checkNewsAvailable()) return true;
    } catch (err) {
      console.error(`[fetch] Auto-install from repo failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    installGlobally();
    if (checkNewsAvailable()) return true;
  } catch (err) {
    console.error(`[fetch] Global install failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return false;
}

const DEFAULT_LIMIT = 50;

function fetchSource(source) {
  const args = ['get', source.name, '--json'];
  if (source.category) args.push('-c', source.category);
  const limit = source.limit && source.limit > 0 ? source.limit : DEFAULT_LIMIT;
  args.push('-l', String(limit));
  if (source.keywords && source.keywords.length > 0) {
    args.push('-k', source.keywords);
  }

  const outFile = join(TMP_DIR, `raw-${source.name}.json`);
  try {
    const stdout = execFileSync('news', args, {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: 120000,
    });
    writeFileSync(outFile, stdout, 'utf8');
    const articles = JSON.parse(stdout);
    console.error(`[fetch] ${source.name}: ${articles.length} articles`);
    return { source: source.name, count: articles.length, ok: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[fetch] ${source.name}: FAILED - ${reason}`);
    writeFileSync(outFile, '[]', 'utf8');
    return { source: source.name, count: 0, ok: false, error: reason };
  }
}

function main() {
  ensureDir(TMP_DIR);

  if (!ensureNewsInstalled()) {
    console.error(
      'Error: `news` command is not available and auto-install failed. ' +
        'Please install manually: npm install -g news-cli',
    );
    process.exit(1);
  }

  const plan = readPlan();
  if (!Array.isArray(plan.sources) || plan.sources.length === 0) {
    console.error('Error: report-plan.json has no sources');
    process.exit(1);
  }

  const results = plan.sources.map(fetchSource);
  const okCount = results.filter((r) => r.ok).length;
  const totalCount = results.reduce((sum, r) => sum + r.count, 0);

  console.error(`[fetch] done: ${okCount}/${results.length} sources, ${totalCount} articles total`);
  process.exit(0);
}

main();
