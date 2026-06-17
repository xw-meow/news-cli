# news-cli 介绍站点设计文档

## 概述

为 news-cli 构建一个多页面介绍站点，面向开发者展示工具功能、安装方式和命令参考。技术栈：Vite + React + TypeScript + Tailwind CSS。

## 目标

- 让开发者在 30 秒内了解 news-cli 是什么、能做什么
- 提供清晰的安装指引（一行 `npm install -g`）
- 完整的 CLI 命令参考
- 展示全部 16 个内置新闻源

## 技术选型

| 层面 | 选择 | 理由 |
|------|------|------|
| 构建 | Vite | 快速 HMR，React 开箱支持 |
| 框架 | React 18 | 用户指定 |
| 语言 | TypeScript | 类型安全 |
| 样式 | Tailwind CSS | 原子化，暗色主题方便 |
| 路由 | React Router v6 | 多页面路由 |
| 测试 | vitest | 与主项目一致 |

## 视觉设计

### 风格

Terminal 暗色风 — 深色背景 + 终端美学 + 等宽字体，贴合 CLI 工具定位。

### 配色

| 用途 | Tailwind | 色值 |
|------|----------|------|
| 主背景 | gray-950 | `#0a0a0a` |
| 卡片/区块 | gray-900 | `#111111` |
| 边框 | gray-800 | `#1f1f1f` |
| 主文字 | gray-200 | `#e5e5e5` |
| 高亮/强调 | green-400 | `#4ade80` |
| 次强调 | amber-400 | `#fbbf24` |
| 终端背景 | black | `#000000` |

### 字体

- 正文：**Inter**（sans-serif）
- 代码/命令：**JetBrains Mono**（等宽）

### 核心组件

**TerminalBlock** — 模拟终端窗口：
- 顶部红黄绿三圆点
- 纯黑底色
- 绿色 `$` prompt 符号
- JetBrains Mono 代码文本

**SourceCard** — 新闻源卡片：
- 半透明灰色背景（`#111`）
- 源名（绿色等宽）+ 抓取类型标签（RSS 绿色 / JSON 黄色 / HTML 绿色）
- 描述文字 + 分类标签列表

**Header** — 固定顶部导航：
- 半透明毛玻璃效果（`backdrop-filter: blur`）
- Logo：`~/news ▸`（绿色 monospace）
- 导航链接：首页 / 安装 / 命令 / 新闻源
- 移动端：汉堡菜单 → 全屏展开

## 页面结构

### 首页（`/`）

| 区块 | 内容 |
|------|------|
| Hero | Badge（16 个新闻源 · CLI 工具）+ 标题「命令行里的新闻聚合器」+ 描述 + 终端命令演示窗口 |
| 核心卖点 | 3-4 个 Feature 卡片（多源聚合 / 分类过滤 / JSON 输出 / 插件扩展） |

### 安装页（`/install`）

| 区块 | 内容 |
|------|------|
| 前置要求 | 黄色提示框：Node.js ≥ 18 |
| 安装命令 | TerminalBlock：`npm install -g news-cli` |
| 验证安装 | TerminalBlock：`news list` 输出示例 |
| 快速体验 | TerminalBlock：两条示例命令 |

### 命令页（`/commands`）

- **左侧边栏**：命令分组导航
  - 基础命令：`get`、`list`、`categories`
  - 插件命令：`plugin install`、`plugin list`、`plugin uninstall`、`plugin update`
- **右侧内容**：选中命令的详细说明
  - 用法（TerminalBlock）
  - 选项列表（参数名 + 说明）
  - 示例（TerminalBlock）

### 新闻源页（`/sources`）

- **顶部搜索框**：按名称/描述实时过滤
- **3 列卡片网格**（响应式缩减）：16 张 SourceCard

### 404 页

- 居中终端错误提示：`$ news get /this-page` → `Error: source not found`
- 返回首页链接

## 响应式

| 断点 | 布局 |
|------|------|
| ≥ 1024px | 命令页侧边栏 + 内容；源卡片 3 列 |
| 768-1023px | 命令页侧边栏收窄；源卡片 2 列 |
| < 768px | Header 汉堡菜单；侧边栏变下拉；源卡片 1 列 |

## 数据管理

内容数据与组件分离，存放在 `src/data/` 下：

- `sources.ts` — 16 个新闻源数组，每项：`{ name, description, type: 'RSS'|'JSON'|'HTML', categoryCount, categories: string[] }`
- `commands.ts` — CLI 命令数组，每项：`{ name, group, usage, description, options: { flag, description }[], examples: string[] }`
- `features.ts` — 核心卖点数组，每项：`{ title, description, icon? }`

页面组件直接 import 这些数据文件，纯渲染无状态管理。

## 项目结构

```
site/                              # news-cli 根目录下新建
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── main.tsx                   # ReactDOM.createRoot 入口
│   ├── App.tsx                    # Router 定义
│   ├── index.css                  # Tailwind 指令 + 全局样式
│   ├── data/
│   │   ├── sources.ts
│   │   ├── commands.ts
│   │   └── features.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       ├── TerminalBlock.tsx
│   │       └── SourceCard.tsx
│   └── pages/
│       ├── HomePage.tsx
│       ├── InstallPage.tsx
│       ├── CommandsPage.tsx
│       ├── SourcesPage.tsx
│       └── NotFoundPage.tsx
```

## 测试策略

- 使用 vitest（与主项目一致）
- 数据文件格式校验：确保每个源/命令字段完整
- 关键组件快照测试：TerminalBlock、SourceCard

## 非目标

- 不做 i18n（仅中文）
- 不做暗色/亮色切换（仅暗色）
- 不做 SEO/SSR
- 不做动画库（仅 CSS transition）
- 不做后端/API
