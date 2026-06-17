# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # tsx hot-run src/index.ts
npm run build        # esbuild → dist/index.js (single ESM bundle, shebang, deps external)
npm test             # vitest run (310 tests, 30 files)
npm run test:watch   # vitest watch mode
npm run lint         # ESLint (flat config, TS + recommended rules)
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # tsc --noEmit (strict mode)
```

After build, `npm link` makes `news` available globally.

## Architecture

**Plugin-based news source system.** The CLI (`commander`) discovers sources from a `Map<string, NewsSource>` registry. Each source is a module under `src/news-source/<name>/` exporting a `NewsSource` object. Sources are manually imported and registered in `src/index.ts` — there is no auto-discovery.

### Core flow

```
CLI (cli.ts)
  → registry.get(name)          # lookup NewsSource by name
  → source.fetch(options)       # RSS fetch + parse → NewsArticle[]
  → formatter.formatOutput()    # table (cli-table3) or JSON → stdout
```

### Key types (`src/core/types.ts`)

- **`NewsSource`** — the plugin interface: `name`, `description`, `listCategories()`, `fetch(options?)`
- **`NewsArticle`** — normalized output: `id` (SHA-256 hash of URL, 12 hex chars), `title`, `url`, `source`, `snippet`, `publishedAt`, `category`, `imageUrl`
- **`NewsCliError`** — typed errors with `code` (`SOURCE_NOT_FOUND`, `FETCH_TIMEOUT`, `FETCH_FAILED`, `PARSE_FAILED`, `INVALID_OPTION`) and `exitCode`
- **`FetchOptions`** — `category`, `limit` (default 20), `keyword` (comma = OR)

### Error handling pattern

Errors go to **stderr** via `utils/logger.ts`; data goes to **stdout**. This makes `--json` output pipe-safe. `cli.ts:handleError()` catches all — `NewsCliError` uses its `exitCode`, everything else exits 1.

### Fetcher (`src/core/fetcher.ts`)

All fetch functions share the same retry/timeout logic: up to 3 retries with 1s delay, AbortController timeout, Chrome UA. Four exports:

- **`fetchRSS(url, timeoutMs, extraHeaders?)`** — GET, returns raw text. Used by RSS-based sources (google-news, chinanews).
- **`fetchHTML(url, timeoutMs, extraHeaders?)`** — GET, returns raw text. Used by HTML-scraping sources (ithome).
- **`fetchJSON<T>(url, timeoutMs, extraHeaders?, method?, body?)`** — generic JSON fetch with optional POST method and JSON body. Used by API-based sources: GET (weibo, cls, pengpai, aibase), POST (tencent-news, 36kr, huxiu).
- **`fetchText(url, timeoutMs, extraHeaders?)`** — internal, not exported. All three public functions delegate to it.

Errors are thrown as `NewsCliError` with `FETCH_TIMEOUT` or `FETCH_FAILED` codes.

### Source implementation patterns

Sources follow one of these patterns. When adding a new source, pick the closest match:

| Pattern | Sources | Fetch | Parse |
|---------|---------|-------|-------|
| **RSS** | google-news, google-news-cn, chinanews | `fetchRSS()` | `fast-xml-parser` → `NewsArticle[]` |
| **JSON GET** | weibo, cls, pengpai, aibase | `fetchJSON<T>()` | typed JSON → `NewsArticle[]` |
| **JSON POST** | tencent-news, 36kr, huxiu | `fetchJSON<T>(url, ms, headers, 'POST', body)` | typed JSON → `NewsArticle[]` |
| **HTML regex** | ithome, people-cn | `fetchHTML()` | regex extraction → `NewsArticle[]` |
| **HTML + Script JSON** | yicai | `fetchHTML()` | acorn AST → JSON.parse → `NewsArticle[]` |
| **Multi-step API** | sspai | `fetchJSON<T>()` × N | fetch list → fetch each article detail |

**Pagination strategies vary by source:**
- Google News RSS: single request (RSS returns all available items)
- pengpai: `loadPage` parameter, loops until enough items or empty page
- 36kr: base64-encoded `pageCallback` cursor, de-duplicates by itemId
- cls: `last_time` cursor on 头条 endpoint
- aibase: simple `pageNo` increment
- ithome: AJAX pagination via additional HTML requests
- tencent-news: single POST with `item_count` (pagination returns duplicates, so single request only)
- people-cn: date-backtracking loop (today → up to 7 days back, stops when count ≥ limit)
- huxiu: `last_id` cursor from `pcArticleList` response, de-duplicates by `aid`
- yicai: no pagination (all data in one homepage `<script>` block)

### Utils (`src/utils/`)

- **`sleep(ms)`** — promise-based delay, used by fetcher retry logic and between paginated requests.
- **`titleContains(article, keyword)`** — OR-based keyword matching: splits on comma, trims, lowercases, checks if any term appears in `article.title`. Used by most sources for client-side keyword filtering after fetch.
- **`logger.ts`** — writes to stderr via `error()` and `info()` exports. Keeps stdout clean for pipe-safe `--json` output.

### Parser pattern

Each source has its own `parser.ts` that converts its raw format to `NewsArticle[]`. All parsers generate IDs via SHA-256 hash of the article URL (first 12 hex chars). The Google News parser (`google-news/parser.ts`) is the most complex — it splits "Title - Source Name" format and strips HTML from descriptions. It's reused directly by `google-news-cn` via import (same RSS structure, different locale params).

For sources that embed JSON in `<script>` tags (like yicai), use **acorn** to parse the JavaScript AST, then locate the `ArrayExpression` node by `range` and slice the original source for `JSON.parse`. This avoids regex bracket-matching bugs when JSON string values contain `]`.

### CLI features

- `news list` — colored output: bold cyan source names, gray `—` separators, footer with source count
- `news list --json` — outputs `[{name, description}, ...]` for programmatic consumption
- `news get <source> --json` — pipe-safe JSON output (stdout), errors go to stderr

### Build

esbuild bundles to a single ESM file targeting Node 18. `packages: 'external'` — runtime deps (`acorn`, `cli-table3`, `commander`, `fast-xml-parser`) are not bundled and must be installed. A `#!/usr/bin/env node` banner is prepended. Output is ~66KB.

### Testing

vitest, tests mirror `src/` structure under `test/`. Use `clearSources()` from `core/registry.ts` to reset state between tests. Fixtures live in `test/fixtures/`.

### Style conventions

- TypeScript strict mode, ESM with `.js` extensions in imports
- All unused args prefixed with `_` (ESLint rule)
- `eslint.config.mjs` flat config, `dist/`, `node_modules/`, `scripts/` ignored
- gitignore: `node_modules`, `dist`, `docs`
