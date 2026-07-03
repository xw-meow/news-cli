# 专业日报编写

基于 `news-cli` 的 `news get --json` 输出，自动生成可直接发布的 Markdown 日报/Newsletter。

## 使用前提

1. `news` 命令必须在 `PATH` 中可用。
   - 若不可用，提示用户先执行：`npm run build && npm link`。
2. 执行目录可写，Skill 会创建 `./tmp/` 存放中间文件。

## 用户诉求输入字段

从用户请求中提取以下字段，缺省时使用默认值：

| 字段 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| 主题 | 是 | — | 日报主题，如 "AI 行业早报" |
| 目标读者 | 否 | "对该主题感兴趣的读者" | 如 "AI 从业者" |
| 风格 | 否 | "平衡" | 正式 / 轻松 / 深度 / 短讯 |
| 篇幅 | 否 | "中" | 短 / 中 / 长，或具体条数 |
| 关键词 | 否 | 无 | 逗号分隔，如 "大模型,OpenAI" |
| 指定源 | 否 | 自动推荐 | 逗号分隔，如 "aibase,36kr,tencent-news" |
| 输出文件 | 否 | `./daily-report-YYYY-MM-DD.md` | 最终日报文件路径 |

**示例请求：**

> 帮我写一份今天的 AI 行业日报，面向 AI 从业者，正式风格，10 条左右，保存到 docs/ai-daily.md。

## 主 SOP

1. **前置检查**
   - 执行 `which news` 或 `news --version`，确认 `news` 命令可用。
   - 若当前目录不存在 `./tmp/`，执行 `mkdir -p ./tmp/`。

2. **检测子代理支持**
   - 若环境支持 `task` 工具：进入「子代理并行执行」流程。
   - 若不支持：进入「串行 Fallback SOP」。

3. **子代理并行执行 5 阶段**
   - **Stage 1 需求解析**：派发子代理生成 `./tmp/report-plan.json`。
   - **Stage 2 并行抓取**：根据 `report-plan.json` 中的 `sources`，为每个源派发一个子代理执行抓取，输出 `./tmp/raw-<source>.json`。
   - **Stage 3 去重筛选**：派发子代理合并所有 `raw-*.json`，输出 `./tmp/selected-articles.json`。
   - **Stage 4 内容生成**：派发子代理基于 `selected-articles.json` 生成 `./tmp/report-content.md`。
   - **Stage 5 输出整理**：派发子代理整理并写入最终 `outputFile`。

4. **完成后向用户报告**
   - 最终文件路径。
   - 收录文章数量与主要来源。

## 子代理任务清单与中间文件契约

### Stage 1：需求解析

- **输入**：用户原始请求。
- **行为**：
  - 提取主题、目标读者、风格、篇幅、关键词、指定源、输出文件。
  - 若用户未指定源，按「新闻源推荐映射表」选择源组合。
  - 将篇幅映射为 `targetCount`：短 5-7 条、中 8-12 条、长 13-20 条。
- **输出文件**：`./tmp/report-plan.json`
- **JSON 结构**：

```json
{
  "topic": "AI 行业早报",
  "audience": "AI 从业者",
  "style": "正式",
  "length": "中",
  "keywords": ["大模型", "OpenAI"],
  "outputFile": "docs/ai-daily.md",
  "sources": [
    {"name": "aibase", "category": null, "limit": 20, "keywords": "大模型,OpenAI"},
    {"name": "36kr", "category": "AI", "limit": 20, "keywords": "大模型,OpenAI"},
    {"name": "tencent-news", "category": "科技/AI", "limit": 20, "keywords": "大模型,OpenAI"},
    {"name": "weibo", "category": null, "limit": 20, "keywords": "大模型,OpenAI,AI"}
  ],
  "targetCount": 10
}
```

### Stage 2：并行抓取

- **输入**：`./tmp/report-plan.json` 中的 `sources`。
- **行为**：为每个源启动一个子代理，执行：

```bash
news get <name> [-c <category>] -l <limit> -k <keywords> --json > ./tmp/raw-<name>.json
```

- 若源不支持 `-c` 参数，或 `category` 为 `null`，则省略 `-c`。
- **输出文件**：每个源一个 `./tmp/raw-<name>.json`，内容为 `NewsArticle[]`。

### Stage 3：去重筛选

- **输入**：所有 `./tmp/raw-<name>.json`。
- **行为**：
  1. 合并所有源的文章。
  2. URL 精确去重。
  3. 标题相似度去重（相似度 ≥ 85% 视为重复，保留发布时间最新）。
  4. 按关键词过滤标题与摘要。
  5. 按来源权重、时效性、标题相关性打分排序。
  6. 按 `targetCount` 截断。
- **输出文件**：`./tmp/selected-articles.json`
- **JSON 结构**：

```json
{
  "plan": { /* report-plan.json 内容 */ },
  "articles": [
    {
      "id": "abc123",
      "title": "...",
      "url": "...",
      "source": "36kr",
      "snippet": "...",
      "publishedAt": "2026-07-03T08:00:00Z",
      "category": "AI",
      "selectedReason": "来源权威、时效性高、与主题高度相关"
    }
  ]
}
```

