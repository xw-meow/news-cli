---
name: professional-daily-report
description: Use when the user asks for a blog-ready or newsletter-style Markdown daily report compiled from news-cli sources, especially when they mention daily reports, newsletters, summarized news, sections, or commentary
---

# Professional Daily Report

Generate a polished Markdown daily report / newsletter from `news get --json` output. The report is meant to be near-publishable: grouped by theme, with a lead, summaries, insights, and source stats.

## When to Use

- User asks for a "日报", "daily report", or "newsletter" from news sources
- User wants summarized, grouped, or commented news instead of raw headlines
- Output needs to be a single Markdown file ready for a blog or newsletter

## When NOT to Use

- User only wants raw headlines → run `news get` directly
- User wants real-time single-source output → no rewriting needed

## Quick Reference

| Field | Required | Default | Maps to |
|---|---|---|---|
| `topic` | yes | — | report title |
| `style` | no | 平衡 | tone (正式 / 轻松 / 深度 / 短讯) |
| `length` | no | 中 | `targetCount`: 短=5–7, 中=8–12, 长=13–20 |
| `keywords` | no | [] | filter + scoring |
| `date` | no | today (local) | `YYYY-MM-DD` filter |
| `sources` | no | auto-pick | `[{"name": "aibase"}]` |
| `outputFile` | no | `./daily/docs/daily-report-YYYY-MM-DD.md` | final path |

## Core Workflow

1. **Discover sources**: `node skills/professional-daily-report/scripts/list-sources.js`
2. **Create `./tmp/report-plan.json`** from the user's request
3. **Fetch**: `node skills/professional-daily-report/scripts/fetch-articles.js`
4. **Select**: `node skills/professional-daily-report/scripts/dedup-articles.js`
5. **Write `./tmp/report-content.md`** following the template
6. **Finalize**: `node skills/professional-daily-report/scripts/finalize-report.js`

After finalize, the report is written to `./daily/docs/daily-report-YYYY-MM-DD.md` and `./tmp` is deleted. Helper scripts auto-install `news-cli` if `news` is missing (repo build first, then global install).

## Step 0: Discover Sources

Run `list-sources.js`. It writes `./tmp/available-sources.json` with `available` and `recommended` arrays. Pick exactly 5 complementary sources from `recommended`; fall back to `available` if the topic is unusual. Use each source's default category by setting `category: null`.

## Step 1: Create `report-plan.json`

```json
{
  "topic": "AI 行业早报",
  "style": "正式",
  "length": "中",
  "keywords": ["大模型", "OpenAI"],
  "date": "2026-07-03",
  "outputFile": "docs/ai-daily.md",
  "sources": [
    {"name": "aibase"},
    {"name": "36kr"}
  ],
  "targetCount": 10
}
```

## Step 2–3: Fetch and Select

Run `fetch-articles.js`, then `dedup-articles.js`. The default fetch limit is 50 articles per source. `dedup-articles.js` performs URL deduplication, title-similarity deduplication (≥ 85%), **today-only filtering**, keyword filtering, scoring, and truncation to `targetCount`.

## Step 4: Write the Report Body

Read `./tmp/selected-articles.json` and write `./tmp/report-content.md`.

**Template file (MUST follow):** `skills/professional-daily-report/reference/daily-report-template.md`

**Universal placeholder rule:** All `<<::identifier description>>` markers in the template must be replaced with real content, and the `<<::` / `>>` syntax must be removed completely. The text inside the marker is a hint for what belongs there and must not appear in the final output. This rule applies to any future templates that use the same syntax.

**Compliance rules:**

1. **Follow the template structure exactly.** Do not add, remove, rename, or reorder sections.
2. **Repeat the article group pattern** for each selected article:
   - Heading: `### [<标题>](<URL>)` — title is a clickable link to the original article
   - Summary paragraph
   - Insight sentence wrapped in `**粗体**` so it visually differs from the summary
   Group related articles under the same `## 分组标题`; start a new section when the theme changes.
3. **Keep exact Markdown formatting** for the title line, `## 导语`, and `## 今日来源`.
4. **Do not fabricate facts** beyond the article title/snippet.
5. **Match the requested `style`** in tone.
6. **Output only the report Markdown** to `./tmp/report-content.md`; no code fences, no explanations.

## Step 5: Finalize

Run `finalize-report.js`. It appends a generation footer, writes the final file to `./daily/docs/daily-report-YYYY-MM-DD.md` (or `outputFile` if specified), and deletes `./tmp`.

## Failure Handling

- `news` missing: scripts auto-install; stop only if both repo-build and global install fail
- Single source fails: logged to stderr, workflow continues
- No articles after filtering: tell the user and suggest broader keywords or different sources
- Output file exists: overwrite without asking

## Common Mistakes

- Leaving `<<::...>>` placeholders in the final Markdown
- Skipping the today-only filter and including older articles
- Inventing facts not supported by the title/snippet
- Adding sections not present in the template
- Wrapping the Markdown body in triple backticks

## Helper Scripts

All scripts are plain Node.js ESM, no build step. See inline comments in `skills/professional-daily-report/scripts/` for detailed behavior.

- `list-sources.js` → `./tmp/available-sources.json`
- `fetch-articles.js` → `./tmp/raw-<source>.json`
- `dedup-articles.js` → `./tmp/selected-articles.json`
- `finalize-report.js` → `report-plan.json.outputFile`
