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

## Plugins

Plugins extend news-cli with new sources and commands, loaded dynamically at startup.

### Plugin locations

- `<cwd>/.news-plugins/<name>/` — local (project-specific)
- `~/.news-plugins/<name>/` — global

Local plugins override global plugins with the same name.

### Commands

```bash
news plugin install <url>              # Install from URL (.js or .zip)
news plugin install <npm-package>      # Install from npm
news plugin install <target> -g        # Install globally
news plugin install <target> --force   # Overwrite existing

news plugin list                       # List installed plugins
news plugin list --json

news plugin uninstall <name>           # Remove plugin
news plugin uninstall <name> -g

news plugin update <name>              # Update plugin
news plugin update <name> -g
```

### Writing a plugin

A plugin is a directory with `package.json` and an entry file exporting a `plugin` object:

```js
// index.js
export const plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  register(program, registry) {
    // Register a new news source
    registry.registerSource({
      name: 'my-source',
      description: 'My custom news source',
      async listCategories() { return ['tech', 'sports']; },
      async fetch(options) { return [/* NewsArticle[] */]; },
    });

    // Register a new CLI command
    program.command('hello').action(() => console.log('Hello from plugin!'));
  },
};
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
| `36kr` | 36氪 — POST API 翻页，17 个频道 | 17 | `最新` |
| `people-cn` | 人民网 — 每日要闻回顾，HTML 解析 + 日期回溯 | 0 | — |
| `huxiu` | 虎嗅网 — 商业科技资讯，POST API 翻页，14 个频道 | 14 | `全部` |
| `yicai` | 第一财经 — 首页 script JSON 解析，头条+最新 | 2 | `最新` |
| `autohome` | 汽车之家 — HTML 解析 + 逐页分页，11 个分类 | 11 | `最新` |
| `bbc` | BBC News — Content Collection API 翻页，7 个分类 | 7 | `technology` |

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

### 36kr

36氪 JSON POST API，从 pageCallback base64 游标翻页，最多每页 30 条，按 itemId 去重。

17 个频道：`最新` `推荐` `创投` `财经` `汽车` `AI` `科技` `自助报道` `专精特新` `创新` `企服` `消费` `城市` `职场` `企业号` `红人` `其他`

- 频道 ID 从 36kr 网站导航页提取，请求体中 `subnavNick` 区分频道
- 文章 URL 由 `route` 字段提取 itemId 拼接（`https://36kr.com/p/<itemId>`）

### people-cn

人民网每日要闻回顾，HTML 直接解析。抓取 `review/YYYYMMDD.html` 页面中的「今日要闻」部分。

- 无分类
- 从当天开始逐日回溯，最多 7 天，直到凑够 limit 条
- 纯 regex 解析 `<li><a>标题</a> [时间戳]</li>` 结构，无第三方 DOM 依赖

### huxiu

虎嗅网 JSON POST API，`last_id` 游标翻页，按 `aid` 去重。

14 个频道：

`全部` `前沿科技` `车与出行` `商业消费` `社会文化` `金融财经` `出海` `国际热点` `游戏娱乐` `健康` `书影音` `医疗` `3C数码` `观点` `其他`

- 频道列表从 API 动态获取，运行时也可回退到硬编码常量
- `pagesize=20` 每页，游标翻页直到凑够 limit 或无更多数据
- 文章 URL 优先使用 API 返回的 `url` 字段，回退到 `https://www.huxiu.com/article/{aid}.html`

### yicai

第一财经首页 HTML 解析。新闻数据存放在 `<script>` 全局变量中，无需分页。

2 个分类：`头条` `最新`

- `headList` → 头条新闻，`latestList` → 最新新闻
- 正则提取 `varName = [{...}];` 后 JSON.parse
- 图片优先取 `originPic`，回退到 `NewsThumbs`
- 文章 URL 由相对路径拼接 `https://www.yicai.com`

### autohome

汽车之家 HTML 直接解析，无需 RSS/API。进入各分类页面逐页抓取文章列表，翻页至凑够 limit 或空页为止。

11 个分类：

`最新` `车闻` `导购` `试驾评测` `用车` `文化` `游记` `技术` `改装赛事` `新能源` `行业`

- 页面使用 GB2312 编码，fetcher 自动检测 `<meta charset>` 并用 `TextDecoder` 正确解码
- 焦点文章用 `<h2>` 标题，普通文章用 `<h3>`，快讯用 `<p>` 回退
- 时间提取优先相对时间（X分钟前/小时前/天前），焦点文章回退到 `data-operation-extend` 中的绝对时间 `dt` 字段
- 来源标签（`[汽车之家 XXX]`）自动从摘要中剥离

### bbc

BBC News JSON API 抓取，通过 Content Collection API 分页翻页。

7 个分类：`technology` `business` `business-more` `health` `culture` `arts` `travel`

- 每个分类对应不同的 `collectionId` 和 `path`，通过 URL 参数 `country=hk&page=N&size=N` 控制分页
- 默认无分类时使用 `technology`
- 关键词搜索时聚合所有分类拉取，再通过 `titleContains` 本地标题过滤
- 文章 URL 由 `path` 字段拼接 `https://www.bbc.com`
- `publishedAt` 使用 `firstPublishedAt` 字段，`category` 取 `topics[0]`
- 非 `article` 类型（video 等）自动过滤

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
│   ├── fetcher.ts                 # HTTP 抓取（超时/重试 + JSON POST / 二进制）
│   └── formatter.ts               # 终端表格 + JSON 输出
├── plugin/
│   ├── types.ts                   # Plugin, PluginRegistry, PluginMeta
│   ├── loader.ts                  # 动态加载（局部 → 全局，局部优先）
│   ├── installer.ts               # install（URL 下载 / npm 安装）
│   ├── manager.ts                 # list / uninstall / update
│   └── cli.ts                     # plugin 子命令注册
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
│   └── 36kr/
│       ├── index.ts               # 36氪（JSON POST API，17 个频道，翻页）
│       ├── parser.ts              # JSON → NewsArticle[]
│       └── constants.ts           # subnavNick 频道映射、API 配置
│   └── people-cn/
│       ├── index.ts               # 人民网（HTML 解析 + 日期回溯）
│       ├── parser.ts              # HTML regex → NewsArticle[]
│       └── constants.ts           # URL 模板、回溯天数
│   └── huxiu/
│       ├── index.ts               # 虎嗅网（JSON POST API，游标翻页）
│       ├── parser.ts              # JSON → NewsArticle[]
│       └── constants.ts           # 频道映射、API 配置
│   └── yicai/
│       ├── index.ts               # 第一财经（script JSON 解析）
│       ├── parser.ts              # 正则提取 + JSON → NewsArticle[]
│       └── constants.ts           # URL、分类变量映射
│   └── autohome/
│       ├── index.ts               # 汽车之家（HTML 解析 + 逐页分页，11 个分类）
│       ├── parser.ts              # HTML regex → NewsArticle[]
│       └── constants.ts           # 分类-路径映射、分页配置
│   └── bbc/
│       ├── index.ts               # BBC News（JSON API 翻页，7 个分类）
│       ├── parser.ts              # JSON → NewsArticle[]
│       └── constants.ts           # 分类-collectionId 映射、API 配置
└── utils/
    ├── index.ts                   # 公共工具：sleep() / titleContains()
    └── logger.ts                  # stderr 日志

test/                              # vitest 测试用例 (388 tests, 39 files)
scripts/build.js                   # esbuild 构建脚本
site/                              # 介绍站点 (Vite + React + TS + Tailwind, 16 tests)
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
