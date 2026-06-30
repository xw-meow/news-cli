<div align="center">

<pre style="line-height: 1.2;">
┌┐┌┌─┐┌─┐┌─┐┌┬┐  ┌─┐┬  ┬
│││├┤ │ │└─┐ │   │  │  │
┘└┘└─┘└─┘└─┘ ┴   └─┘┴─┘┴
</pre>

<h1>news-cli</h1>

<p>
  <strong>命令行里的新闻聚合器</strong><br/>
  一条命令，聚合 17 个新闻源。RSS、JSON API、HTML 解析全覆盖。
</p>

<p>
  <a href="https://github.com/xw-meow/news-cli/actions"><img src="https://img.shields.io/github/actions/workflow/status/xw-meow/news-cli/site.yml?branch=main&style=flat-square&label=site" alt="Site Workflow"></a>
  <a href="https://xw-meow.github.io/news-cli/"><img src="https://img.shields.io/badge/在线站点-00C853?style=flat-square&logo=githubpages&logoColor=white" alt="Online Site"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js >= 18">
  <img src="https://img.shields.io/badge/license-MIT-9cf?style=flat-square" alt="License MIT">
</p>

<p>
  <a href="#-安装">安装</a> •
  <a href="#-使用">使用</a> •
  <a href="#-新闻源">新闻源</a> •
  <a href="#-插件">插件</a> •
  <a href="#-开发">开发</a>
</p>

</div>

---

## ✨ 特性

- **🗞️ 17 个内置新闻源** — 国内/国际/科技/财经，开箱即用
- **🧩 插件扩展** — 本地或 npm 安装插件，动态注册新源与新命令
- **🔎 分类 + 关键词过滤** — 按频道浏览，逗号分隔关键词做 OR 匹配
- **📊 表格 / JSON 双输出** — 终端表格友好，JSON 管道友好
- **🌐 自动代理** — 识别 `http_proxy` / `https_proxy`，海外源也能用
- **⚡ 统一抓取层** — 超时、重试、User-Agent、POST/GET 一站处理
- **🧪 398 个测试** — vitest 覆盖核心逻辑与全部新闻源

---

## 🚀 安装

```bash
# 全局安装
npm install -g news-cli

# 或者从源码构建
npm install
npm run build
npm link
```

> 需要 **Node.js ≥ 18**。

---

## 🎯 使用

```bash
# 列出全部新闻源
news list

# 查看某个源的分类
news categories hackernews

# 获取新闻（默认 20 条，表格输出）
news get hackernews

# 指定分类 + 条数
news get hackernews -c ask -l 5

# 关键词过滤（逗号分隔 = OR，不区分大小写）
news get 36kr -k "AI,融资"

# JSON 输出，配合 jq 使用
news get weibo -l 5 --json | jq '.[].title'
```

### 代理

访问 Hacker News、BBC 等海外源时，设置环境变量即可自动走代理：

```bash
export https_proxy=http://127.0.0.1:8118
export http_proxy=http://127.0.0.1:8118
news get hackernews -c top -l 5
```

---

## 📰 新闻源

> 共 **17** 个内置源，**398 tests / 40 files** 覆盖。

| 源名 | 说明 | 分类数 | 默认分类 |
|------|------|--------|----------|
| `google-news` | Google News 全球版（英文） | 8 | `headlines` |
| `google-news-cn` | Google News 中国版（中文） | 8 | `headlines` |
| `weibo` | 微博热搜榜 | 动态 | — |
| `pengpai` | 澎湃新闻 — 频道 + 搜索，自动分页 | 22 | `要闻` |
| `chinanews` | 中国新闻网 — RSS，24 个分类频道 | 24 | `即时新闻` |
| `sspai` | 少数派 — 派早报/派晚报精选 | 0 | — |
| `ithome` | IT之家 — 前沿科技新闻 | 20 | `业界` |
| `cls` | 财联社 — 专业财经资讯 | 2 | `热点` |
| `aibase` | AIbase — AI 领域最新资讯 | 0 | — |
| `tencent-news` | 腾讯新闻 — POST API，5 个频道 | 5 | `科技/AI` |
| `36kr` | 36氪 — POST API 翻页，17 个频道 | 17 | `最新` |
| `people-cn` | 人民网 — 每日要闻回顾 | 0 | — |
| `huxiu` | 虎嗅网 — 商业科技资讯 | 14 | `全部` |
| `yicai` | 第一财经 — 首页 script JSON 解析 | 2 | `最新` |
| `autohome` | 汽车之家 — HTML 解析 + 逐页分页 | 11 | `最新` |
| `bbc` | BBC News — Content Collection API | 7 | `technology` |
| `hackernews` | Hacker News — hnrss.org 镜像 | 5 | `new` |

<details>
<summary>展开查看各源分类详情</summary>

### google-news / google-news-cn

`headlines` `world` `business` `technology` `entertainment` `sports` `science` `health`

### weibo

微博实时热搜，分类动态获取：热搜、民生新闻、时事、财经、科技、体育、娱乐、教育等。

### pengpai

`要闻` `深度` `直播` `视频` `时事` `国际` `财经` `视听` `科技` `暖闻` `澎湃号` `智库` `思想` `生活` `上海` `奔流` `健康` `体育` `评论` `ESG` `文旅` `短剧`

