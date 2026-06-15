# News CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI tool that fetches news from Google News via RSS, outputs as terminal table or JSON, with an interface-driven architecture for future source expansion.

**Architecture:** Interface-driven with plugin registration. `NewsSource` interface defines the contract; each source in `src/news-source/<name>/` implements it and registers via `registry.ts`. Commander parses CLI args and routes to the correct source. esbuild bundles everything into a single `dist/index.js`.

**Tech Stack:** TypeScript, Node.js ≥ 18, commander, cli-table3, fast-xml-parser, esbuild, vitest, ESLint flat config.

**Key Design Note:** Google News uses RSS feeds (`news.google.com/rss/*`) instead of HTML scraping. RSS is server-rendered, fast, reliable, and doesn't require a headless browser. The spec's "HTML → NewsArticle[]" in parser.ts is realized as "RSS XML → NewsArticle[]" — same interface, same output, more reliable.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/dengwei.daviant/Desktop/for-me/news-cli
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install commander cli-table3 fast-xml-parser
npm install -D typescript @types/node esbuild vitest eslint @eslint/js typescript-eslint tsx
```

- [ ] **Step 3: Write package.json with scripts and metadata**

Replace the generated `package.json`:

```json
{
  "name": "news-cli",
  "version": "0.1.0",
  "description": "CLI tool for fetching news from multiple sources",
  "type": "module",
  "bin": {
    "news": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "node scripts/build.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/ test/",
    "lint:fix": "eslint src/ test/ --fix"
  },
  "keywords": ["news", "cli"],
  "license": "MIT",
  "dependencies": {
    "cli-table3": "^0.6.5",
    "commander": "^13.1.0",
    "fast-xml-parser": "^5.2.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@types/node": "^22.0.0",
    "esbuild": "^0.25.0",
    "eslint": "^9.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 4: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "sourceMap": false,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 5: Write eslint.config.mjs**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/', 'node_modules/'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
);
```

- [ ] **Step 6: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
```

- [ ] **Step 7: Create directory structure**

```bash
mkdir -p src/core src/news-source/google-news src/utils
mkdir -p test/core test/news-source/google-news test/fixtures
```

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json eslint.config.mjs vitest.config.ts
git commit -m "chore: scaffold project with TS, ESLint, vitest configs"
```

---

### Task 2: Core Types

**File:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Write types.ts**

```ts
/** 单条新闻 */
export interface NewsArticle {
  /** URL hash 作为唯一标识 */
  id: string;
  /** 新闻标题 */
  title: string;
  /** 新闻链接 */
  url: string;
  /** 来源名称，如 "Google News" */
  source: string;
  /** 摘要/简介 */
  snippet?: string;
  /** 发布时间 */
  publishedAt?: string;
  /** 分类/板块 */
  category?: string;
  /** 封面图 URL */
  imageUrl?: string;
}

/** 所有新闻源必须实现的统一接口 */
export interface NewsSource {
  /** 源标识，对应 CLI 子命令名，如 "google-news" */
  readonly name: string;
  /** 源描述，用于 help 输出 */
  readonly description: string;
  /** 返回该源支持的分类列表，无分类返回空数组 */
  listCategories(): Promise<string[]>;
  /** 抓取新闻 */
  fetch(options?: FetchOptions): Promise<NewsArticle[]>;
}

/** 抓取参数 */
export interface FetchOptions {
  /** 分类过滤 */
  category?: string;
  /** 返回条数上限，默认 20 */
  limit?: number;
  /** 搜索关键词，逗号分隔 = OR 关系 */
  keyword?: string;
}

/** 错误码 */
export type ErrorCode =
  | 'SOURCE_NOT_FOUND'
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'PARSE_FAILED'
  | 'INVALID_OPTION';

/** 统一错误类型 */
export class NewsCliError extends Error {
  public readonly code: ErrorCode;
  public readonly exitCode: number;

  constructor(message: string, code: ErrorCode, exitCode: number = 1) {
    super(message);
    this.name = 'NewsCliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: add core types (NewsArticle, NewsSource, FetchOptions, NewsCliError)"
```

---

### Task 3: Logger

**File:**
- Create: `src/utils/logger.ts`

- [ ] **Step 1: Write logger.ts**

```ts
/** 写 info 日志到 stderr */
export function info(message: string): void {
  process.stderr.write(`[INFO] ${message}\n`);
}

/** 写错误日志到 stderr */
export function error(message: string): void {
  process.stderr.write(`[ERROR] ${message}\n`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/logger.ts
git commit -m "feat: add stderr logger utility"
```

---

### Task 4: Registry

**Files:**
- Create: `src/core/registry.ts`
- Create: `test/core/registry.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// test/core/registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registerSource, getSource, listSources, clearSources } from '../../src/core/registry.js';
import type { NewsSource, NewsArticle, FetchOptions } from '../../src/core/types.js';

function makeMockSource(name: string): NewsSource {
  return {
    name,
    description: `Mock source: ${name}`,
    async listCategories() { return []; },
    async fetch(_opts?: FetchOptions): Promise<NewsArticle[]> { return []; },
  };
}

describe('registry', () => {
  beforeEach(() => {
    // 每个测试前清空注册表
    clearSources();
  });

  describe('registerSource', () => {
    it('should register a source and make it retrievable', () => {
      const src = makeMockSource('test-source');
      registerSource(src);
      expect(getSource('test-source')).toBe(src);
    });

    it('should throw when registering a duplicate name', () => {
      registerSource(makeMockSource('dup'));
      expect(() => registerSource(makeMockSource('dup'))).toThrow(
        'Source "dup" already registered',
      );
    });
  });

  describe('getSource', () => {
    it('should return undefined for unknown source', () => {
      expect(getSource('nonexistent')).toBeUndefined();
    });
  });

  describe('listSources', () => {
    it('should return empty array when no sources registered', () => {
      expect(listSources()).toEqual([]);
    });

    it('should return all registered sources', () => {
      const a = makeMockSource('a');
      const b = makeMockSource('b');
      registerSource(a);
      registerSource(b);
      expect(listSources()).toEqual([a, b]);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/core/registry.test.ts
```
Expected: FAIL — `clearSources`, `registerSource`, etc. not found.

- [ ] **Step 3: Write registry.ts**

```ts
import type { NewsSource } from './types.js';

const sources = new Map<string, NewsSource>();

export function registerSource(source: NewsSource): void {
  if (sources.has(source.name)) {
    throw new Error(`Source "${source.name}" already registered`);
  }
  sources.set(source.name, source);
}

export function getSource(name: string): NewsSource | undefined {
  return sources.get(name);
}

export function listSources(): NewsSource[] {
  return [...sources.values()];
}

/** 仅用于测试：清空注册表 */
export function clearSources(): void {
  sources.clear();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/core/registry.test.ts
```
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/registry.ts test/core/registry.test.ts
git commit -m "feat: add news source registry with tests"
```

---

### Task 5: Fetcher

**Files:**
- Create: `src/core/fetcher.ts`
- Create: `test/core/fetcher.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// test/core/fetcher.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRSS } from '../../src/core/fetcher.js';

describe('fetchRSS', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and return text content on success', async () => {
    const mockResponse = '<rss><channel><item><title>Test</title></item></channel></rss>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(mockResponse, { status: 200, headers: { 'Content-Type': 'application/rss+xml' } }),
    );

    const result = await fetchRSS('https://example.com/rss', 5000);
    expect(result).toBe(mockResponse);
  });

  it('should throw NewsCliError with FETCH_FAILED on non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Server Error', { status: 503 }),
    );

    await expect(fetchRSS('https://example.com/rss', 5000)).rejects.toMatchObject({
      name: 'NewsCliError',
      code: 'FETCH_FAILED',
    });
  });

  it('should throw NewsCliError with FETCH_TIMEOUT on timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new DOMException('The operation was aborted', 'AbortError'),
    );

    await expect(fetchRSS('https://example.com/rss', 5000)).rejects.toMatchObject({
      name: 'NewsCliError',
      code: 'FETCH_TIMEOUT',
    });
  });

  it('should retry on network error and succeed on retry', async () => {
    const mockResponse = '<rss>ok</rss>';
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(new Response(mockResponse, { status: 200 }));

    const result = await fetchRSS('https://example.com/rss', 5000);
    expect(result).toBe(mockResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should give up after max retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(fetchRSS('https://example.com/rss', 5000)).rejects.toMatchObject({
      name: 'NewsCliError',
      code: 'FETCH_FAILED',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/core/fetcher.test.ts
```
Expected: FAIL — `fetchRSS` not found.

- [ ] **Step 3: Write fetcher.ts**

```ts
import { NewsCliError } from './types.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 通用 RSS 抓取：超时控制 + 重试 + UA 伪装
 * @param url - RSS 地址
 * @param timeoutMs - 超时毫秒数
 * @returns RSS XML 字符串
 */
export async function fetchRSS(url: string, timeoutMs: number): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new NewsCliError(
          `HTTP ${response.status} when fetching ${url}`,
          'FETCH_FAILED',
        );
      }

      return await response.text();
    } catch (err: unknown) {
      lastError = err;

      // AbortError = timeout
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new NewsCliError(`Request timeout: ${url}`, 'FETCH_TIMEOUT');
      }

      // 已有 NewsCliError 直接抛出
      if (err instanceof NewsCliError) {
        throw err;
      }

      // 最后一次重试失败，抛出
      if (attempt === MAX_RETRIES) {
        throw new NewsCliError(
          `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${String(err)}`,
          'FETCH_FAILED',
        );
      }

      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new NewsCliError(`Unexpected: fetchRSS exhausted retries for ${url}`, 'FETCH_FAILED');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/core/fetcher.test.ts
```
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/fetcher.ts test/core/fetcher.test.ts
git commit -m "feat: add RSS fetcher with timeout, retry, and tests"
```

---

### Task 6: Formatter

**Files:**
- Create: `src/core/formatter.ts`
- Create: `test/core/formatter.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// test/core/formatter.test.ts
import { describe, it, expect } from 'vitest';
import { formatOutput } from '../../src/core/formatter.js';
import type { NewsArticle } from '../../src/core/types.js';

const sampleArticles: NewsArticle[] = [
  {
    id: 'hash1',
    title: 'Test Article One',
    url: 'https://example.com/1',
    source: 'Example Source',
    snippet: 'This is a test.',
    publishedAt: '2026-06-15',
  },
  {
    id: 'hash2',
    title: 'Another Article',
    url: 'https://example.com/2',
    source: 'Other Source',
  },
];

describe('formatOutput', () => {
  describe('JSON mode', () => {
    it('should output formatted JSON string', () => {
      const result = formatOutput(sampleArticles, { json: true });
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].title).toBe('Test Article One');
      expect(parsed[0].id).toBe('hash1');
    });
  });

  describe('table mode', () => {
    it('should include article titles in table output', () => {
      const result = formatOutput(sampleArticles, { json: false });
      expect(result).toContain('Test Article One');
      expect(result).toContain('Another Article');
      expect(result).toContain('Example Source');
    });

    it('should show placeholder for empty list', () => {
      const result = formatOutput([], { json: false });
      expect(result).toBe('(no news)');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/core/formatter.test.ts
```
Expected: FAIL — `formatOutput` not found.

- [ ] **Step 3: Write formatter.ts**

```ts
import Table from 'cli-table3';
import type { NewsArticle } from './types.js';

interface FormatOptions {
  json: boolean;
}

/** 将 NewsArticle[] 格式化为终端表格或 JSON 字符串 */
export function formatOutput(articles: NewsArticle[], opts: FormatOptions): string {
  if (opts.json) {
    return JSON.stringify(articles, null, 2);
  }

  if (articles.length === 0) {
    return '(no news)';
  }

  const table = new Table({
    head: ['#', 'Title', 'Source', 'Time'],
    colWidths: [4, 60, 22, 18],
    wordWrap: true,
    style: { head: ['bold'] },
  });

  articles.forEach((a, i) => {
    table.push([
      String(i + 1),
      a.title,
      a.source,
      a.publishedAt ?? '-',
    ]);
  });

  return table.toString();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/core/formatter.test.ts
```
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/formatter.ts test/core/formatter.test.ts
git commit -m "feat: add formatter (table + JSON) with tests"
```

---

### Task 7: Google News Constants

**File:**
- Create: `src/news-source/google-news/constants.ts`

- [ ] **Step 1: Write constants.ts**

```ts
/** Google News RSS 根地址 */
export const RSS_BASE = 'https://news.google.com/rss';

/** 支持的分类及其 RSS topic ID */
export const CATEGORIES: Record<string, string> = {
  headlines: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB',
  world: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB/sections/CAAqSggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVABXhIiQ0NCSlJXaGxiR1JsYmlCaGMzTmxMbU52YlM4QUEAQAFQAQ',
  business: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB/sections/CAAqSggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVABXhIiQ0NCSlEyOTFibU5vYVdOcklHOW1iM0IxYmdvQUEAQAFQAQ',
  technology: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB/sections/CAAqSggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVABXhIiQ0NCSlJHOWpZV3hvYjNOME9TNWpiMjB2QUFJQUFRQUtBQVVBQ2dJREFBZ0dBQW9mQ0FBRkJRTkFLaHNJTlFvTkFnaGRDQWdJQ0FnR0FnZ0ZBQW9qQ2dFQUFBUUtBQkFBRUZBa0FDZ0FJQkFvQUVBQUVBUUtBQVFJREFnRUFCdzBLQWdFQUF3SUFBUVlEQVFJQUFnMENBUUlEQVFNQkFRTUNBUUlCQVFJQ0FnRUNBZ1FDQVFJSEFRRUFBUUVBQVFFR0NRUURBUUlEQkJrREFBZ0dBZ0VNRFFRQUJBd0hBUVlEQWdjSEFnRUhBUUlBQWdjQkF3RU5BZ0VCQXdjQkF3a0FBQWNIQVFFREJBRUNDUU1JQkE4TUFRSUNBZ2NGRFFRQUFRSURCUU1BQXdjREJRSUNBUUlKQmdjRkFRUUZBUUlNQkFrS0JRVUxCUT09',
  entertainment: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB/sections/CAAqSggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVABXhIiQ0NCSlJHOWpZV3hvScaleWMybHpkR1Z1WlM1amIyMHZBQUlBQVFBREFnRUNBZ2dJQ1FRTkNoQUhDZ1FQQ2dNTEFnRVFDQTBLRFFrSkN3b0RBUT09',
  sports: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB/sections/CAAqSggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVABXhIiQ0NCSlJHOWpZV3hvYjNOMGNHRjBibk1nWTNKbFlYTnpaWElLQ0FFQ0FRb0REUXNJQndrRUFnVUZDZ0VBQUFFQUFnc0NBQUVaQVFJSEFnOENBQUlJQWc0UEFRb0lCd3dIQWdJRkNBTUtBUUlDQVFVQkFRVUJCZ1FEQXdjR0FRRURBUU1DQVFNQ0FRTUdCd2dHQXdVQ0FnZ0RBZ1VFQVE4SUFRTUFCZ1VEQmdNRUFBVURCd1VLQkF3RUF3b0pCZ2dJQlFBQ0NBTU1CZ0lGQXdVSUJBb1FBUT09',
  science: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB/sections/CAAqSggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVABXhIiQ0NCSlJHOWpZV3hvYjNOMFlYSmxjM1JsWkM1amIyMHZBQUlBQVFBREFnRUNBZ0lCQ1EwS0NnSU1BUWNFQ1E4SkN3SUFDQVFPQ0FFU0FnSU5BZ0VIQXdvQ0JBTUFBUWtBQnd3SUFRSUNBUWNFQWdJSEJnc0RCd1FKQVFnS0NBWVJBUWtGQVFNTkFRRUZCd0VDQXdRQkNBc0NCaEFLQXdvQ0Fnd0VBUUlEQ1FJTkNnUUNCdzhCQlFnQUFnOEpDQUVEQndJREFnQUdCZ1FCQVVNQndZSUJnRURBUVlGQ0FNREJ3SU1Bd29DQUFBQkF3VUJBUUFDQWdFSEFnY0RCUU1EQXdFQ0FRTUFCZ3NNQlFZSUNnd1BCZ1FMQXdFSkFBNkdBPT0=',
  health: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB/sections/CAAqSggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVABXhIiQ0NCSlJHOWpZV3hvYjNOMFlYSmxjM1JsWkM1amIyMHZBQUlBQVFBREFnRUNBZ0lDQ1EwS0NnUU1BUVlFQ1JFSEN3SUFDQVFPQ0FFRUFnSU5BZ0VIQXdvQ0JBTUFBUWtBQnd3SUFRSUdBUWNIQkFjSkJnVUhEZ01IQXdRQ0FRY0dBd0lHQnc0SEF3UUdCd0lJQVFNSEJRWUJCUXNIQXdvQ0NRY0xCd0VJRGdVQ0FRUUdDUUVMQXdZRkF3SUNBUWNFQndNSERBa0pCZ1lCQXdZRUJ3VUVCeDBJQndRSkNnd1BCZ2NVQ0EwTENBVUNCd2dHQmdjTEJRRUVBZz09',
};

/** 默认请求超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认返回条数 */
export const DEFAULT_LIMIT = 20;
```

- [ ] **Step 2: Commit**

```bash
git add src/news-source/google-news/constants.ts
git commit -m "feat: add Google News constants (RSS URLs, categories, defaults)"
```

---

### Task 8: Google News Parser

**Files:**
- Create: `src/news-source/google-news/parser.ts`
- Create: `test/fixtures/google-news.xml`
- Create: `test/news-source/google-news/parser.test.ts`

- [ ] **Step 1: Create RSS fixture file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google News</title>
    <item>
      <title>Test Article One - Example Source</title>
      <link>https://news.google.com/rss/articles/abc123</link>
      <guid isPermaLink="false">abc123</guid>
      <pubDate>Mon, 15 Jun 2026 08:00:00 GMT</pubDate>
      <description>This is the snippet for article one.</description>
      <source url="https://example.com">Example Source</source>
    </item>
    <item>
      <title>Second Article - Another Source</title>
      <link>https://news.google.com/rss/articles/def456</link>
      <guid isPermaLink="false">def456</guid>
      <pubDate>Mon, 15 Jun 2026 07:30:00 GMT</pubDate>
      <description>Snippet for the second article.</description>
      <source url="https://another.com">Another Source</source>
    </item>
    <item>
      <title>Article Without Source</title>
      <link>https://news.google.com/rss/articles/ghi789</link>
      <guid isPermaLink="false">ghi789</guid>
      <pubDate>Mon, 15 Jun 2026 07:00:00 GMT</pubDate>
      <description>No source element here.</description>
    </item>
  </channel>
</rss>
```

Save to `test/fixtures/google-news.xml`.

- [ ] **Step 2: Write failing test**

```ts
// test/news-source/google-news/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseRSS } from '../../../src/news-source/google-news/parser.js';
import fs from 'node:fs';
import path from 'node:path';

const fixturePath = path.resolve(__dirname, '../../fixtures/google-news.xml');
const rssXML = fs.readFileSync(fixturePath, 'utf-8');

describe('parseRSS', () => {
  it('should parse RSS XML into NewsArticle array', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles).toHaveLength(3);
  });

  it('should extract title correctly (strip source suffix)', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].title).toBe('Test Article One');
    expect(articles[1].title).toBe('Second Article');
  });

  it('should extract source from <source> element', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].source).toBe('Example Source');
    expect(articles[1].source).toBe('Another Source');
  });

  it('should fall back to "Google News" when no source element', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[2].source).toBe('Google News');
  });

  it('should set the category from the argument', () => {
    const articles = parseRSS(rssXML, 'sports');
    articles.forEach((a) => expect(a.category).toBe('sports'));
  });

  it('should parse publishedAt', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].publishedAt).toBe('2026-06-15T08:00:00.000Z');
  });

  it('should extract snippet from description', () => {
    const articles = parseRSS(rssXML, 'technology');
    expect(articles[0].snippet).toBe('This is the snippet for article one.');
  });

  it('should generate unique id for each article', () => {
    const articles = parseRSS(rssXML, 'technology');
    const ids = articles.map((a) => a.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('should return empty array for empty RSS', () => {
    const emptyRSS = '<rss version="2.0"><channel></channel></rss>';
    expect(parseRSS(emptyRSS, 'technology')).toEqual([]);
  });

  it('should throw NewsCliError on malformed XML', () => {
    expect(() => parseRSS('not xml at all', 'technology')).toThrow();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run test/news-source/google-news/parser.test.ts
```
Expected: FAIL — `parseRSS` not found.

- [ ] **Step 4: Write parser.ts**

```ts
import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';
import { NewsCliError } from '../../core/types.js';
import type { NewsArticle } from '../../core/types.js';

interface RSSItem {
  title?: string;
  link?: string;
  guid?: string | { '#text': string };
  pubDate?: string;
  description?: string;
  source?: { '#text'?: string; '@_url'?: string };
}

interface RSSChannel {
  item?: RSSItem | RSSItem[];
}

interface RSSFeed {
  rss?: {
    channel?: RSSChannel;
  };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (_name, jpath) => jpath === 'rss.channel.item',
});

/**
 * 解析 Google News RSS XML → NewsArticle[]
 * @param xml - RSS XML 字符串
 * @param category - 新闻分类
 * @returns 解析后的新闻列表
 */
export function parseRSS(xml: string, category: string): NewsArticle[] {
  let parsed: RSSFeed;
  try {
    parsed = parser.parse(xml);
  } catch {
    throw new NewsCliError('Failed to parse RSS XML', 'PARSE_FAILED');
  }

  const items = parsed?.rss?.channel?.item;
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.map((item: RSSItem) => {
    const rawTitle = item.title ?? 'Untitled';
    // Google News RSS 标题格式: "Article Title - Source Name"
    const sourceFromTitle = extractSourceFromTitle(rawTitle);
    const title = rawTitle.replace(` - ${sourceFromTitle}`, '').trim();

    const source =
      item.source?.['#text'] ?? sourceFromTitle ?? 'Google News';

    return {
      id: hash(item.link ?? item.guid ?? rawTitle),
      title: title || rawTitle,
      url: item.link ?? '',
      source,
      snippet: item.description?.replace(/<[^>]*>/g, '').trim(),
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      category,
    };
  });
}

/** 从 "Title - Source Name" 格式提取来源名 */
function extractSourceFromTitle(title: string): string | undefined {
  const lastDash = title.lastIndexOf(' - ');
  if (lastDash === -1) return undefined;
  return title.slice(lastDash + 3).trim();
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run test/news-source/google-news/parser.test.ts
```
Expected: 10 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/news-source/google-news/parser.ts test/news-source/google-news/parser.test.ts test/fixtures/google-news.xml
git commit -m "feat: add Google News RSS parser with tests"
```

---

### Task 9: Google News Source (index.ts)

**Files:**
- Create: `src/news-source/google-news/index.ts`
- Create: `test/news-source/google-news/index.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// test/news-source/google-news/index.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { googleNewsSource } from '../../../src/news-source/google-news/index.js';

const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Breaking News - CNN</title>
      <link>https://news.google.com/rss/articles/test123</link>
      <guid isPermaLink="false">test123</guid>
      <pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate>
      <description>Breaking news description.</description>
      <source url="https://cnn.com">CNN</source>
    </item>
  </channel>
</rss>`;

describe('googleNewsSource', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(mockRSS, { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have name "google-news"', () => {
    expect(googleNewsSource.name).toBe('google-news');
  });

  it('should have a description', () => {
    expect(googleNewsSource.description).toBeTruthy();
  });

  describe('listCategories', () => {
    it('should return category keys', async () => {
      const cats = await googleNewsSource.listCategories();
      expect(cats.length).toBeGreaterThan(0);
      expect(cats).toContain('technology');
      expect(cats).toContain('business');
    });
  });

  describe('fetch', () => {
    it('should fetch and return articles', async () => {
      const articles = await googleNewsSource.fetch({ category: 'technology', limit: 5 });
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Breaking News');
    });

    it('should default to headlines category when none specified', async () => {
      const articles = await googleNewsSource.fetch();
      expect(articles).toHaveLength(1);
      // Should have used the headlines RSS URL
      const fetchCalls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const url = fetchCalls[fetchCalls.length - 1][0] as string;
      expect(url).toContain('/rss');
    });

    it('should throw NewsCliError for unknown category', async () => {
      await expect(
        googleNewsSource.fetch({ category: 'nonexistent' }),
      ).rejects.toMatchObject({
        name: 'NewsCliError',
        code: 'INVALID_OPTION',
      });
    });

    it('should respect limit option', async () => {
      // Return multiple items via mock
      const multiItemRSS = `<?xml version="1.0"?><rss><channel>${
        Array.from({ length: 5 }, (_, i) =>
          `<item><title>News ${i}</title><link>https://example.com/${i}</link><guid>g${i}</guid><pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate><description>Desc ${i}</description><source url="https://s.com">Src</source></item>`
        ).join('')
      }</channel></rss>`;
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(multiItemRSS, { status: 200 }),
      );

      const articles = await googleNewsSource.fetch({ limit: 2 });
      expect(articles).toHaveLength(2);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/news-source/google-news/index.test.ts
```
Expected: FAIL — `googleNewsSource` not found.

- [ ] **Step 3: Write index.ts**

```ts
import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { NewsCliError } from '../../core/types.js';
import { fetchRSS } from '../../core/fetcher.js';
import { parseRSS } from './parser.js';
import { RSS_BASE, CATEGORIES, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

function buildURL(category: string, keyword?: string): string {
  const topicId = CATEGORIES[category];

  if (keyword) {
    const query = keyword.split(',').map((k) => k.trim()).join(' OR ');
    const encoded = encodeURIComponent(query);
    const base = topicId
      ? `${RSS_BASE}/topics/${topicId}`
      : RSS_BASE;
    return `${base}?q=${encoded}`;
  }

  if (topicId) {
    return `${RSS_BASE}/topics/${topicId}`;
  }

  // 默认：头条
  return RSS_BASE;
}

export const googleNewsSource: NewsSource = {
  name: 'google-news',
  description: 'Google News — global headlines by category',

  async listCategories(): Promise<string[]> {
    return Object.keys(CATEGORIES);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category ?? 'headlines';

    if (!(category in CATEGORIES)) {
      const available = Object.keys(CATEGORIES).join(', ');
      throw new NewsCliError(
        `Unknown category "${category}". Available: ${available}`,
        'INVALID_OPTION',
      );
    }

    const url = buildURL(category, options?.keyword);
    const xml = await fetchRSS(url, DEFAULT_TIMEOUT);
    const articles = parseRSS(xml, category);

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/news-source/google-news/index.test.ts
```
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/news-source/google-news/index.ts test/news-source/google-news/index.test.ts
git commit -m "feat: add Google News source (implements NewsSource) with tests"
```

---

### Task 10: CLI (cli.ts)

**Files:**
- Create: `src/cli.ts`

- [ ] **Step 1: Write cli.ts**

```ts
import { Command } from 'commander';
import { getSource, listSources } from './core/registry.js';
import { formatOutput } from './core/formatter.js';
import { NewsCliError } from './core/types.js';
import { error as logError } from './utils/logger.js';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('news')
    .description('Fetch news from multiple sources')
    .version('0.1.0');

  // news list — 列出所有可用源
  program
    .command('list')
    .description('List all available news sources')
    .action(() => {
      const sources = listSources();
      if (sources.length === 0) {
        process.stdout.write('(no sources available)\n');
        return;
      }
      for (const s of sources) {
        process.stdout.write(`${s.name}: ${s.description}\n`);
      }
    });

  // news categories <source> — 列出某个源的分类
  program
    .command('categories <source>')
    .description('List categories for a news source')
    .action(async (sourceName: string) => {
      try {
        const source = getSource(sourceName);
        if (!source) {
          throw new NewsCliError(
            `Unknown source "${sourceName}". Run "news list" to see available sources.`,
            'SOURCE_NOT_FOUND',
          );
        }
        const cats = await source.listCategories();
        if (cats.length === 0) {
          process.stdout.write('(no categories)\n');
        } else {
          for (const c of cats) {
            process.stdout.write(`${c}\n`);
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // news get <source> [options] — 抓取新闻
  program
    .command('get <source>')
    .description('Fetch news from a source')
    .option('-c, --category <cat>', 'Filter by category')
    .option('-k, --keyword <keywords>', 'Search keywords (comma-separated = OR)')
    .option('-l, --limit <num>', 'Max articles', (v) => parseInt(v, 10))
    .option('--json', 'Output as JSON')
    .action(async (sourceName: string, opts: {
      category?: string;
      keyword?: string;
      limit?: number;
      json?: boolean;
    }) => {
      try {
        const source = getSource(sourceName);
        if (!source) {
          throw new NewsCliError(
            `Unknown source "${sourceName}". Run "news list" to see available sources.`,
            'SOURCE_NOT_FOUND',
          );
        }

        if (opts.limit !== undefined && (isNaN(opts.limit) || opts.limit < 1)) {
          throw new NewsCliError('--limit must be a positive number', 'INVALID_OPTION');
        }

        const articles = await source.fetch({
          category: opts.category,
          keyword: opts.keyword,
          limit: opts.limit,
        });

        const output = formatOutput(articles, { json: opts.json ?? false });
        process.stdout.write(output + '\n');
      } catch (err) {
        handleError(err);
      }
    });

  return program;
}

function handleError(err: unknown): never {
  if (err instanceof NewsCliError) {
    logError(err.message);
    process.exit(err.exitCode);
  }

  logError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add CLI with get/list/categories commands"
```

---

### Task 11: Entry Point

**File:**
- Create: `src/index.ts`

- [ ] **Step 1: Write index.ts**

```ts
#!/usr/bin/env node

import { registerSource } from './core/registry.js';
import { createCLI } from './cli.js';
import { googleNewsSource } from './news-source/google-news/index.js';

// 注册所有新闻源
registerSource(googleNewsSource);

// 启动 CLI
const program = createCLI();
program.parse();
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Smoke test with tsx**

```bash
npx tsx src/index.ts list
npx tsx src/index.ts categories google-news
```
Expected: `list` 输出 `google-news: Google News...`，`categories` 输出分类列表。

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add entry point with source registration"
```

---

### Task 12: Build Script

**Files:**
- Create: `scripts/build.js`

- [ ] **Step 1: Write build script**

```js
// scripts/build.js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  minify: false,
  sourcemap: false,
  external: [],
});

console.log('Build complete: dist/index.js');
```

- [ ] **Step 2: Run build**

```bash
node scripts/build.js
```
Expected: `Build complete: dist/index.js`.

- [ ] **Step 3: Verify output file**

```bash
head -1 dist/index.js
file dist/index.js
ls -lh dist/index.js
```
Expected: First line is `#!/usr/bin/env node`; file is a JS bundle.

- [ ] **Step 4: Make executable and test**

```bash
chmod +x dist/index.js
./dist/index.js list
```
Expected: 输出 `google-news: Google News...`。

- [ ] **Step 5: Commit**

```bash
git add scripts/build.js
git commit -m "feat: add esbuild build script"
```

---

### Task 13: CLI E2E Tests

**File:**
- Create: `test/cli.test.ts`

- [ ] **Step 1: Write E2E test**

```ts
// test/cli.test.ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const CLI = path.resolve(__dirname, '../dist/index.js');

function run(args: string): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30_000,
    });
    return { stdout, stderr: '', status: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer; stderr?: Buffer; status?: number };
    return {
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
      status: e.status ?? 1,
    };
  }
}

describe('CLI E2E', () => {
  it('should list available sources', () => {
    const { stdout, status } = run('list');
    expect(status).toBe(0);
    expect(stdout).toContain('google-news');
  });

  it('should list categories for google-news', () => {
    const { stdout, status } = run('categories google-news');
    expect(status).toBe(0);
    expect(stdout).toContain('technology');
    expect(stdout).toContain('business');
  });

  it('should error on unknown source', () => {
    const { stderr, status } = run('get fake-source');
    expect(status).toBe(1);
    expect(stderr).toContain('Unknown source');
  });

  it('should error on invalid --limit', () => {
    const { stderr, status } = run('get google-news --limit abc');
    expect(status).toBe(1);
    expect(stderr).toContain('--limit');
  });

  it('should fetch google-news in table mode (requires network)', async () => {
    const { stdout, status } = run('get google-news --limit 3');
    expect(status).toBe(0);
    // Table output should contain title-like content
    expect(stdout.length).toBeGreaterThan(0);
  }, 30_000);

  it('should fetch google-news in JSON mode (requires network)', async () => {
    const { stdout, status } = run('get google-news --limit 2 --json');
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeLessThanOrEqual(2);
  }, 30_000);
});
```

- [ ] **Step 2: Run E2E tests**

```bash
npx vitest run test/cli.test.ts
```
Expected: 6 tests PASS (前4个不依赖网络，后2个需要网络)。

- [ ] **Step 3: Commit**

```bash
git add test/cli.test.ts
git commit -m "test: add CLI E2E tests"
```

---

### Task 14: Lint & Final Verification

- [ ] **Step 1: Run ESLint**

```bash
npx eslint src/ test/ scripts/
```
Expected: No errors. Fix any warnings with `npx eslint src/ test/ scripts/ --fix`.

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```
Expected: All tests PASS.

- [ ] **Step 3: Run full build**

```bash
node scripts/build.js
```
Expected: `dist/index.js` regenerated successfully.

- [ ] **Step 4: Add .gitignore**

```bash
echo "node_modules/\ndist/\n*.tsbuildinfo" > .gitignore
```

- [ ] **Step 5: Final commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore, final lint fixes"
```

---

## Summary

| # | Task | Files |
|---|------|-------|
| 1 | Scaffolding | `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts` |
| 2 | Core types | `src/core/types.ts` |
| 3 | Logger | `src/utils/logger.ts` |
| 4 | Registry | `src/core/registry.ts`, `test/core/registry.test.ts` |
| 5 | Fetcher | `src/core/fetcher.ts`, `test/core/fetcher.test.ts` |
| 6 | Formatter | `src/core/formatter.ts`, `test/core/formatter.test.ts` |
| 7 | GN Constants | `src/news-source/google-news/constants.ts` |
| 8 | GN Parser | `src/news-source/google-news/parser.ts`, `test/...parser.test.ts`, `test/fixtures/google-news.xml` |
| 9 | GN Source | `src/news-source/google-news/index.ts`, `test/...index.test.ts` |
| 10 | CLI | `src/cli.ts` |
| 11 | Entry | `src/index.ts` |
| 12 | Build | `scripts/build.js` |
| 13 | E2E tests | `test/cli.test.ts` |
| 14 | Lint + polish | `.gitignore` |
