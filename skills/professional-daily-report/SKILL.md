---
name: professional-daily-report
description: Use when the user asks to generate a blog-ready or newsletter-style Markdown daily report from news-cli sources
---

# Professional Daily Report

Generate a polished, near-final Markdown daily report / newsletter from `news get --json` output.

## When to Use

- User says something like: "帮我写一份今天的 AI 行业日报" or "生成一份科技 newsletter"
- The goal is a publishable Markdown document, not just a list of headlines
- The task involves fetching, filtering, deduplicating, and rewriting news into a coherent report

## When NOT to Use

- User only wants raw news output → just run `news get` directly
- User wants real-time single-source headlines → no report rewriting needed

## Core Workflow

1. **Discover available sources** with `news list --json` and pick the best ones for the topic
2. **Parse the request** into a `report-plan.json`
3. **Fetch** articles from selected sources with `news get --json`
4. **Deduplicate & filter** with the provided script
5. **Write the report body** in Markdown (AI step)
6. **Finalize** with metadata and source stats using the provided script

The helper scripts will **auto-install `news-cli`** if the `news` command is missing: they first try `npm run build && npm link` when running inside the news-cli repo, otherwise `npm install -g news-cli`.

## Input Fields

Extract these from the user's request. Use defaults when missing.

| Field | Required | Default | Example |
|---|---|---|---|
| `topic` | yes | — | "AI 行业早报" |
| `audience` | no | "对该主题感兴趣的读者" | "AI 从业者" |
| `style` | no | "平衡" | 正式 / 轻松 / 深度 / 短讯 |
| `length` | no | "中" | 短 / 中 / 长，或 exact count |
| `keywords` | no | [] | ["大模型", "OpenAI"] |
| `date` | no | today (local time) | "2026-07-03" |
| `sources` | no | auto-pick | [{"name": "aibase"}] |
| `outputFile` | no | `./daily-report-YYYY-MM-DD.md` | `docs/ai-daily.md` |

Map `length` to `targetCount`: 短 = 5–7, 中 = 8–12, 长 = 13–20.

## Step 0: Discover Available Sources

Run the helper script:

```bash
node skills/professional-daily-report/scripts/list-sources.js
```

This will:
- Auto-install `news-cli` if `news` is not in PATH
- Run `news list --json`
- Write `./tmp/available-sources.json` with `available` and `recommended` arrays

Read that file and use the `recommended` list as the starting point for `report-plan.json`. If the recommendation seems off for the user's request, adjust using the full `available` list.

Guidelines for picking sources:
- Only use sources that appear in `available-sources.json`
- Prefer sources whose `name` or `description` matches the user's topic
- Use each source's default category by setting `category: null`
- Fetch a fixed limit of 50 articles per source (the helper script applies this default)
- Aim for 2–5 complementary sources to get enough breadth without too much overlap

## Step 1: Create `report-plan.json`

Write to `./tmp/report-plan.json`:

```json
{
  "topic": "AI 行业早报",
  "audience": "AI 从业者",
  "style": "正式",
  "length": "中",
  "keywords": ["大模型", "OpenAI"],
  "date": "2026-07-03",
  "outputFile": "docs/ai-daily.md",
  "sources": [
    {"name": "aibase"},
    {"name": "36kr"},
    {"name": "tencent-news"}
  ],
  "targetCount": 10
}
```

## Step 2: Fetch Articles

Run the helper script:

```bash
node skills/professional-daily-report/scripts/fetch-articles.js
```

This reads `./tmp/report-plan.json`, auto-installs `news-cli` if needed, runs `news get <source> --json` for each source, and writes `./tmp/raw-<source>.json`.

If `news` is not in PATH, the script will first try `npm run build && npm link` inside the news-cli repo; otherwise it tries `npm install -g news-cli`. Only if both fail should you stop and ask the user to install manually.

## Step 3: Deduplicate & Select

Run:

```bash
node skills/professional-daily-report/scripts/dedup-articles.js
```

This merges all `raw-*.json`, deduplicates by URL and title similarity (≥ 85%), **keeps only articles published today** (or the date set in `report-plan.json.date`), filters by keywords, scores by recency/source/keywords, truncates to `targetCount`, and writes `./tmp/selected-articles.json`.

## Step 4: Write the Report Body

Read `./tmp/selected-articles.json` and write `./tmp/report-content.md` yourself. Use this structure:

```markdown
# {topic} · {YYYY-MM-DD}

> 读者：{audience} | 风格：{style} | 共 {N} 条

## 导语

{2–3 sentences summarizing the main trend}

## {Section Title}

### {Article Title}

{2–3 sentence summary}

{1 sentence insight / takeaway}

[原文链接]({url})

...

## 今日来源

- {source}: {count} 条
- ...
```

Guidelines:
- Group related articles under section headings
- Each entry: summary + insight + source link
- Tone matches the requested `style`
- Do not fabricate facts beyond the article title/snippet

## Step 5: Finalize

Run:

```bash
node skills/professional-daily-report/scripts/finalize-report.js
```

This prepends metadata and appends generation footer, then writes the final file to `outputFile`.

## Helper Scripts

All scripts are plain Node.js ESM. No build step. They live in `skills/professional-daily-report/scripts/`.

### `list-sources.js`

- Input: `./tmp/report-plan.json` (optional; used for topic-based recommendations)
- Output: `./tmp/available-sources.json`
- Behavior: auto-installs `news-cli` if needed, runs `news list --json`, recommends sources by topic

### `fetch-articles.js`

- Input: `./tmp/report-plan.json`
- Output: `./tmp/raw-<source>.json` per source
- Errors are written to stderr and skipped; the script exits 0 so the workflow continues

### `dedup-articles.js`

- Input: `./tmp/raw-*.json` + `./tmp/report-plan.json`
- Output: `./tmp/selected-articles.json`
- Selection logic: URL exact dedup → title similarity dedup → **today-only date filter** → keyword filter → score → truncate

### `finalize-report.js`

- Input: `./tmp/report-content.md` + `./tmp/selected-articles.json`
- Output: the file named in `report-plan.json.outputFile`
- Creates parent directories if needed

## Failure Handling

- `news` not available: helper scripts auto-install; only stop if both repo-build and global install fail
- Single source fails: log to stderr, continue with remaining sources
- No articles after filtering: tell user and suggest broader keywords / different sources
- Output file already exists: overwrite without asking

## Output Example

See the template in Step 4. Final file is a single Markdown document ready for a blog or newsletter.
