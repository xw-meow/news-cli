# news-cli 介绍站点实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `site/` 目录下构建一个多页面介绍站点，展示 news-cli 的功能、安装方式和命令参考。

**Architecture:** Vite + React 18 + TypeScript + Tailwind CSS v3 + React Router v6。内容数据（16 个新闻源、7 条命令、4 个卖点）抽到 `src/data/*.ts` 纯数据文件，组件纯渲染。Terminal 暗色风。

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v3, React Router v6, vitest

---

### Task 1: 初始化 Vite + React + TypeScript 项目

**Files:**
- Create: `site/package.json`
- Create: `site/index.html`
- Create: `site/vite.config.ts`
- Create: `site/tsconfig.json`
- Create: `site/tsconfig.node.json`
- Create: `site/tailwind.config.ts`
- Create: `site/postcss.config.js`
- Create: `site/src/main.tsx`
- Create: `site/src/App.tsx`
- Create: `site/src/index.css`
- Create: `site/src/vite-env.d.ts`

- [ ] **Step 1: 创建 site/package.json**

```json
{
  "name": "news-cli-site",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.6.3",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `cd site && npm install`
Expected: 无错误，`node_modules` 和 `package-lock.json` 生成

- [ ] **Step 3: 创建 site/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>news-cli — 命令行新闻聚合器</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-gray-950 text-gray-200 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 创建 site/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 5: 创建 site/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: 创建 site/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: 创建 site/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 8: 创建 site/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 9: 创建 site/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    scrollbar-width: thin;
    scrollbar-color: #1f1f1f transparent;
  }
}
```

- [ ] **Step 10: 创建 site/src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 11: 创建 site/src/main.tsx**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 12: 创建 site/src/App.tsx（占位）**

```typescript
import { Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-green-400 font-mono">news-cli</div>} />
    </Routes>
  );
}
```

- [ ] **Step 13: 验证 dev server 启动**

Run: `cd site && npm run dev`
Expected: Vite 启动成功，浏览器访问 localhost 看到 "news-cli" 绿色文字

- [ ] **Step 14: 添加 site/node_modules 到根 .gitignore，提交**

Run: `echo "site/node_modules" >> .gitignore`

```bash
git add site/ .gitignore
git commit -m "feat(site): init Vite + React + TS + Tailwind project"
```

---

### Task 2: 数据文件

**Files:**
- Create: `site/src/data/sources.ts`
- Create: `site/src/data/commands.ts`
- Create: `site/src/data/features.ts`

- [ ] **Step 1: 创建 site/src/data/sources.ts**

