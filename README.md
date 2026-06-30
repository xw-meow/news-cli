<div align="center">

<pre style="line-height: 1.2;">
   ____  ___ _      _______      _____/ (_)
  / __ \/ _ \ | /| / / ___/_____/ ___/ / /
 / / / /  __/ |/ |/ (__  )_____/ /__/ / /
/_/ /_/\___/|__/|__/____/      \___/_/_/
</pre>

<h1>news-cli</h1>

<p><strong>在终端里读新闻。</strong></p>

<p>
  一条命令聚合 17 个新闻源，支持分类浏览、关键词过滤、JSON 输出和插件扩展。<br/>
  国内源与海外源都能用，海外源会自动识别系统代理。
</p>

<p>
  <a href="https://xw-meow.github.io/news-cli/">🌐 项目官网</a> ·
  <a href="#一-用户指南">用户指南</a> ·
  <a href="#二-开发者指南">开发者指南</a> ·
  <a href="./README.en.md">English</a>
</p>

<p>
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js >= 18">
  <img src="https://img.shields.io/badge/license-MIT-9cf?style=flat-square" alt="License MIT">
</p>

</div>

---

## 一、用户指南

如果你是来用工具的，看这里。

### 1.1 安装

```bash
npm install -g xw-news-cli
```

或者用源码自己构建：

```bash
git clone https://github.com/xw-meow/news-cli.git
cd news-cli
npm install
npm run build
npm link
```

需要 Node.js ≥ 18。

### 1.2 快速上手

```bash
# 看看有哪些新闻源
news list

# 随便抓几条 Hacker News
news get hackernews -l 5

# 看指定分类
news get 36kr -c AI -l 10

# 关键词过滤（逗号分隔 = 任意匹配）
news get weibo -k "端午,AI"

# JSON 输出，方便管道处理
news get hackernews --json | jq '.[].title'
```

### 1.3 常用命令

```bash
news list                       # 列出所有新闻源
news categories <source>       # 查看某个源支持的分类
news get <source>              # 获取新闻，默认 20 条，表格输出
news get <source> -c <cat>     # 指定分类
news get <source> -l <n>       # 限制条数
news get <source> -k "a,b"     # 关键词过滤
news get <source> --json       # JSON 输出
```

### 1.4 使用代理

访问 Hacker News、BBC 等海外源时，设置环境变量即可：

```bash
export https_proxy=http://127.0.0.1:8118
export http_proxy=http://127.0.0.1:8118
news get hackernews -c top -l 5
```

### 1.5 内置新闻源

| 源名 | 说明 | 分类数 | 默认分类 |
|------|------|--------|----------|
| `google-news` | Google News 全球版（英文） | 8 | `headlines` |
| `google-news-cn` | Google News 中国版（中文） | 8 | `headlines` |
| `weibo` | 微博热搜榜 | 动态 | — |
| `pengpai` | 澎湃新闻 | 22 | `要闻` |
| `chinanews` | 中国新闻网 | 24 | `即时新闻` |
| `sspai` | 少数派精选 | 0 | — |
| `ithome` | IT之家 | 20 | `业界` |
| `cls` | 财联社 | 2 | `热点` |
| `aibase` | AIbase | 0 | — |
| `tencent-news` | 腾讯新闻 | 5 | `科技/AI` |
| `36kr` | 36氪 | 17 | `最新` |
| `people-cn` | 人民网 | 0 | — |
| `huxiu` | 虎嗅网 | 14 | `全部` |
| `yicai` | 第一财经 | 2 | `最新` |
| `autohome` | 汽车之家 | 11 | `最新` |
| `bbc` | BBC News | 7 | `technology` |
| `hackernews` | Hacker News | 5 | `new` |

<details>
<summary>查看各源完整分类</summary>

**google-news / google-news-cn**

`headlines` `world` `business` `technology` `entertainment` `sports` `science` `health`

**weibo**

热搜、民生新闻、时事、财经、科技、体育、娱乐、教育等（动态获取）。

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

## 二、开发者指南

如果你想改代码、加新闻源或写插件，看这里。

### 2.1 本地开发

```bash
npm run dev          # tsx 热运行
npm run build        # esbuild 打包 → dist/index.js
npm test             # vitest 跑测试（398 tests, 40 files）
npm run test:watch   # vitest 监听模式
npm run lint         # ESLint 检查
npm run lint:fix     # ESLint 自动修复
npm run typecheck    # tsc 类型检查
```

### 2.2 项目结构

```
src/
├── index.ts              # 入口：注册 source → 启动 CLI
├── cli.ts                # commander 命令（get/list/categories）
├── core/
│   ├── types.ts          # NewsArticle, NewsSource, NewsCliError
│   ├── registry.ts       # source 注册表
│   ├── fetcher.ts        # HTTP 抓取（超时/重试/代理/POST）
│   └── formatter.ts      # 终端表格 + JSON 输出
├── plugin/               # 插件系统：加载、安装、管理
├── news-source/          # 17 个新闻源实现
│   ├── google-news/
│   ├── weibo/
│   ├── 36kr/
│   ├── hackernews/
│   └── ...
└── utils/                # 公共工具与日志

test/                     # vitest 测试用例
scripts/build.js          # esbuild 构建脚本
site/                     # 项目官网（Vite + React + Tailwind）
```

### 2.3 如何新增一个新闻源

1. 在 `src/news-source/` 下新建文件夹
2. 创建 `index.ts`，实现 `NewsSource` 接口
3. 在 `src/index.ts` 中注册
4. 在 `test/news-source/<name>/` 添加测试
5. 运行 `npm run build` 重新构建

```ts
import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';

export const mySource: NewsSource = {
  name: 'my-source',
  description: 'My News Source',

  async listCategories() {
    return ['top', 'latest'];
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    // 抓取并返回 NewsArticle[]
  },
};
```

### 2.4 插件机制

插件在启动时被动态加载，可以注册新的新闻源或 CLI 命令。

**加载位置**

- `<cwd>/.news-plugins/<name>/` — 局部
- `~/.news-plugins/<name>/` — 全局

局部插件优先。

**管理命令**

```bash
news plugin install <url>              # 从 URL 安装（.js 或 .zip）
news plugin install <npm-package>      # 从 npm 安装
news plugin install <target> -g        # 全局安装
news plugin install <target> --force   # 强制覆盖
news plugin list                       # 列出已安装插件
news plugin uninstall <name>           # 卸载
news plugin update <name>              # 更新
```

**最小插件示例**

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

### 2.5 项目官网

`site/` 是项目官网源码，用 React + Vite + TypeScript + Tailwind CSS 写成：

```bash
cd site
npm install
npm run dev
npm test
```

---

## 三、许可

[MIT](LICENSE) © xw-meow