### Stage 4：内容生成

- **输入**：`./tmp/selected-articles.json`。
- **行为**：按「Newsletter Markdown 模板」生成正文：
  - 标题：主题 + 日期。
  - 导语：2-3 句话总结今日核心趋势。
  - 分栏：按主题或来源分栏，每栏 3-5 条。
  - 每条新闻：标题、2-3 句话摘要、1 句观点/解读、原文链接。
  - 结语：1-2 句话。
- **输出文件**：`./tmp/report-content.md`

### Stage 5：输出整理

- **输入**：`./tmp/report-content.md`。
- **行为**：
  1. 检查 Markdown 格式是否完整。
  2. 补充元数据：生成时间、来源统计。
  3. 若 `outputFile` 父目录不存在，执行 `mkdir -p` 创建。
  4. 将内容写入 `outputFile`。
- **输出文件**：`outputFile` 指定路径。

## 新闻源推荐映射表

用户未指定源时，按主题匹配下表：

| 主题 | 推荐源 | 默认分类 / 关键词 |
|---|---|---|
| AI / 人工智能 | `aibase`, `36kr`-AI, `tencent-news`-科技/AI, `weibo` | AI、大模型、OpenAI |
| 科技 / 互联网 | `ithome`, `36kr`-科技, `tencent-news`-科技/AI, `weibo`, `hackernews`-top | 科技、互联网 |
| 财经 / 商业 | `cls`-头条, `36kr`-财经, `yicai`-最新, `tencent-news`-财经 | 财经、股市、商业 |
| 汽车 | `autohome`-最新, `36kr`-汽车 | 汽车、新能源 |
| 综合 / 热点 | `pengpai`-要闻, `chinanews`-即时新闻, `weibo`, `google-news-cn`-headlines | 热点、要闻 |
| 国际 | `bbc`-technology, `google-news`-world, `hackernews`-top | 国际、全球 |

**规则：**

- 主题无法匹配时，默认使用「综合 / 热点」组合。
- 用户指定源时，完全以用户为准，不再使用推荐表。
- 关键词同时用于 `news get` 的 `-k` 参数和生成阶段的过滤。

## 去重与筛选规则

1. **URL 去重**：URL 完全一致视为同一文章，仅保留一条。
2. **标题相似度去重**：使用 Levenshtein 距离，相似度 ≥ 85% 视为重复；重复组内保留 `publishedAt` 最新的条目，若时间为空则保留组内第一条。
3. **关键词过滤**：标题或摘要中包含任一关键词即保留；无关键词时不过滤。
4. **打分排序**：
   - 时效性：发布时间越新分数越高，时间为空计最低分。
   - 来源权重：垂直媒体 > 综合媒体 > 社交平台。
   - 标题相关性：含关键词越多分数越高。
5. **截断**：按 `targetCount` 截断，短 5-7 条、中 8-12 条、长 13-20 条。

## Newsletter Markdown 模板

```markdown
# {主题} · {日期}

> 读者：{目标读者} | 风格：{风格} | 共 {N} 条

## 导语

{2-3 句话总结今日核心趋势}

## {分栏标题 1}

### {文章标题 1}

{2-3 句话摘要}

{1 句观点/解读}

[原文链接]({url})

### {文章标题 2}

...

## {分栏标题 2}

...

## 今日来源

- {source1}: {count} 条
- {source2}: {count} 条

---

生成于 {YYYY-MM-DD HH:mm} · 由 news-cli + 专业日报编写 Skill 生成
```

## 串行 Fallback SOP

若环境不支持 `task` 工具，当前 AI 按以下步骤串行执行：

1. **解析诉求**：提取字段，生成 `./tmp/report-plan.json`。
2. **推荐源**：若用户未指定源，按「新闻源推荐映射表」选择源组合。
3. **串行抓取**：逐个执行 `news get <source> ... --json`，保存为 `./tmp/raw-<source>.json`。
4. **去重筛选**：合并、去重、过滤、排序、截断，生成 `./tmp/selected-articles.json`。
5. **生成正文**：按模板写 `./tmp/report-content.md`。
6. **保存文件**：整理元数据并写入 `outputFile`。

## 失败处理与边界说明

- **news 命令不可用**：停止执行，提示用户运行 `npm run build && npm link`。
- **某个源抓取失败**：记录失败原因到 `./tmp/fetch-errors.log`，跳过该源，不影响整体流程。
- **抓取结果为空**：向用户说明未找到相关内容，建议放宽关键词或更换来源。
- **去重精度**：标题相似度去重为启发式策略，极端情况下可能误判或漏判。
- **实时性**：日报内容以执行抓取时的数据为准，不保证毫秒级实时。
- **Token 限制**：单源默认抓取 20 条，若上下文受限可降低 `limit` 或减少源数量。
- **网络依赖**：抓取阶段依赖各新闻源可访问性，失败源应跳过并记录。
- **输出覆盖**：若 `outputFile` 已存在，直接覆盖，执行前不额外确认。
