# HTML 大字报 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an HTML poster output branch to the `professional-daily-report` skill, producing a self-contained, aged-newspaper-style HTML file at `./daily/docs/daily-report-YYYY-MM-DD.html` when `report-plan.json.format === "html"`.

**Architecture:** Keep the existing Markdown workflow intact. Add a user-facing format choice at the start of the skill. Reuse the same `list-sources.js`, `fetch-articles.js`, and `dedup-articles.js` scripts. Introduce a new HTML reference template and extend `finalize-report.js` to read `report-content.html` and output `.html` when the plan says so.

**Tech Stack:** Plain Node.js ESM (no build), HTML5, CSS3 with inline SVG noise texture, no external dependencies.

## Global Constraints

- Existing Markdown daily-report workflow must remain unchanged.
- All helper scripts are plain Node.js ESM, no build step.
- HTML output must be a single self-contained file with embedded CSS.
- Visual style: A1 aged-newspaper, paper texture via inline SVG data URI, serif Chinese type.
- Default output path: `./daily/docs/daily-report-YYYY-MM-DD.html`.
- `report-plan.json` gains a `format` field (`"markdown"` | `"html"`), default `"markdown"`.
- AI writes `./tmp/report-content.html` directly for the HTML branch.
- `finalize-report.js` deletes `./tmp` after successful output.
- All repository checks (`npm run typecheck`, `npm run lint`, `npm test`) must pass after each task.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `skills/professional-daily-report/SKILL.md` | Modify | Add format choice prompt, HTML workflow steps, HTML template rules, placeholder list |
| `skills/professional-daily-report/reference/daily-report-template.html` | Create | Full HTML boilerplate with A1 newspaper styling and `<<::...>>` placeholders |
| `skills/professional-daily-report/scripts/finalize-report.js` | Modify | Detect `format === "html"`, read `report-content.html`, skip Markdown footer, default to `.html` |
| `test/skills/professional-daily-report/finalize-report.test.js` | Create | Verify finalize behavior for both Markdown and HTML plans |

---

## Task 1: Create the HTML reference template

**Files:**
- Create: `skills/professional-daily-report/reference/daily-report-template.html`

**Interfaces:**
- Consumes: placeholders replaced by AI based on `report-plan.json` and `selected-articles.json`
- Produces: a complete, self-contained HTML document string ready to be written to `./tmp/report-content.html`

- [ ] **Step 1: Write the HTML template file**

Create `skills/professional-daily-report/reference/daily-report-template.html` with the following requirements:

- Full HTML5 document with embedded CSS in `<style>`.
- Aged-newspaper A1 style:
  - Background `#f3ebd8`
  - Inline SVG fractal noise texture as data URI with `mix-blend-mode: multiply`
  - Radial gradient stains/age spots
  - Inset paper shadow
  - Serif Chinese fonts: `"Noto Serif SC", "Songti SC", "SimSun", serif`
  - Double-rule masthead border
  - First-letter drop cap in body copy
- Responsive layout:
  - Desktop: date-line as flex row, article body as 2 columns via `column-count: 2`
  - Mobile (`max-width: 640px`): single column, date-line stacked
- Structure:
  1. Masthead: `<<::topic>>` + English tagline + issue number
  2. Date line: Chinese date, weekday, report type, article count
  3. Lead paragraph
  4. Headline article: clickable bold title link, summary, bold insight
  5. Grouped articles under `<<::sectionTitle>>` headings
  6. Source stats list
- Use the exact placeholder syntax `<<::identifier description>>` listed in the spec.

Example minimal placeholder usage:

```html
<title><<::topic 大字报名称>></title>
<h1><<::topic>></h1>
```

- [ ] **Step 2: Verify the file is syntactically valid HTML**