```typescript
export interface SourceData {
  name: string;
  description: string;
  type: 'RSS' | 'JSON' | 'HTML';
  categories: string[];
}

export const sources: SourceData[] = [
  {
    name: 'google-news',
    description: 'Google News 全球版（英文），8 个分类',
    type: 'RSS',
    categories: ['headlines', 'world', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'],
  },
  {
    name: 'google-news-cn',
    description: 'Google News 中国版（中文），8 个分类',
    type: 'RSS',
    categories: ['headlines', 'world', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'],
  },
  {
    name: 'weibo',
    description: '微博热搜榜，实时动态热门话题',
    type: 'JSON',
    categories: ['热搜', '民生新闻', '时事', '财经', '科技', '体育', '娱乐', '教育'],
  },
  {
    name: 'pengpai',
    description: '澎湃新闻，22 个频道 + 搜索，自动分页',
    type: 'JSON',
    categories: ['要闻', '深度', '时事', '国际', '财经', '科技', '生活', '体育', '评论'],
  },
  {
    name: 'chinanews',
    description: '中国新闻网 — RSS，24 个分类频道',
    type: 'RSS',
    categories: ['即时新闻', '时政新闻', '国际新闻', '社会新闻', '财经新闻', '文娱新闻', '体育新闻', '教育'],
  },
  {
    name: 'sspai',
    description: '少数派 — 派早报/派晚报精选，关键词过滤',
    type: 'JSON',
    categories: [],
  },
  {
    name: 'ithome',
    description: 'IT之家 — 前沿科技新闻，20 个分类',
    type: 'HTML',
    categories: ['业界', '手机', '电脑', 'AI', '苹果', '软件', '数码', '游戏'],
  },
  {
    name: 'cls',
    description: '财联社 — 专业财经资讯，热点和头条',
    type: 'JSON',
    categories: ['热点', '头条'],
  },
  {
    name: 'aibase',
    description: 'AIbase — AI 领域最新资讯，分页抓取',
    type: 'JSON',
    categories: [],
  },
  {
    name: 'tencent-news',
    description: '腾讯新闻 — POST API，5 个频道',
    type: 'JSON',
    categories: ['科技/AI', '要闻', '财经', '体育', '娱乐'],
  },
  {
    name: '36kr',
    description: '36氪 — 商业科技资讯，17 个频道支持翻页',
    type: 'JSON',
    categories: ['最新', '推荐', '创投', 'AI', '科技', '财经', '汽车', '消费'],
  },
  {
    name: 'people-cn',
    description: '人民网 — 每日要闻回顾，HTML 解析 + 日期回溯',
    type: 'HTML',
    categories: [],
  },
  {
    name: 'huxiu',
    description: '虎嗅网 — 商业科技资讯，14 个频道游标翻页',
    type: 'JSON',
    categories: ['全部', '前沿科技', '车与出行', '商业消费', '金融财经', '社会文化', '游戏娱乐'],
  },
  {
    name: 'yicai',
    description: '第一财经 — 首页 script JSON 解析，头条+最新',
    type: 'HTML',
    categories: ['头条', '最新'],
  },
  {
    name: 'autohome',
    description: '汽车之家 — HTML 解析 + 逐页分页，11 个分类',
    type: 'HTML',
    categories: ['最新', '车闻', '导购', '试驾评测', '用车', '新能源', '行业'],
  },
  {
    name: 'bbc',
    description: 'BBC News — Content Collection API 翻页，7 个分类',
    type: 'JSON',
    categories: ['technology', 'business', 'health', 'culture', 'arts', 'travel'],
  },
];
```

- [ ] **Step 2: 创建 site/src/data/commands.ts**

```typescript
export interface CommandOption {
  flag: string;
  description: string;
}

export interface CommandData {
  name: string;
  group: string;
  usage: string;
  description: string;
  options: CommandOption[];
  examples: string[];
}

export const commands: CommandData[] = [
  {
    name: 'get',
    group: '基础命令',
    usage: 'news get <source> [options]',
    description: '从指定新闻源获取最新新闻',
    options: [
      { flag: '-c, --category <cat>', description: '指定分类（用 news categories <source> 查看可选分类）' },
      { flag: '-l, --limit <n>', description: '限制返回条数（默认 20）' },
      { flag: '-k, --keyword <kw>', description: '关键词过滤，逗号分隔 = OR 逻辑，不区分大小写' },
      { flag: '--json', description: 'JSON 输出，管道友好，可与 jq 配合' },
    ],
    examples: [
      'news get weibo -l 10',
      'news get google-news -c technology -k "AI,LLM"',
      'news get 36kr --json | jq \'.[].title\'',
    ],
  },
  {
    name: 'list',
    group: '基础命令',
    usage: 'news list [options]',
    description: '列出所有可用的新闻源',
    options: [
      { flag: '--json', description: 'JSON 格式输出 [{name, description}, ...]' },
    ],
    examples: [
      'news list',
      'news list --json',
    ],
  },
  {
    name: 'categories',
    group: '基础命令',
    usage: 'news categories <source>',
    description: '查看某个新闻源的可选分类',
    options: [],
    examples: [
      'news categories google-news',
      'news categories pengpai',
    ],
  },
  {
    name: 'plugin install',
    group: '插件命令',
    usage: 'news plugin install <url|npm-package> [options]',
    description: '安装插件（支持 URL .js/.zip 或 npm 包名）',
    options: [
      { flag: '-g, --global', description: '安装到全局（~/.news-plugins/）' },
      { flag: '--force', description: '覆盖已存在的同名插件' },
    ],
    examples: [
      'news plugin install my-news-plugin',
      'news plugin install https://example.com/plugin.js',
      'news plugin install my-plugin -g',
    ],
  },
  {
    name: 'plugin list',
    group: '插件命令',
    usage: 'news plugin list [options]',
    description: '列出已安装的插件',
    options: [
      { flag: '--json', description: 'JSON 格式输出' },
    ],
    examples: [
      'news plugin list',
      'news plugin list --json',
    ],
  },
  {
    name: 'plugin uninstall',
    group: '插件命令',
    usage: 'news plugin uninstall <name> [options]',
    description: '卸载插件',
    options: [
      { flag: '-g, --global', description: '从全局卸载' },
    ],
    examples: [
      'news plugin uninstall my-plugin',
      'news plugin uninstall my-plugin -g',
    ],
  },
  {
    name: 'plugin update',
    group: '插件命令',
    usage: 'news plugin update <name> [options]',
    description: '更新插件到最新版本',
    options: [
      { flag: '-g, --global', description: '更新全局安装的插件' },
    ],
    examples: [
      'news plugin update my-plugin',
      'news plugin update my-plugin -g',
    ],
  },
];
```

