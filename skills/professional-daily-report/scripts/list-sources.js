#!/usr/bin/env node
// skills/professional-daily-report/scripts/list-sources.js
// Runs `news list --json`, saves available sources, and recommends sources
// based on the topic in ./tmp/report-plan.json.

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const TMP_DIR = './tmp';
const PLAN_FILE = join(TMP_DIR, 'report-plan.json');
const OUT_FILE = join(TMP_DIR, 'available-sources.json');

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readPlan() {
  if (!existsSync(PLAN_FILE)) return null;
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
  console.error(`[list-sources] Detected news-cli repo at ${repoRoot}`);
  execFileSync('npm', ['install'], { cwd: repoRoot, stdio: 'inherit', timeout: 120000 });
  execFileSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit', timeout: 120000 });
  execFileSync('npm', ['link'], { cwd: repoRoot, stdio: 'inherit', timeout: 120000 });
}

function installGlobally() {
  console.error('[list-sources] Trying global npm install: npm install -g news-cli');
  execFileSync('npm', ['install', '-g', 'news-cli'], { stdio: 'inherit', timeout: 120000 });
}

function ensureNewsInstalled() {
  if (checkNewsAvailable()) return true;

  console.error('[list-sources] `news` command not found. Attempting auto-install...');

  const repoRoot = getRepoRoot();
  if (repoRoot) {
    try {
      installFromRepo(repoRoot);
      if (checkNewsAvailable()) return true;
    } catch (err) {
      console.error(`[list-sources] Auto-install from repo failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    installGlobally();
    if (checkNewsAvailable()) return true;
  } catch (err) {
    console.error(`[list-sources] Global install failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return false;
}

function listSources() {
  const stdout = execFileSync('news', ['list', '--json'], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
    timeout: 30000,
  });
  const data = JSON.parse(stdout);
  if (!Array.isArray(data)) throw new Error('Unexpected output from `news list --json`');
  return data;
}

function recommendSources(sources, plan) {
  const topic = String(plan?.topic || '').toLowerCase();
  const keywords = (plan?.keywords || []).map((k) => String(k).toLowerCase());

  const matches = (names) =>
    sources.filter((s) => names.includes(s.name.toLowerCase()));

  const topicRules = [
    {
      test: () => topic.includes('ai') || topic.includes('人工智能') || topic.includes('大模型'),
      pick: ['aibase', '36kr', 'tencent-news', 'weibo', 'ithome'],
    },
    {
      test: () => topic.includes('科技') || topic.includes('互联网') || topic.includes('tech'),
      pick: ['ithome', '36kr', 'tencent-news', 'weibo', 'hackernews'],
    },
    {
      test: () => topic.includes('财经') || topic.includes('商业') || topic.includes('金融'),
      pick: ['cls', '36kr', 'yicai', 'tencent-news'],
    },
    {
      test: () => topic.includes('汽车') || topic.includes('新能源'),
      pick: ['autohome', '36kr'],
    },
    {
      test: () => topic.includes('国际') || topic.includes('global') || topic.includes('world'),
      pick: ['bbc', 'google-news', 'hackernews'],
    },
  ];

  let recommended = [];
  for (const rule of topicRules) {
    if (rule.test()) {
      recommended = matches(rule.pick);
      break;
    }
  }

  if (recommended.length === 0) {
    // Fallback: keyword-based or general sources.
    const general = ['pengpai', 'chinanews', 'weibo', 'google-news-cn', 'tencent-news'];
    recommended = matches(general);
  }

  // If keywords are very specific, also include sources that likely cover them.
  if (keywords.length > 0 && recommended.length < 3) {
    const all = sources.filter((s) => !recommended.find((r) => r.name === s.name));
    recommended.push(...all.slice(0, 3));
  }

  // Ensure we do not recommend sources that are not installed.
  const availableNames = new Set(sources.map((s) => s.name.toLowerCase()));
  recommended = recommended.filter((s) => availableNames.has(s.name.toLowerCase()));

  return recommended.slice(0, 6);
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
  const sources = listSources();
  const recommended = recommendSources(sources, plan);

  const output = {
    available: sources.map((s) => ({ name: s.name, description: s.description })),
    recommended: recommended.map((s) => ({ name: s.name, description: s.description })),
    plan: plan || null,
  };

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.error(`[list-sources] found ${sources.length} sources, recommended ${recommended.length}`);
  for (const s of recommended) {
    console.error(`[list-sources]   - ${s.name}: ${s.description}`);
  }
}

main();
