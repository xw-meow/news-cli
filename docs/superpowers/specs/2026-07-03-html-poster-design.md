# Professional Daily Report HTML Poster（大字报）设计规格

> 文档类型：设计规格（Design Spec）  
> 创建日期：2026-07-03  
> 关联 Skill：`skills/professional-daily-report/`  

## 1. 背景与目标

在现有的 `professional-daily-report` Skill 中，用户已经可以生成 Markdown 日报。本规格新增一种输出格式：**HTML 大字报**，风格为「旧报纸头版」，具备纸质感、印刷感，适合截图分享、打印或作为独立网页阅读。

## 2. 用户选择入口

在 Skill 的最开始，AI 必须询问用户：

> 你要生成 Markdown 日报，还是 HTML 大字报？

- 若用户选 **Markdown**：沿用现有工作流，输出 `./daily/docs/daily-report-YYYY-MM-DD.md`
- 若用户选 **HTML 大字报**：进入本规格定义的新分支，输出 `./daily/docs/daily-report-YYYY-MM-DD.html`

用户可使用「大字报」、「海报」、「HTML 日报」、「报纸风」等词汇触发 HTML 分支。

## 3. 视觉设计

### 3.1 风格

采用 **旧报纸黄褐风格（A1）**，特点：

- 泛黄纸张底色 `#f3ebd8`
- SVG 噪点纹理 + multiply 混合模式模拟真实纸张
- 边缘径向渐变模拟岁月斑驳
- 内阴影营造纸张厚度
- 双线分隔（`border-bottom: 4px double #8b7355`）
- 衬线中文字体：`"Noto Serif SC", "Songti SC", "SimSun", serif`

### 3.2 版式

- **报纸头版式长页**，可纵向滚动
- **响应式多栏**：
  - 桌面端：头条独占全宽，正文双栏
  - 平板：可保留双栏
  - 移动端：自动折叠为单栏
- 无外部依赖，CSS 全部内嵌

### 3.3 报纸结构

从上到下依次：

1. **报头（Masthead）**
   - 大字报名称（由 `topic` 决定，默认「AI 时报」）
   - 英文副标题 + 期号
2. **日期栏**
   - 左侧：中文日期（如「公元二〇二六年七月三日 · 星期五」）
   - 中间：报告类型（如「AI 行业日报大字报」）
   - 右侧：精选文章总数
3. **导语（Lead）**
   - 2-3 句话概括今日核心趋势
4. **头条文章**
   - 大标题（可点击跳转原文）
   - 摘要 + 加粗洞察句
   - 正文首字下沉
5. **分组文章（可多组）**
   - 每组一个主题标题
   - 每篇文章标题链接 + 摘要 + 加粗洞察
6. **来源统计**
   - 各来源入选文章数

### 3.4 响应式断点

```css
@media (max-width: 640px) {
  .columns { column-count: 1; }
  .date-line { flex-direction: column; gap: 4px; align-items: center; }
}
```

## 4. 数据流

HTML 分支复用现有脚本：

```
1. list-sources.js       → ./tmp/available-sources.json
2. 创建 report-plan.json  → 增加 format: "html" 字段
3. fetch-articles.js     → ./tmp/raw-<source>.json
4. dedup-articles.js     → ./tmp/selected-articles.json
5. AI 生成               → ./tmp/report-content.html
6. finalize-report.js    → ./daily/docs/daily-report-YYYY-MM-DD.html
```

### 4.1 report-plan.json 扩展

新增可选字段：

```json
{
  "topic": "AI 行业早报",
  "format": "html",
  "style": "正式",
  "length": "中",
  "keywords": ["大模型", "OpenAI"],
  "date": "2026-07-03",
  "outputFile": "daily/docs/daily-report-2026-07-03.html",
  "sources": [
    {"name": "aibase"},
    {"name": "36kr"}
  ],
  "targetCount": 10
}
```

- `format`: `"markdown"` 或 `"html"`，默认 `"markdown"`
- 其他字段含义与现有 Markdown 分支一致

## 5. HTML 模板规范

### 5.1 模板文件位置

`skills/professional-daily-report/reference/daily-report-template.html`

### 5.2 模板占位符

沿用 Markdown 模板的 `<<::identifier description>>` 语法：