- [ ] **Step 3: 创建 site/src/data/features.ts**

```typescript
export interface FeatureData {
  title: string;
  description: string;
}

export const features: FeatureData[] = [
  {
    title: '16 个新闻源',
    description: '覆盖中英文主流媒体：微博、36氪、BBC、澎湃、虎嗅、IT之家等，一个命令全部触达。',
  },
  {
    title: '分类 & 过滤',
    description: '按分类浏览、关键词过滤（逗号分隔 = OR 逻辑），快速找到你关心的内容。',
  },
  {
    title: '管道友好',
    description: '--json 输出到 stdout，错误到 stderr，和 jq、grep 等 Unix 工具无缝配合。',
  },
  {
    title: '插件扩展',
    description: '支持 npm 包和 URL 安装的插件系统，可自定义新闻源和 CLI 命令，本地/全局双作用域。',
  },
];
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd site && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add site/src/data/
git commit -m "feat(site): add source/command/feature data files"
```

---

### Task 3: TerminalBlock 组件

**Files:**
- Create: `site/src/components/ui/TerminalBlock.tsx`

- [ ] **Step 1: 创建 site/src/components/ui/TerminalBlock.tsx**

```typescript
interface TerminalBlockProps {
  lines: string[];
  /** 是否显示 prompt 符号 $，默认 true */
  showPrompt?: boolean;
  /** 是否显示红黄绿圆点，默认 true */
  showDots?: boolean;
}

export function TerminalBlock({ lines, showPrompt = true, showDots = true }: TerminalBlockProps) {
  return (
    <div className="bg-black border border-gray-800 rounded-lg p-5 font-mono text-sm leading-relaxed">
      {showDots && (
        <div className="flex gap-1.5 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
      )}
      {lines.map((line, i) => (
        <div key={i}>
          {showPrompt && line.startsWith('$ ') ? (
            <>
              <span className="text-green-400">$</span>
              <span className="text-gray-200">{line.slice(1)}</span>
            </>
          ) : line.startsWith('# ') ? (
            <span className="text-gray-500">{line}</span>
          ) : (
            <span className="text-gray-400">{line}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd site && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add site/src/components/ui/TerminalBlock.tsx
git commit -m "feat(site): add TerminalBlock component"
```

---

### Task 4: SourceCard 组件

**Files:**
- Create: `site/src/components/ui/SourceCard.tsx`

- [ ] **Step 1: 创建 site/src/components/ui/SourceCard.tsx**

