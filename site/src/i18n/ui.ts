export type Lang = 'zh' | 'en';

export const ui = {
  zh: {
    // Header
    home: '首页',
    install: '安装',
    commands: '命令',
    sources: '新闻源',

    // Footer
    footerBuilt: '用 React + Vite + Tailwind 构建',

    // Home
    heroTag: '17 个新闻源 · CLI 工具 · 插件扩展',
    heroTitle1: '命令行里的',
    heroTitle2: '新闻聚合器',
    heroDesc:
      '一条命令聚合 17 个新闻源。支持分类浏览、关键词过滤、JSON 输出、插件扩展，以及自动代理识别。',
    ctaStart: '快速开始',
    ctaCommands: '命令参考',
    statSources: '新闻源',
    statCommands: '命令组',
    statExtensible: '可扩展',
    featuresTitle: '核心特性',
    featuresSubtitle: '为命令行爱好者打造的新闻阅读体验',
    sourcesTitle: '热门新闻源',
    sourcesSubtitle: '内置 17 个新闻源，覆盖科技与主流媒体',
    viewAll: '查看全部 →',

    // Install
    installTitle: '安装',
    installSubtitle: '一行命令全局安装，即可在终端使用',
    stepInstall: '安装',
    stepVerify: '验证',
    stepTry: '体验',
    installCmdDesc: '全局安装 news-cli 包',
    verifyCmdDesc: '查看 17 个内置新闻源',
    tryCmdDesc: '获取 Hacker News Ask 板块前 5 条',
    prereqTitle: '前置要求',
    prereqText: 'Node.js ≥ 18',
    proxyTitle: '代理支持',
    proxyDesc: '访问 Hacker News 等海外源时，设置环境变量即可自动走代理：',

    // Commands
    commandsTitle: '命令参考',
    commandsSubtitle: 'news-cli 完整命令列表与示例',
    usage: '用法',
    options: '选项',
    examples: '示例',
    copyCommand: '复制命令',

    // Sources
    sourcesPageTitle: '新闻源',
    sourcesPageSubtitle: '内置 {count} 个新闻源，覆盖中英文主流媒体与科技社区',
    all: '全部',
    searchPlaceholder: '搜索新闻源、分类…',
    emptyTitle: '没有匹配的新闻源',
    clearFilter: '清除筛选',

    // NotFound
    notFoundTitle: '404',
    notFoundSubtitle: '命令未找到',
    notFoundDesc: '你访问的页面不存在。请检查路径，或返回首页。',
    goHome: '返回首页',
  },
  en: {
    // Header
    home: 'Home',
    install: 'Install',
    commands: 'Commands',
    sources: 'Sources',

    // Footer
    footerBuilt: 'Built with React + Vite + Tailwind',

    // Home
    heroTag: '17 sources · CLI tool · Plugin extensible',
    heroTitle1: 'A news aggregator',
    heroTitle2: 'in your terminal',
    heroDesc:
      'Aggregate 17 news sources with one command. Categories, keyword filtering, JSON output, plugins, and automatic proxy detection.',
    ctaStart: 'Quick Start',
    ctaCommands: 'Commands',
    statSources: 'sources',
    statCommands: 'command groups',
    statExtensible: 'extensible',
    featuresTitle: 'Features',
    featuresSubtitle: 'Built for terminal enthusiasts',
    sourcesTitle: 'Popular Sources',
    sourcesSubtitle: '17 built-in sources covering tech and mainstream media',
    viewAll: 'View all →',

    // Install
    installTitle: 'Install',
    installSubtitle: 'Install globally with one command and use it in your terminal',
    stepInstall: 'Install',
    stepVerify: 'Verify',
    stepTry: 'Try',
    installCmdDesc: 'Install the news-cli package globally',
    verifyCmdDesc: 'View 17 built-in news sources',
    tryCmdDesc: 'Get top 5 Hacker News Ask posts',
    prereqTitle: 'Prerequisites',
    prereqText: 'Node.js ≥ 18',
    proxyTitle: 'Proxy Support',
    proxyDesc: 'When accessing overseas sources like Hacker News, set env vars to route traffic automatically:',

    // Commands
    commandsTitle: 'Command Reference',
    commandsSubtitle: 'Complete command list and examples for news-cli',
    usage: 'Usage',
    options: 'Options',
    examples: 'Examples',
    copyCommand: 'Copy',

    // Sources
    sourcesPageTitle: 'Sources',
    sourcesPageSubtitle: '{count} built-in sources covering Chinese and international media',
    all: 'All',
    searchPlaceholder: 'Search sources, categories…',
    emptyTitle: 'No matching sources',
    clearFilter: 'Clear filters',

    // NotFound
    notFoundTitle: '404',
    notFoundSubtitle: 'Command not found',
    notFoundDesc: 'The page you are looking for does not exist. Check the path or return home.',
    goHome: 'Go home',
  },
};

export type UI = typeof ui.en;
