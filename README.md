# news-cli

命令行新闻获取工具，支持多新闻源插件式扩展。第一期实现 Google News。

## 安装

```bash
git clone <repo-url>
cd news-cli
npm install
npm run build
npm link
```

## 使用

```bash
# 列出所有可用新闻源
news list

# 列出某个源的分类
news categories google-news

# 抓取新闻（默认 20 条头条）
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

### 可用分类

| 分类 | 命令参数 |
|------|----------|
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
├── index.ts                    # 入口：注册 source → 启动 CLI
├── cli.ts                      # commander 命令（get/list/categories）
├── core/
│   ├── types.ts                # NewsArticle, NewsSource, NewsCliError
│   ├── registry.ts             # source 注册表
│   ├── fetcher.ts              # HTTP 抓取（超时/重试）
│   └── formatter.ts            # 终端表格 + JSON 输出
├── news-source/
│   └── google-news/
│       ├── index.ts            # 实现 NewsSource 接口
│       ├── parser.ts           # RSS XML → NewsArticle[]
│       └── constants.ts        # URL 模板、分类定义
└── utils/
    └── logger.ts               # stderr 日志

test/                           # vitest 测试用例
scripts/build.js                # esbuild 构建脚本
```

## 扩展新新闻源

1. 在 `src/news-source/` 下新建文件夹，如 `hacker-news/`
2. 创建 `index.ts`，实现 `NewsSource` 接口：

```ts
import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';

export const hackerNewsSource: NewsSource = {
  name: 'hacker-news',
  description: 'Hacker News — tech & startup news',

  async listCategories() {
    return ['top', 'new', 'show', 'ask'];
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    // 实现抓取逻辑，返回 NewsArticle[]
  },
};
```

3. 在 `src/index.ts` 注册：

```ts
import { hackerNewsSource } from './news-source/hacker-news/index.js';
registerSource(hackerNewsSource);
```

4. 重新构建：`npm run build`

## 技术栈

TypeScript · esbuild · commander · cli-table3 · fast-xml-parser · vitest · ESLint
