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

所有新闻源共用一套命令模式：

```bash
# 列出可用新闻源
news list

# 查看某个源的分类
news categories <source>

# 获取新闻（默认 20 条，表格输出）
news get <source>

# 指定分类
news get <source> -c <category>

# 限制条数
news get <source> -l 10

# 关键词过滤（逗号分隔 = OR，不区分大小写）
news get <source> -k "关键词1,关键词2"

# JSON 输出（管道友好）
news get <source> --json
news get <source> --json | jq '.[].title'
```

## 已录入新闻源

| 源名 | 说明 | 分类数 | 默认分类 |
|------|------|--------|----------|
| `google-news` | Google News 全球版（英文） | 8 | `headlines` |
| `google-news-cn` | Google News 中国版（中文） | 8 | `headlines` |
| `weibo` | 微博热搜榜 | 动态 | — |
| `pengpai` | 澎湃新闻 — 频道+搜索，自动分页 | 22 | `要闻` |
| `chinanews` | 中国新闻网 — RSS，24 个分类频道 | 24 | `即时新闻` |
| `sspai` | 少数派 — 派早报/派晚报精选，关键词过滤 | 0 | — |
| `ithome` | IT之家 — 前沿科技新闻，支持20个分类 | 20 | `业界` |
| `cls` | 财联社 — 专业财经资讯，支持热点和头条 | 2 | `热点` |
| `aibase` | AIbase — AI 领域最新资讯，分页抓取 | 0 | — |
| `tencent-news` | 腾讯新闻 — POST API，5 个频道 | 5 | `科技/AI` |

### google-news / google-news-cn

全球版与中国版共用同一套分类（中国版参数为中文 locale）：

`headlines` `world` `business` `technology` `entertainment` `sports` `science` `health`

### weibo

微博实时热搜，分类从 API 动态获取，常见的有：热搜、民生新闻、时事、财经、科技、体育、娱乐、教育 等。

### pengpai

澎湃新闻 22 个频道：

`要闻` `深度` `直播` `视频` `时事` `国际` `财经` `视听` `科技` `暖闻` `澎湃号` `智库` `思想` `生活` `上海` `奔流` `健康` `体育` `评论` `ESG` `文旅` `短剧`

### chinanews

中国新闻网 24 个 RSS 分类：

`即时新闻` `要闻导读` `时政新闻` `东西问` `国际新闻` `社会新闻` `财经新闻` `生活` `健康` `大湾区` `华人` `文娱新闻` `体育新闻` `视频` `图片` `创意` `直播` `教育` `法治` `同心` `铸牢中华民族共同体意识` `一带一路` `理论` `中国—东盟商贸资讯平台`

### sspai

少数派编辑部官方账号的派早报/派晚报内容。通过活动列表筛选栏目，逐篇抓取文章详情，将 `body_extends` 子篇拆分为独立新闻。

- 无分类
- 自动过滤「可能错过的好文章」「少数派的近期动态」「看看就行的简讯」等非新闻栏目
- 关键词通过 `titleContains` 本地标题匹配

### ithome

IT之家首页 HTML 解析，无需 RSS/API。进入各分类页面直接抓取新闻列表，支持 AJAX 分页补足。

20 个分类：

`业界` `手机` `电脑` `测评` `视频` `AI` `苹果` `iPhone` `鸿蒙` `软件` `智车` `数码` `学院` `游戏` `直播` `5G` `微软` `Win10` `Win11` `专题`

### cls

财联社 JSON API 抓取。热点列表无分页一次性返回，头条列表通过 `last_time` 游标分页。

2 个分类：`热点` `头条`

- 接口签名：`MD5(SHA1(sorted_query_string))`，无 secret key
- API 配置（app、os、sv 等）抽离为常量，网站升级时可动态修改

### aibase

AIbase JSON API 抓取，无分类，通过 `pageNo` 递增分页。

- 无分类
- 文章详情 URL：`https://news.aibase.com/zh/news/:oid`
- `createTime` 字段为本地时间字符串（如 `2026-06-16 10:04:40`），解析为 ISO 格式

### tencent-news

腾讯新闻 JSON POST API，单次请求最多 50 条，支持 5 个频道。

5 个频道：`科技/AI` `要闻` `财经` `体育` `娱乐`

- API 通过 `channel_id` 区分频道，`item_count` 控制返回条数
- 翻页分页机制在该接口上返回重复数据，因此单次拉取即可满足需求
- 文章 URL 优先使用 `link_info.url`，回退到 `share_url`

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
│   │   ├── index.ts               # 中国版（中文，复用 google-news parser）
│   │   └── constants.ts           # 中国区 locale 参数
│   ├── weibo/
│   │   ├── index.ts               # 微博热搜榜
│   │   ├── parser.ts              # JSON → NewsArticle[]
│   │   └── constants.ts           # API URL、默认值
│   ├── pengpai/
│   │   ├── index.ts               # 澎湃新闻（22 频道 + 分页 + 关键词）
│   │   ├── parser.ts              # JSON → NewsArticle[]
│   │   └── constants.ts           # 频道映射、API URL
│   ├── chinanews/
│   │   ├── index.ts               # 中国新闻网（24 个 RSS 分类）
│   │   ├── parser.ts              # RSS XML → NewsArticle[]
│   │   └── constants.ts           # 分类-RSS URL 映射
│   └── sspai/
│       ├── index.ts               # 少数派（派早报/派晚报，两步 API 抓取）
│       ├── parser.ts              # JSON → NewsArticle[]，HTML 链接提取
│       └── constants.ts           # API URL、JWT、栏目/排除关键词
│   └── ithome/
│       ├── index.ts               # IT之家（HTML 解析 + AJAX 分页，20 个分类）
│       ├── parser.ts              # HTML regex → NewsArticle[]
│       └── constants.ts           # 分类-URL-domain 映射
│   └── cls/
│       ├── index.ts               # 财联社（JSON API，热点+头条，last_time 分页）
│       ├── parser.ts              # JSON → NewsArticle[]
│       ├── sign.ts                # MD5(SHA1(sorted_query_string)) 签名
│       └── constants.ts           # API 配置常量（app/os/sv 等）
│   └── aibase/
│       ├── index.ts               # AIbase（JSON API，pageNo 分页）
│       ├── parser.ts              # JSON → NewsArticle[]
│       └── constants.ts           # API 配置常量
│   └── tencent-news/
│       ├── index.ts               # 腾讯新闻（JSON POST API，5 个频道）
│       ├── parser.ts              # JSON → NewsArticle[]
│       └── constants.ts           # channel_id 映射、API 配置
└── utils/
    ├── index.ts                   # 公共工具：sleep() / titleContains()
    └── logger.ts                  # stderr 日志

test/                              # vitest 测试用例 (212 tests)
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
