# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # tsx hot-run src/index.ts
npm run build        # esbuild → dist/index.js (single ESM bundle, shebang, deps external)
npm test             # vitest run (41 tests)
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

`fetchRSS(url, timeoutMs, extraHeaders?)` — up to 3 retries with 1s delay, AbortController timeout, Chrome UA. Used by all RSS-based sources.

### RSS Parser (`src/news-source/google-news/parser.ts`)

`parseRSS(xml, category)` — uses `fast-xml-parser` with `isArray` for `<item>`. Parses Google News's "Title - Source Name" format: splits on last `" - "` to extract source, remainder becomes title. Strips HTML from descriptions. Unique IDs via SHA-256 hash of URL.

### Google News CN reuse pattern

`google-news-cn` reuses `google-news/parser.js` directly (same RSS structure) but has its own `constants.ts` with `LOCALE_PARAMS = 'hl=zh-CN&gl=CN&ceid=CN:zh-Hans'` appended to all URLs. This is the intended pattern for locale variants — share the parser, vary the constants.

### URL construction

Categories map to opaque Google News topic IDs (base64-encoded protobuf-like strings). Keyword search uses `/rss/search?q=<OR-joined terms>`. Without keyword: `/rss/topics/<topicId>`. Default (headlines): bare `/rss`.

### Build

esbuild bundles to a single ESM file targeting Node 18. `packages: 'external'` — runtime deps (`commander`, `cli-table3`, `fast-xml-parser`) must be installed. A `#!/usr/bin/env node` banner is prepended.

### Testing

vitest, tests mirror `src/` structure under `test/`. Use `clearSources()` from `core/registry.ts` to reset state between tests. Fixtures live in `test/fixtures/`.

### Style conventions

- TypeScript strict mode, ESM with `.js` extensions in imports
- All unused args prefixed with `_` (ESLint rule)
- `eslint.config.mjs` flat config, `dist/`, `node_modules/`, `scripts/` ignored
- gitignore: `node_modules`, `dist`, `docs`