Run:

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('skills/professional-daily-report/reference/daily-report-template.html', 'utf8');
if (!html.includes('<!DOCTYPE html>')) throw new Error('Missing doctype');
if (!html.includes('<<::topic')) throw new Error('Missing topic placeholder');
console.log('template ok');
"
```

Expected: `template ok`

- [ ] **Step 3: Commit**

```bash
git add skills/professional-daily-report/reference/daily-report-template.html
git commit -m "feat(skill): add HTML poster reference template"
```

---

## Task 2: Extend finalize-report.js for HTML output

**Files:**
- Modify: `skills/professional-daily-report/scripts/finalize-report.js`

**Interfaces:**
- Consumes: `report-plan.json.format`, `./tmp/report-content.md` or `./tmp/report-content.html`, `./tmp/selected-articles.json`
- Produces: final Markdown or HTML file, then cleans `./tmp`

- [ ] **Step 1: Add content file resolution based on format**

Change the script so it picks the correct content file and output extension.

```javascript
const DEFAULT_OUTPUT_DIR = './daily/docs';
const PLAN_FILE = join(TMP_DIR, 'report-plan.json');
const SELECTED_FILE = join(TMP_DIR, 'selected-articles.json');

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
```

- [ ] **Step 2: Update resolveOutputFile to honor format extension**

```javascript
function resolveOutputFile(plan) {
  if (plan.outputFile) return plan.outputFile;

  const dateStr = plan.date || formatDate(new Date());
  const ext = defaultExtensionFor(plan);
  return join(DEFAULT_OUTPUT_DIR, `daily-report-${dateStr}.${ext}`);
}
```

- [ ] **Step 3: Conditionally append Markdown footer only for Markdown**

```javascript
function buildFooter(plan) {
  if (plan.format === 'html') return '';
  return `

---

生成于 ${formatDateTime(new Date())} · 由 news-cli + professional-daily-report skill 生成
`;
}
```

- [ ] **Step 4: Update main() to use the new helpers**

```javascript
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
```

- [ ] **Step 5: Update the file header comment**

Change the top comment to:

```javascript
// Reads ./tmp/report-content.{md,html} + ./tmp/selected-articles.json,
// writes the final file named in report-plan.json, then cleans up ./tmp.
// Supports both Markdown and HTML output via report-plan.json.format.
```

- [ ] **Step 6: Run existing tests and lint/typecheck**

```bash
npm run lint
npm run typecheck
npm test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add skills/professional-daily-report/scripts/finalize-report.js
git commit -m "feat(skill): support HTML output in finalize-report.js"
```

---

## Task 3: Add tests for finalize-report.js

**Files:**
- Create: `test/skills/professional-daily-report/finalize-report.test.js`

**Interfaces:**
- Consumes: `finalize-report.js` executed as a child process with temporary `./tmp` directories
- Produces: passing tests for Markdown and HTML output paths

- [ ] **Step 1: Create the test file skeleton**

```javascript
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCRIPT = join(__dirname, '../../../skills/professional-daily-report/scripts/finalize-report.js');

defense: `, `keywords` for client-side filtering and scoring after fetch. When `format` is `html`, the same selected articles are used but AI writes HTML instead of Markdown.

- [ ] **Step 4: Add HTML-specific compliance rules**

Append a new subsection under "Step 4: Write the Report Body" called "HTML Branch".

Content:

```markdown
### HTML Branch

If `report-plan.json.format === "html"`, write `./tmp/report-content.html` instead of `./tmp/report-content.md`.

**Template file (MUST follow):** `skills/professional-daily-report/reference/daily-report-template.html`

**Rules:**
1. Replace every `<<::identifier description>>` placeholder with real content and remove the markers.
2. Output a complete, self-contained HTML file with embedded CSS.
3. Article titles must be clickable bold `<a>` links to the original URL.
4. Insight sentences must be wrapped in `<strong>` so they stand out from the summary.
5. Use the A1 aged-newspaper style: paper texture, serif fonts, double-rule masthead, first-letter drop cap.
6. Do not fabricate facts beyond article title/snippet.
7. Match the requested `style` in tone.
```

- [ ] **Step 5: Update Step 5 (Finalize) to mention HTML**

Change:

```markdown
## Step 5: Finalize

