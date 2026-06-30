<div align="center">

<pre style="line-height: 1.2;">
   ____  ___ _      _______      _____/ (_)
  / __ \/ _ \ | /| / / ___/_____/ ___/ / /
 / / / /  __/ |/ |/ (__  )_____/ /__/ / /
/_/ /_/\___/|__/|__/____/      \___/_/_/
</pre>

<h1>news-cli</h1>

<p><strong>Read the news in your terminal.</strong></p>

<p>
  Aggregate 17 news sources with one command. Supports category browsing,<br/>
  keyword filtering, JSON output, and plugin extensions.<br/>
  Works with both Chinese and international sources, and auto-detects system proxies for overseas sources.
</p>

<p>
  <a href="https://xw-meow.github.io/news-cli/">🌐 Website</a> ·
  <a href="#i-user-guide">User Guide</a> ·
  <a href="#ii-developer-guide">Developer Guide</a>
</p>

<p>
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js >= 18">
  <img src="https://img.shields.io/badge/license-MIT-9cf?style=flat-square" alt="License MIT">
</p>

</div>

---

## I. User Guide

If you just want to use the CLI, read this section.

### 1.1 Installation

```bash
npm install -g news-cli
```

Or build from source:

```bash
git clone https://github.com/xw-meow/news-cli.git
cd news-cli
npm install
npm run build
npm link
```

Requires Node.js ≥ 18.

### 1.2 Quick Start

```bash
# List all available news sources
news list

# Get a few Hacker News stories
news get hackernews -l 5

# Browse a specific category
news get 36kr -c AI -l 10

# Filter by keywords (comma-separated = OR matching)
news get weibo -k "Dragon Boat,AI"

# JSON output for piping
news get hackernews --json | jq '.[].title'
```

### 1.3 Common Commands

```bash
news list                       # List all sources
news categories <source>       # Show categories for a source
news get <source>              # Fetch news, default 20 items, table output
news get <source> -c <cat>     # Specify category
news get <source> -l <n>       # Limit number of items
news get <source> -k "a,b"     # Keyword filtering
news get <source> --json       # JSON output
```

### 1.4 Using a Proxy

When accessing overseas sources like Hacker News or BBC, set environment variables:

```bash
export https_proxy=http://127.0.0.1:8118
export http_proxy=http://127.0.0.1:8118
news get hackernews -c top -l 5
```

### 1.5 Built-in News Sources

| Source | Description | Categories | Default |
|--------|-------------|------------|---------|
| `google-news` | Google News global (English) | 8 | `headlines` |
| `google-news-cn` | Google News China (Chinese) | 8 | `headlines` |
| `weibo` | Weibo hot search | dynamic | — |
| `pengpai` | The Paper (澎湃新闻) | 22 | `要闻` |
| `chinanews` | China News Service RSS | 24 | `即时新闻` |
| `sspai` | sspai editor picks | 0 | — |
| `ithome` | IT之家 tech news | 20 | `业界` |
| `cls` | CLS 财联社 finance | 2 | `热点` |
| `aibase` | AIbase AI news | 0 | — |
| `tencent-news` | Tencent News POST API | 5 | `科技/AI` |
| `36kr` | 36Kr business/tech | 17 | `最新` |
| `people-cn` | People's Daily highlights | 0 | — |
| `huxiu` | Huxiu business tech | 14 | `全部` |
| `yicai` | Yicai financial news | 2 | `最新` |
| `autohome` | Autohome auto news | 11 | `最新` |
| `bbc` | BBC News | 7 | `technology` |
| `hackernews` | Hacker News (via hnrss.org) | 5 | `new` |

<details>
<summary>View full category list</summary>

**google-news / google-news-cn**

`headlines` `world` `business` `technology` `entertainment` `sports` `science` `health`

**weibo**

Hot search, civic news, current affairs, finance, tech, sports, entertainment, education, etc. (dynamic).

**pengpai**

`要闻` `深度` `直播` `视频` `时事` `国际` `财经` `视听` `科技` `暖闻` `澎湃号` `智库` `思想` `生活` `上海` `奔流` `健康` `体育` `评论` `ESG` `文旅` `短剧`