| 占位符 | 说明 |
|---|---|
| `<<::topic 大字报名称>>` | 报头主标题 |
| `<<::englishTagline 英文副标题>>` | 报头副标题 |
| `<<::issueNumber 期号>>` | 第 N 期 |
| `<<::date 日期>>` | 日期行（如「2026-07-03」或「公元二〇二六年七月三日」） |
| `<<::weekday 星期>>` | 星期几 |
| `<<::reportType 报告类型>>` | 报告类型描述（如「AI 行业日报大字报」） |
| `<<::articleCount 入选文章数>>` | 来源统计总数 |
| `<<::lead 导语>>` | 2-3 句核心趋势概括 |
| `<<::headlineTitle 头条标题>>` | 头条大标题 |
| `<<::headlineUrl 头条链接>>` | 头条原文链接 |
| `<<::headlineSummary 头条摘要>>` | 头条摘要 |
| `<<::headlineInsight 头条洞察>>` | 头条加粗洞察句 |
| `<<::sectionTitle 分组标题>>` | 主题分组标题 |
| `<<::articleTitle 文章标题>>` | 文章标题 |
| `<<::articleUrl 文章URL>>` | 文章原文链接 |
| `<<::articleSummary 文章摘要>>` | 文章摘要 |
| `<<::articleInsight 文章洞察>>` | 加粗洞察句 |
| `<<::sourceName 来源名称>>` | 来源名称 |
| `<<::sourceCount 来源文章数>>` | 该来源入选数 |

### 5.3 模板合规规则

1. 所有 `<<::...>>` 占位符必须被替换并删除。
2. 文章标题必须是可点击的 `<a>` 链接，加粗。
3. 洞察句必须加粗，与摘要视觉区分。
4. 不使用 YAML 元数据块。
5. 输出为完整、自包含的 HTML 文件。
6. 保留报纸结构，不增删、不重排章节。

## 6. 脚本改动

### 6.1 finalize-report.js

需要识别 `report-plan.json.format`：

- `format === "html"`：读取 `./tmp/report-content.html`，输出 `.html` 文件
- 否则：保持现有 Markdown 行为

默认输出路径：

- Markdown：`./daily/docs/daily-report-YYYY-MM-DD.md`
- HTML：`./daily/docs/daily-report-YYYY-MM-DD.html`

### 6.2 新增/修改文件清单

| 文件 | 动作 | 说明 |
|---|---|---|
| `skills/professional-daily-report/SKILL.md` | 修改 | 增加格式选择、HTML 分支工作流、HTML 模板规则 |
| `skills/professional-daily-report/reference/daily-report-template.html` | 新增 | HTML 大字报模板 |
| `skills/professional-daily-report/scripts/finalize-report.js` | 修改 | 支持 `.html` 输出，根据 `format` 决定路径和清理行为 |

## 7. 输出示例路径

```
./daily/docs/daily-report-2026-07-03.html
```

文件打开方式：双击用浏览器打开，或 `open ./daily/docs/daily-report-2026-07-03.html`。

## 8. 限制与约束

- 不引入外部图片，纸纹使用内联 SVG data URI。
- 不依赖外部 CSS/JS 文件。
- 大字报内容基于 `selected-articles.json`，AI 不编造超出标题/摘要的事实。
- 保留 today-only 过滤规则。

## 9. 验收标准

- [ ] SKILL.md 明确区分 Markdown / HTML 两个分支
- [ ] HTML 模板存在且包含所有占位符
- [ ] `report-plan.json` 支持 `format` 字段
- [ ] `finalize-report.js` 能正确输出 `.html`
- [ ] 生成的 HTML 在桌面和移动端均正常显示
- [ ] 报纸风格符合 A1 设计稿
- [ ] 根目录 `npm run typecheck`、`npm run lint`、`npm test` 全部通过
- [ ] 新增文件不影响现有 Markdown 日报流程

## 10. 相关资源

- 视觉稿文件：`/.superpowers/brainstorm/53987-1783068925/content/`
  - `visual-style-v1.html` — 初始三种风格
  - `visual-style-v2.html` — A1/A2 纸质感迭代
  - `implementation-options.html` — 实现方案对比
  - `design-confirmation.html` — 最终确认稿