Run `finalize-report.js`. It reads `./tmp/report-content.{md,html}` according to `report-plan.json.format`, writes the final file to `./daily/docs/daily-report-YYYY-MM-DD.{md,html}` (or `outputFile`), and deletes `./tmp`.
```

- [ ] **Step 6: Update outputFile default and add format field to Quick Reference table**

Change the `outputFile` row to:

```markdown
| `outputFile` | no | `./daily/docs/daily-report-YYYY-MM-DD.{md\|html}` | final path |
```

Add a new row after `topic`:

```markdown
| `format` | no | `markdown` | `markdown` or `html` |
```

- [ ] **Step 7: Update Common Mistakes to include HTML**

Add:

```markdown
- Leaving `<<::...>>` placeholders in the final HTML
- Forgetting to set `format: "html"` in the plan when generating HTML
```

- [ ] **Step 8: Run lint and typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add skills/professional-daily-report/SKILL.md
git commit -m "docs(skill): document HTML poster workflow in SKILL.md"
```

---

## Task 5: End-to-end HTML smoke test

**Files:**
- No new files; uses existing scripts

**Interfaces:**
- Consumes: `list-sources.js`, `fetch-articles.js`, `dedup-articles.js`, `finalize-report.js`, and a hand-crafted HTML content file
- Produces: a generated HTML file in `./daily/docs/`

- [ ] **Step 1: Create a temporary end-to-end test directory**

```bash
mkdir -p /tmp/html-poster-e2e
cd /tmp/html-poster-e2e
```

- [ ] **Step 2: Write a fake plan and selected articles**

```bash
mkdir -p tmp
cat > tmp/report-plan.json <<'EOF'
{
  "topic": "AI 测试大字报",
  "format": "html",
  "date": "2026-07-03",
  "sources": [{"name": "aibase"}],
  "targetCount": 2
}
EOF

cat > tmp/selected-articles.json <<'EOF'
{
  "articles": [
    {"title": "Test Article One", "url": "https://example.com/1", "source": "aibase"},
    {"title": "Test Article Two", "url": "https://example.com/2", "source": "aibase"}
  ]
}
EOF
```

- [ ] **Step 3: Write a minimal fake report-content.html**

```bash
cat > tmp/report-content.html <<'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>AI 测试大字报</title><style>body{color:#333}</style></head>
<body><h1>AI 测试大字报</h1><p>Hello poster</p></body>
</html>
EOF
```

- [ ] **Step 4: Run finalize-report.js from the temp directory**

```bash
node /Users/dengwei.daviant/Desktop/for-me/news-cli/skills/professional-daily-report/scripts/finalize-report.js
```

Expected stderr output:

```
[finalize] wrote daily/docs/daily-report-2026-07-03.html (2 articles)
[finalize] cleaned ./tmp
```

- [ ] **Step 5: Verify output file exists and is valid HTML**

```bash
test -f daily/docs/daily-report-2026-07-03.html
node -e "
const html = require('fs').readFileSync('daily/docs/daily-report-2026-07-03.html', 'utf8');
if (!html.includes('<h1>AI 测试大字报</h1>')) throw new Error('missing content');
console.log('e2e html ok');
"
```

Expected: `e2e html ok`

- [ ] **Step 6: Clean up temp directory**

```bash
cd /
rm -rf /tmp/html-poster-e2e
```

- [ ] **Step 7: Commit any remaining changes**

If only Task 4 changed SKILL.md, nothing new to commit. If scripts changed, commit:

```bash
git status --short
# commit only if there are changes
git commit -m "chore(skill): finalize HTML poster smoke test" || true
```

---

## Self-Review Checklist

- [x] Spec coverage: format choice, HTML template, finalize extension, output path, self-contained CSS all map to tasks.
- [x] Placeholder scan: no TBD/TODO/fill-in-details in tasks.
- [x] Type consistency: `report-plan.json.format` string used consistently; file helpers use `join` and `existsSync`.
- [x] Existing Markdown workflow unchanged unless explicitly switched by `format: "html"`.
- [x] Tests included for both Markdown and HTML finalize paths.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-03-html-poster-plan.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach?