**chinanews**

`即时新闻` `要闻导读` `时政新闻` `东西问` `国际新闻` `社会新闻` `财经新闻` `生活` `健康` `大湾区` `华人` `文娱新闻` `体育新闻` `视频` `图片` `创意` `直播` `教育` `法治` `同心` `铸牢中华民族共同体意识` `一带一路` `理论` `中国—东盟商贸资讯平台`

**ithome**

`业界` `手机` `电脑` `测评` `视频` `AI` `苹果` `iPhone` `鸿蒙` `软件` `智车` `数码` `学院` `游戏` `直播` `5G` `微软` `Win10` `Win11` `专题`

**tencent-news**

`科技/AI` `要闻` `财经` `体育` `娱乐`

**36kr**

`最新` `推荐` `创投` `财经` `汽车` `AI` `科技` `自助报道` `专精特新` `创新` `企服` `消费` `城市` `职场` `企业号` `红人` `其他`

**huxiu**

`全部` `前沿科技` `车与出行` `商业消费` `社会文化` `金融财经` `出海` `国际热点` `游戏娱乐` `健康` `书影音` `医疗` `3C数码` `观点` `其他`

**autohome**

`最新` `车闻` `导购` `试驾评测` `用车` `文化` `游记` `技术` `改装赛事` `新能源` `行业`

**bbc**

`technology` `business` `business-more` `health` `culture` `arts` `travel`

**hackernews**

`top` `new` `ask` `show` `jobs`

</details>

---

## II. Developer Guide

If you want to modify code, add a news source, or write plugins, read this section.

### 2.1 Local Development

```bash
npm run dev          # tsx hot run
npm run build        # esbuild bundle → dist/index.js
npm test             # vitest (398 tests, 40 files)
npm run test:watch   # vitest watch mode
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # tsc type check
```

### 2.2 Project Structure

```
src/
├── index.ts              # Entry: register sources → start CLI
├── cli.ts                # commander commands (get/list/categories)
├── core/
│   ├── types.ts          # NewsArticle, NewsSource, NewsCliError
│   ├── registry.ts       # source registry
│   ├── fetcher.ts        # HTTP fetch (timeout/retry/proxy/POST)
│   └── formatter.ts      # terminal table + JSON output
├── plugin/               # plugin system: load, install, manage
├── news-source/          # 17 source implementations
│   ├── google-news/
│   ├── weibo/
│   ├── 36kr/
│   ├── hackernews/
│   └── ...
└── utils/                # shared utilities and logging

test/                     # vitest test cases
scripts/build.js          # esbuild build script
site/                     # project website (Vite + React + Tailwind)
```

### 2.3 Adding a New Source

1. Create a new folder under `src/news-source/`
2. Create `index.ts` implementing the `NewsSource` interface
3. Register it in `src/index.ts`
4. Add tests under `test/news-source/<name>/`
5. Rebuild with `npm run build`

```ts
import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';

export const mySource: NewsSource = {
  name: 'my-source',
  description: 'My News Source',

  async listCategories() {
    return ['top', 'latest'];
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    // fetch and return NewsArticle[]
  },
};
```

### 2.4 Plugin System

Plugins are loaded dynamically at startup and can register new sources or CLI commands.

**Plugin locations**

- `<cwd>/.news-plugins/<name>/` — local
- `~/.news-plugins/<name>/` — global

Local plugins take precedence over global ones.

**Management commands**

```bash
news plugin install <url>              # install from URL (.js or .zip)
news plugin install <npm-package>      # install from npm
news plugin install <target> -g        # install globally
news plugin install <target> --force   # force overwrite
news plugin list                       # list installed plugins
news plugin uninstall <name>           # uninstall
news plugin update <name>              # update
```

**Minimal plugin example**

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
      async fetch(options) { return []; },
    });

    program.command('hello').action(() => console.log('Hello from plugin!'));
  },
};
```

### 2.5 Project Website

The `site/` directory contains the project website source, built with React + Vite + TypeScript + Tailwind CSS:

```bash
cd site
npm install
npm run dev
npm test
```

---

## III. License

[MIT](LICENSE) © xw-meow