### chinanews

`即时新闻` `要闻导读` `时政新闻` `东西问` `国际新闻` `社会新闻` `财经新闻` `生活` `健康` `大湾区` `华人` `文娱新闻` `体育新闻` `视频` `图片` `创意` `直播` `教育` `法治` `同心` `铸牢中华民族共同体意识` `一带一路` `理论` `中国—东盟商贸资讯平台`

### ithome

`业界` `手机` `电脑` `测评` `视频` `AI` `苹果` `iPhone` `鸿蒙` `软件` `智车` `数码` `学院` `游戏` `直播` `5G` `微软` `Win10` `Win11` `专题`

### tencent-news

`科技/AI` `要闻` `财经` `体育` `娱乐`

### 36kr

`最新` `推荐` `创投` `财经` `汽车` `AI` `科技` `自助报道` `专精特新` `创新` `企服` `消费` `城市` `职场` `企业号` `红人` `其他`

### huxiu

`全部` `前沿科技` `车与出行` `商业消费` `社会文化` `金融财经` `出海` `国际热点` `游戏娱乐` `健康` `书影音` `医疗` `3C数码` `观点` `其他`

### autohome

`最新` `车闻` `导购` `试驾评测` `用车` `文化` `游记` `技术` `改装赛事` `新能源` `行业`

### bbc

`technology` `business` `business-more` `health` `culture` `arts` `travel`

### hackernews

`top` `new` `ask` `show` `jobs`

- `top` → `https://hnrss.org/frontpage`
- `new` → `https://hnrss.org/newest`
- `ask` → `https://hnrss.org/ask`
- `show` → `https://hnrss.org/show`
- `jobs` → `https://hnrss.org/jobs`

</details>

---

## 🔌 插件

Plugins extend `news-cli` with new sources and commands, loaded dynamically at startup.

### 插件位置

- `<cwd>/.news-plugins/<name>/` — 局部（项目级）
- `~/.news-plugins/<name>/` — 全局

局部插件优先于同名全局插件。

### 命令

```bash
news plugin install <url>              # 从 URL 安装（.js 或 .zip）
news plugin install <npm-package>      # 从 npm 安装
news plugin install <target> -g        # 全局安装
news plugin install <target> --force   # 强制覆盖

news plugin list                       # 列出已安装插件
news plugin list --json

news plugin uninstall <name>           # 卸载
news plugin uninstall <name> -g

news plugin update <name>              # 更新插件
news plugin update <name> -g
```

### 写一个插件

插件是一个目录，包含 `package.json` 和一个导出 `plugin` 对象的入口文件：

```js
// index.js
export const plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  register(program, registry) {
    registry.registerSource({
      name: 'my-source',
      description: 'My custom news source',
      async listCategories() { return ['tech', 'sports']; },
      async fetch(options) { return [/* NewsArticle[] */]; },
    });

    program.command('hello').action(() => console.log('Hello from plugin!'));
  },
};
```

---

## 🏗️ 扩展新新闻源

1. 在 `src/news-source/` 下新建文件夹
2. 创建 `index.ts`，实现 `NewsSource` 接口
3. 在 `src/index.ts` 注册
4. 重新构建：`npm run build`

```ts
import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';

export const mySource: NewsSource = {
  name: 'my-source',
  description: 'My News Source',

  async listCategories() {
    return ['top', 'latest'];
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    // 实现抓取逻辑
  },
};
```

---

## 🛠️ 开发

```bash
npm run dev          # tsx 热运行
npm run build        # esbuild 打包 → dist/index.js
npm test             # vitest 跑测试（398 tests, 40 files）
npm run test:watch   # vitest 监听模式
npm run lint         # ESLint 检查
npm run lint:fix     # ESLint 自动修复
npm run typecheck    # tsc 类型检查
```

---

## 🌐 在线站点

项目包含一个介绍站点，使用 **React + Vite + TypeScript + Tailwind CSS** 构建：

```bash
cd site
npm install
npm run dev
npm test             # 16 tests
```

站点自动部署到 GitHub Pages：
👉 [https://xw-meow.github.io/news-cli/](https://xw-meow.github.io/news-cli/)

---

## 📁 项目结构

```
src/
├── index.ts              # 入口：注册所有 source → 启动 CLI
├── cli.ts                # commander 命令（get/list/categories）
├── core/
│   ├── types.ts          # NewsArticle, NewsSource, NewsCliError
│   ├── registry.ts       # source 注册表
│   ├── fetcher.ts        # HTTP 抓取（超时/重试 + JSON POST / 二进制）
│   └── formatter.ts      # 终端表格 + JSON 输出
├── plugin/               # 插件系统：加载、安装、管理
├── news-source/          # 17 个新闻源实现
│   ├── google-news/
│   ├── weibo/
│   ├── 36kr/
│   ├── hackernews/
│   └── ...
└── utils/                # 公共工具与日志

test/                     # vitest 测试用例 (398 tests, 40 files)
scripts/build.js          # esbuild 构建脚本
site/                     # 介绍站点 (Vite + React + TS + Tailwind)
```

---

## 📜 许可

[MIT](LICENSE) © xw-meow

---

<div align="center">

Made with 💻 in the terminal.

</div>
