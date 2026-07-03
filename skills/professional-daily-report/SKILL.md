---
name: professional-daily-report
description: Use when the user asks for a blog-ready or newsletter-style Markdown daily report compiled from news-cli sources, especially when they mention daily reports, newsletters, summarized news, sections, or commentary
---

# 专业日报生成

从 `news get --json` 输出生成可直接发布的中文 Markdown 日报 / Newsletter。报告按主题分组，包含导语、摘要、洞察和来源统计。

## 何时使用

- 用户要求生成“日报”“daily report”或“newsletter”
- 用户需要归纳、分组或带评论的新闻，而非原始标题列表
- 输出目标是单一 Markdown 文件，可用于博客或邮件订阅

## 何时不使用

- 用户只要原始标题 → 直接运行 `news get`
- 用户只要实时单源输出 → 不需要重写

## 快速参考

| 字段 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `topic` | 是 | — | 日报标题 |
| `audience` | 否 | 对该主题感兴趣的读者 | 元信息行 |
| `style` | 否 | 平衡 | 语气：正式 / 轻松 / 深度 / 短讯 |
| `length` | 否 | 中 | 映射 `targetCount`：短=5–7，中=8–12，长=13–20 |
| `keywords` | 否 | [] | 过滤与加权 |
| `date` | 否 | 今天（本地时间） | `YYYY-MM-DD` 日期过滤 |
| `sources` | 否 | 自动推荐 | `[{"name": "aibase"}]` |
| `outputFile` | 否 | `./daily-report-YYYY-MM-DD.md` | 最终文件路径 |

## 核心流程

1. **发现来源**：`node skills/professional-daily-report/scripts/list-sources.js`
2. **创建 `./tmp/report-plan.json`**，提取用户需求
3. **抓取**：`node skills/professional-daily-report/scripts/fetch-articles.js`
4. **筛选**：`node skills/professional-daily-report/scripts/dedup-articles.js`
5. **撰写 `./tmp/report-content.md`**，严格遵循模板
6. **定稿**：`node skills/professional-daily-report/scripts/finalize-report.js`

辅助脚本会在 `news` 命令缺失时自动安装 `news-cli`：优先在仓库内执行构建并 link，否则尝试全局安装。

## Step 0：发现来源

运行 `list-sources.js`，它会生成 `./tmp/available-sources.json`，包含 `available`（全部来源）和 `recommended`（按主题推荐）两个数组。从 `recommended` 中挑选 2–5 个互补来源；若主题较偏，从 `available` 中手动选择。每个来源使用默认分类，即 `category: null`。

## Step 1：创建 `report-plan.json`

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
    {"name": "36kr"}
  ],
  "targetCount": 10
}
```

## Step 2–3：抓取与筛选

依次运行 `fetch-articles.js` 和 `dedup-articles.js`。默认每个来源抓取 50 篇。`dedup-articles.js` 会执行 URL 去重、标题相似度去重（≥ 85%）、**仅保留今日文章**、关键词过滤、打分，并截断至 `targetCount`。

## Step 4：撰写报告正文

读取 `./tmp/selected-articles.json`，写入 `./tmp/report-content.md`。

**必须遵循的模板文件：** `skills/professional-daily-report/reference/daily-report-template.md`

**占位符通用规则：** 模板中所有 `<<::标识符 描述>>` 都必须替换为真实内容，并彻底删除 `<<::` 和 `>>` 标记。描述文本用于提示该位置应填写什么，不会出现在最终输出中。未来若引入其他模板，同样适用此规则。

**合规规则：**

1. **严格遵循模板结构。** 不得增加、删除、重命名或调整章节顺序。
2. **重复文章条目结构：** 对每个入选文章生成 `### 标题`、摘要段落、洞察句、`[原文链接](URL)`。相关文章归入同一个 `## 分组标题`；主题变化时开启新分组。
3. **保持精确 Markdown 格式：** 标题行、元信息行、`## 导语`、`## 今日来源` 必须与模板一致。
4. **不得编造** 文章标题/摘要以外的事实。
5. **匹配请求的 `style`** 语气。
6. **只输出日报 Markdown** 到 `./tmp/report-content.md`；不要加代码块或解释。

## Step 5：定稿

运行 `finalize-report.js`。它会在正文前追加 YAML 元数据、在末尾追加生成信息，并写入 `outputFile`。

## 失败处理

- `news` 不存在：脚本会自动安装；仅当仓库构建和全局安装都失败时才停止
- 单个来源失败： stderr 记录，继续处理其他来源
- 过滤后无文章：告知用户并建议放宽关键词或更换来源
- 输出文件已存在：直接覆盖，无需询问

## 常见错误

- 最终 Markdown 中仍保留 `<<::...>>` 占位符
- 跳过今日日期过滤，混入旧文章
- 编造标题/摘要未提及的内容
- 增加模板中没有的章节
- 用 Markdown 代码块包裹正文

## 辅助脚本

所有脚本均为纯 Node.js ESM，无需构建。详细行为见 `skills/professional-daily-report/scripts/` 内联注释。

- `list-sources.js` → `./tmp/available-sources.json`
- `fetch-articles.js` → `./tmp/raw-<source>.json`
- `dedup-articles.js` → `./tmp/selected-articles.json`
- `finalize-report.js` → `report-plan.json.outputFile`
