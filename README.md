# news-cli

命令行新闻获取工具，支持多新闻源插件式扩展。

## 安装

```bash
git clone <repo-url>
cd news-cli
npm install
npm run build
npm link
```

## 使用

### 查看可用源

```bash
news list
# google-news:    Google News — global headlines by category
# google-news-cn: Google News 中国版 — 中文新闻，支持分类和关键词搜索
# weibo:          微博热搜榜 — 实时热搜，支持按分类和关键词过滤
# pengpai:        澎湃新闻 — 专注时政与思想，支持22个频道和关键词搜索
```

### Google News（全球版）

```bash
# 头条
news get google-news

# 按分类过滤
news get google-news --category technology

# 关键词搜索（逗号分隔 = OR 关系）
news get google-news --keyword "AI,GPT"

# 限制条数 + JSON 输出
news get google-news --category business --limit 10 --json

# 管道友好
news get google-news --json | jq '.[].title'
```

### Google News 中国版

```bash
# 中文头条
news get google-news-cn

# 中文分类
news get google-news-cn --category technology

# 中文关键词搜索
news get google-news-cn --keyword "芯片,半导体" --limit 10 --json
```

### 微博热搜

```bash
# 实时热搜榜
news get weibo

# 按分类过滤
news get weibo --category 民生新闻

# 关键词搜索（逗号分隔 = OR 关系）
news get weibo --keyword "AI,芯片"

# JSON 输出
news get weibo --limit 10 --json
```

### 澎湃新闻

```bash
# 要闻（默认）
news get pengpai

# 指定频道（共22个）
news get pengpai --category 财经
news get pengpai --category 科技
news get pengpai --category 体育

# 关键词搜索
news get pengpai --keyword AI

# 频道 + 关键词组合
news get pengpai --category 财经 --keyword AI --limit 10

# 大批量拉取（自动分页，500ms 间隔防封）
news get pengpai --limit 100 --json
```

### 查看分类

```bash
news categories google-news
news categories google-news-cn
news categories weibo
news categories pengpai
```

### 可用分类

| 分类 | 参数 |
|------|------|
| 头条 | `headlines`（默认） |
| 国际 | `world` |
| 商业 | `business` |
| 科技 | `technology` |
| 娱乐 | `entertainment` |
| 体育 | `sports` |
| 科学 | `science` |
| 健康 | `health` |

## 开发

```bash
npm run dev          # tsx 热运行
npm run build        # esbuild 打包 → dist/index.js
npm test             # vitest 跑测试
npm run test:watch   # vitest 监听模式
npm run lint         # ESLint 检查
npm run lint:fix     # ESLint 自动修复
npm run typecheck    # tsc 类型检查
```

## 项目结构

```
src/
├── index.ts                       # 入口：注册所有 source → 启动 CLI
├── cli.ts                         # commander 命令（get/list/categories）
├── core/
│   ├── types.ts                   # NewsArticle, NewsSource, NewsCliError
│   ├── registry.ts                # source 注册表
│   ├── fetcher.ts                 # HTTP 抓取（超时/重试 + JSON POST）
│   └── formatter.ts               # 终端表格 + JSON 输出
├── news-source/
│   ├── google-news/
│   │   ├── index.ts               # 全球版（英文）
│   │   ├── parser.ts              # RSS XML → NewsArticle[]
│   │   └── constants.ts           # URL 模板、分类定义
│   ├── google-news-cn/
│   │   ├── index.ts               # 中国版（中文，复用 parser）
│   │   └── constants.ts           # 中国区 locale 参数
│   ├── weibo/
│   │   ├── index.ts               # 微博热搜榜
│   │   ├── parser.ts              # JSON → NewsArticle[]
│   │   └── constants.ts           # API URL、默认值
│   └── pengpai/
│       ├── index.ts               # 澎湃新闻（22频道 + 分页 + 关键词）
│       ├── parser.ts              # JSON → NewsArticle[]
│       └── constants.ts           # 频道映射、API URL
└── utils/
    └── logger.ts                  # stderr 日志

test/                              # vitest 测试用例 (104 tests)
scripts/build.js                   # esbuild 构建脚本
```

## 扩展新新闻源

1. 在 `src/news-source/` 下新建文件夹
2. 创建 `index.ts`，实现 `NewsSource` 接口：

```ts
import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';

export const mySource: NewsSource = {
  name: 'my-source',
  description: 'My News Source',

  async listCategories() {
    return ['top', 'latest'];
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    // 实现抓取逻辑，返回 NewsArticle[]
  },
};
```

3. 在 `src/index.ts` 注册：

```ts
import { mySource } from './news-source/my-source/index.js';
registerSource(mySource);
```

4. 重新构建：`npm run build`

## 技术栈

TypeScript · esbuild · commander · cli-table3 · fast-xml-parser · vitest · ESLint