```typescript
import type { SourceData } from '../../data/sources';

interface SourceCardProps {
  source: SourceData;
}

const typeStyles: Record<SourceData['type'], { bg: string; text: string }> = {
  RSS: { bg: 'bg-green-400/10', text: 'text-green-400' },
  JSON: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  HTML: { bg: 'bg-green-400/10', text: 'text-green-400' },
};

const maxVisibleCategories = 3;

export function SourceCard({ source }: SourceCardProps) {
  const visibleCategories = source.categories.slice(0, maxVisibleCategories);
  const remaining = source.categories.length - maxVisibleCategories;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-green-400/30 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-green-400 font-mono text-sm font-semibold">{source.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeStyles[source.type].bg} ${typeStyles[source.type].text}`}>
          {source.type}
        </span>
      </div>
      <p className="text-gray-400 text-xs mb-2.5 leading-relaxed">{source.description}</p>
      {visibleCategories.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {visibleCategories.map((cat) => (
            <span key={cat} className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
              {cat}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">+{remaining}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd site && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add site/src/components/ui/SourceCard.tsx
git commit -m "feat(site): add SourceCard component"
```

---

### Task 5: Header 组件

**Files:**
- Create: `site/src/components/layout/Header.tsx`

- [ ] **Step 1: 创建 site/src/components/layout/Header.tsx**

```typescript
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: '首页' },
  { to: '/install', label: '安装' },
  { to: '/commands', label: '命令' },
  { to: '/sources', label: '新闻源' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const linkClass = (to: string) =>
    `text-sm transition-colors ${
      pathname === to ? 'text-gray-200' : 'text-gray-500 hover:text-gray-300'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/85 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 font-mono text-lg font-bold text-green-400">
          ~/news <span className="text-green-400">▸</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass(l.to)}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-200 rounded transition-transform ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-200 rounded transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-200 rounded transition-transform ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-gray-950 border-t border-gray-800 px-6 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={linkClass(l.to)}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 2: 更新 site/src/App.tsx 引入 Header**

Read the file first, then replace:

```typescript
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';

export function App() {
  return (
    <>
      <Header />
      <main className="pt-14">
        <Routes>
          <Route path="/" element={<div className="p-8 text-green-400 font-mono">news-cli</div>} />
        </Routes>
      </main>
    </>
  );
}
```

- [ ] **Step 3: 验证 dev server**

Run: `cd site && npm run dev`
Expected: 浏览器看到固定 Header，点击导航链接切换

- [ ] **Step 4: 提交**

```bash
git add site/src/components/layout/Header.tsx site/src/App.tsx
git commit -m "feat(site): add Header with mobile hamburger menu"
```

---

### Task 6: Footer 组件

**Files:**
- Create: `site/src/components/layout/Footer.tsx`

- [ ] **Step 1: 创建 site/src/components/layout/Footer.tsx**

```typescript
export function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-gray-600">
        news-cli · 命令行新闻聚合器
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: 更新 site/src/App.tsx 引入 Footer**

```typescript
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-14 flex-1">
        <Routes>
          <Route path="/" element={<div className="p-8 text-green-400 font-mono">news-cli</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add site/src/components/layout/Footer.tsx site/src/App.tsx
git commit -m "feat(site): add Footer"
```

---

### Task 7: 首页 (HomePage)

**Files:**
- Create: `site/src/pages/HomePage.tsx`

- [ ] **Step 1: 创建 site/src/pages/HomePage.tsx**

```typescript
import { Link } from 'react-router-dom';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { features } from '../data/features';

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-block bg-green-400/10 border border-green-400/25 rounded-full px-3.5 py-1 text-xs text-green-400 mb-5">
          16 个新闻源 · CLI 工具
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-200 mb-4 leading-tight">
          命令行里的
          <br />
          新闻聚合器
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
          一条命令，聚合 16 个新闻源。支持分类浏览、关键词过滤、JSON 输出、插件扩展。
        </p>

        <TerminalBlock
          lines={[
            '$ news list',
            '  google-news  weibo  cls  ithome  bbc  …',
            '',
            '$ news get weibo -l 5',
            '  ┌──────┬──────────────────────┬─────────┐',
            '  │ #1   │ 微博实时热搜标题…    │ 12.5万  │',
            '  └──────┴──────────────────────┴─────────┘',
          ]}
        />

        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/install"
            className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            快速开始
          </Link>
          <Link
            to="/commands"
            className="inline-flex items-center gap-1.5 border border-gray-700 hover:border-gray-500 text-gray-300 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            命令参考
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 更新 site/src/App.tsx 路由**

```typescript
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-14 flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: 验证 dev server 效果**

Run: `cd site && npm run dev`
Expected: 首页 Hero + Feature 卡片完整展示

- [ ] **Step 4: 提交**

```bash
git add site/src/pages/HomePage.tsx site/src/App.tsx
git commit -m "feat(site): add HomePage with Hero and Feature cards"
```

---

### Task 8: 安装页 (InstallPage)

**Files:**
- Create: `site/src/pages/InstallPage.tsx`

- [ ] **Step 1: 创建 site/src/pages/InstallPage.tsx**

```typescript
import { TerminalBlock } from '../components/ui/TerminalBlock';

export function InstallPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-12 pb-16">
      <h1 className="text-2xl font-bold text-gray-200 mb-1">安装</h1>
      <p className="text-sm text-gray-500 mb-8">一行命令全局安装，即可使用</p>

      {/* Prerequisites */}
      <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 mb-8">
        <span className="text-amber-400 text-base flex-shrink-0 mt-0.5">⚠</span>
        <div>
          <div className="text-amber-400 text-xs font-semibold mb-1">前置要求</div>
          <div className="text-gray-400 text-xs">Node.js ≥ 18</div>
        </div>
      </div>

      {/* Install */}
      <h3 className="text-sm font-semibold text-gray-200 mb-3">安装命令</h3>
      <div className="mb-8">
        <TerminalBlock lines={['$ npm install -g news-cli']} />
      </div>

      {/* Verify */}
      <h3 className="text-sm font-semibold text-gray-200 mb-3">验证安装</h3>
      <div className="mb-8">
        <TerminalBlock
          lines={[
            '$ news list',
            '  google-news  weibo  cls  ithome  bbc  …  (16 个新闻源)',
          ]}
        />
      </div>

      {/* Quick start */}
      <div className="border-t border-gray-800 pt-8">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">快速体验</h3>
        <TerminalBlock
          lines={[
            '$ news get weibo -l 5',
            '# 获取微博热搜前 5 条',
            '',
            '$ news get 36kr -c AI --json | jq \'.[].title\'',
            '# JSON 输出 36氪 AI 频道标题',
          ]}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 注册路由**

```typescript
import { InstallPage } from './pages/InstallPage';
```

在 `<Routes>` 中添加：

```typescript
<Route path="/install" element={<InstallPage />} />
```

- [ ] **Step 3: 验证 dev server**

Run: `cd site && npm run dev`
Expected: 访问 /install 看到完整安装流程

- [ ] **Step 4: 提交**

```bash
git add site/src/pages/InstallPage.tsx site/src/App.tsx
git commit -m "feat(site): add InstallPage"
```

---

### Task 9: 命令页 (CommandsPage)

**Files:**
- Create: `site/src/pages/CommandsPage.tsx`

- [ ] **Step 1: 创建 site/src/pages/CommandsPage.tsx**

```typescript
import { useState } from 'react';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { commands, type CommandData } from '../data/commands';

function groupCommands(cmds: CommandData[]): Map<string, CommandData[]> {
  const map = new Map<string, CommandData[]>();
  for (const c of cmds) {
    const group = map.get(c.group) ?? [];
    group.push(c);
    map.set(c.group, group);
  }
  return map;
}

export function CommandsPage() {
  const grouped = groupCommands(commands);
  const groupNames = [...grouped.keys()];
  const firstCmd = groupNames[0] ? grouped.get(groupNames[0])?.[0] : null;
  const [selected, setSelected] = useState<CommandData | null>(firstCmd ?? null);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
      <h1 className="text-2xl font-bold text-gray-200 mb-1">命令参考</h1>
      <p className="text-sm text-gray-500 mb-8">news-cli 完整命令列表</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-48 flex-shrink-0">
          {groupNames.map((group) => (
            <div key={group} className="mb-4">
              <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2">{group}</div>
              <div className="flex flex-col gap-0.5">
                {(grouped.get(group) ?? []).map((cmd) => (
                  <button
                    key={cmd.name}
                    onClick={() => setSelected(cmd)}
                    className={`text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                      selected?.name === cmd.name
                        ? 'text-green-400 bg-green-400/8 font-medium'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {cmd.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {selected && (
            <>
              <h3 className="text-lg font-semibold text-gray-200 mb-0.5 font-mono">news {selected.name}</h3>
              <p className="text-xs text-gray-500 mb-5">{selected.description}</p>

              <div className="text-xs text-gray-400 mb-2">用法：</div>
              <div className="mb-5">
                <TerminalBlock lines={[`$ ${selected.usage}`]} />
              </div>

              {selected.options.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 mb-2">选项：</div>
                  <div className="flex flex-col gap-1.5 mb-5">
                    {selected.options.map((opt) => (
                      <div
                        key={opt.flag}
                        className="flex items-start gap-2.5 px-3 py-2 bg-gray-900 border border-gray-800 rounded-md"
                      >
                        <code className="text-amber-400 text-[11px] font-mono whitespace-nowrap flex-shrink-0">
                          {opt.flag}
                        </code>
                        <span className="text-gray-400 text-[11px]">{opt.description}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selected.examples.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 mb-2">示例：</div>
                  <TerminalBlock
                    lines={selected.examples.flatMap((ex, i) => {
                      const parts: string[] = [`$ ${ex}`];
                      if (i < selected.examples.length - 1) parts.push('');
                      return parts;
                    })}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 注册路由**

在 `App.tsx` 中：

```typescript
import { CommandsPage } from './pages/CommandsPage';
```

```typescript
<Route path="/commands" element={<CommandsPage />} />
```

- [ ] **Step 3: 验证 dev server**

Run: `cd site && npm run dev`
Expected: 访问 /commands，左侧命令列表 + 右侧详情，点击切换

- [ ] **Step 4: 提交**

```bash
git add site/src/pages/CommandsPage.tsx site/src/App.tsx
git commit -m "feat(site): add CommandsPage with sidebar navigation"
```

---

### Task 10: 新闻源页 (SourcesPage)

**Files:**
- Create: `site/src/pages/SourcesPage.tsx`

- [ ] **Step 1: 创建 site/src/pages/SourcesPage.tsx**

```typescript
import { useState, useMemo } from 'react';
import { SourceCard } from '../components/ui/SourceCard';
import { sources } from '../data/sources';

export function SourcesPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
      <h1 className="text-2xl font-bold text-gray-200 mb-1">新闻源</h1>
      <p className="text-sm text-gray-500 mb-6">16 个内置新闻源，覆盖中英文主流媒体</p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索新闻源…"
        className="w-full max-w-sm bg-black border border-gray-800 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 transition-colors mb-6"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <SourceCard key={s.name} source={s} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-12">没有匹配的新闻源</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 注册路由**

在 `App.tsx` 中：

```typescript
import { SourcesPage } from './pages/SourcesPage';
```

```typescript
<Route path="/sources" element={<SourcesPage />} />
```

- [ ] **Step 3: 验证 dev server**

Run: `cd site && npm run dev`
Expected: 访问 /sources，3 列卡片，搜索框实时过滤

- [ ] **Step 4: 提交**

```bash
git add site/src/pages/SourcesPage.tsx site/src/App.tsx
git commit -m "feat(site): add SourcesPage with search and card grid"
```

---

### Task 11: 404 页面 (NotFoundPage)

**Files:**
- Create: `site/src/pages/NotFoundPage.tsx`

- [ ] **Step 1: 创建 site/src/pages/NotFoundPage.tsx**

```typescript
import { Link, useLocation } from 'react-router-dom';
import { TerminalBlock } from '../components/ui/TerminalBlock';

export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <div className="max-w-lg mx-auto px-6 pt-20 pb-16 text-center">
      <TerminalBlock
        lines={[
          `$ news get ${pathname}`,
          `Error: source not found`,
        ]}
      />
      <Link
        to="/"
        className="inline-block mt-6 text-sm text-green-400 hover:text-green-300 transition-colors"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: 注册路由**

在 `App.tsx` 中：

```typescript
import { NotFoundPage } from './pages/NotFoundPage';
```

```typescript
<Route path="*" element={<NotFoundPage />} />
```

- [ ] **Step 3: 验证 404 页面**

Run: `cd site && npm run dev`
Expected: 访问任意不存在路径，看到终端错误提示 + 返回首页链接

- [ ] **Step 4: 提交**

```bash
git add site/src/pages/NotFoundPage.tsx site/src/App.tsx
git commit -m "feat(site): add NotFoundPage with terminal-style error"
```

---

### Task 12: 测试

**Files:**
- Create: `site/vitest.config.ts`
- Create: `site/src/components/ui/TerminalBlock.test.tsx`
- Create: `site/src/components/ui/SourceCard.test.tsx`
- Create: `site/src/data/sources.test.ts`
- Create: `site/src/data/commands.test.ts`

- [ ] **Step 1: 创建 site/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 2: 安装测试依赖（jsdom 已在 package.json）**

Run: `cd site && npm install`
Expected: 无错误

- [ ] **Step 3: 创建 site/src/data/sources.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { sources } from './sources';

describe('sources data', () => {
  it('has 16 sources', () => {
    expect(sources).toHaveLength(16);
  });

  it('every source has required fields', () => {
    for (const s of sources) {
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(['RSS', 'JSON', 'HTML']).toContain(s.type);
      expect(Array.isArray(s.categories)).toBe(true);
    }
  });

  it('every source name is unique', () => {
    const names = sources.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
```

- [ ] **Step 4: 运行数据测试**

Run: `cd site && npx vitest run src/data/sources.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: 创建 site/src/data/commands.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { commands } from './commands';

describe('commands data', () => {
  it('has 7 commands', () => {
    expect(commands).toHaveLength(7);
  });

  it('every command has required fields', () => {
    for (const c of commands) {
      expect(c.name).toBeTruthy();
      expect(c.group).toBeTruthy();
      expect(c.usage).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(Array.isArray(c.options)).toBe(true);
      expect(Array.isArray(c.examples)).toBe(true);
    }
  });

  it('every command name is unique', () => {
    const names = commands.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
```

- [ ] **Step 6: 运行全部数据测试**

Run: `cd site && npx vitest run`
Expected: 6 tests PASS (3 sources + 3 commands)

- [ ] **Step 7: 创建 site/src/components/ui/TerminalBlock.test.tsx**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TerminalBlock } from './TerminalBlock';

describe('TerminalBlock', () => {
  it('renders all lines', () => {
    render(<TerminalBlock lines={['$ hello', '# comment', '  output']} />);
    expect(screen.getByText('$')).toBeDefined();
    expect(screen.getByText(' hello')).toBeDefined();
    expect(screen.getByText('# comment')).toBeDefined();
    expect(screen.getByText('  output')).toBeDefined();
  });

  it('renders dots by default', () => {
    const { container } = render(<TerminalBlock lines={['$ test']} />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('hides dots when showDots is false', () => {
    const { container } = render(<TerminalBlock lines={['$ test']} showDots={false} />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(0);
  });

  it('hides prompt when showPrompt is false', () => {
    render(<TerminalBlock lines={['$ test', 'output']} showPrompt={false} />);
    expect(screen.queryByText('$')).toBeNull();
  });
});
```

- [ ] **Step 8: 创建 site/src/components/ui/SourceCard.test.tsx**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceCard } from './SourceCard';
import type { SourceData } from '../../data/sources';

const mockSource: SourceData = {
  name: 'test-source',
  description: 'A test source',
  type: 'JSON',
  categories: ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'],
};

describe('SourceCard', () => {
  it('renders source name and description', () => {
    render(<SourceCard source={mockSource} />);
    expect(screen.getByText('test-source')).toBeDefined();
    expect(screen.getByText('A test source')).toBeDefined();
  });

  it('renders type badge', () => {
    render(<SourceCard source={mockSource} />);
    expect(screen.getByText('JSON')).toBeDefined();
  });

  it('renders max 3 categories plus remainder', () => {
    render(<SourceCard source={mockSource} />);
    expect(screen.getByText('cat1')).toBeDefined();
    expect(screen.getByText('cat2')).toBeDefined();
    expect(screen.getByText('cat3')).toBeDefined();
    expect(screen.queryByText('cat4')).toBeNull();
    expect(screen.getByText('+2')).toBeDefined();
  });

  it('renders no category tags when categories is empty', () => {
    render(<SourceCard source={{ ...mockSource, categories: [] }} />);
    expect(screen.queryByText('cat1')).toBeNull();
  });
});
```

- [ ] **Step 9: 运行全部测试**

Run: `cd site && npx vitest run`
Expected: 10 tests PASS

- [ ] **Step 10: 提交**

```bash
git add site/vitest.config.ts site/src/
git commit -m "test(site): add tests for data files and UI components"
```

---

### Task 13: 最终验证 & 构建

- [ ] **Step 1: 运行全部测试**

Run: `cd site && npm test`
Expected: 10 tests PASS

- [ ] **Step 2: TypeScript 编译检查**

Run: `cd site && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 生产构建**

Run: `cd site && npm run build`
Expected: `site/dist/` 目录生成，无错误

- [ ] **Step 4: 预览构建产物**

Run: `cd site && npm run preview`
Expected: 访问预览 URL，所有页面正常工作

- [ ] **Step 5: 更新 root .gitignore（添加 site/dist）**

Read `.gitignore` then add `site/dist`（`site/node_modules` 已在 Task 1 添加）：

```
site/dist
```

- [ ] **Step 6: 提交**

```bash
git add .gitignore
git commit -m "chore(site): add site build artifacts to gitignore"
```
