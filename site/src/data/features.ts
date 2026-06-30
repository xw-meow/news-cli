export interface FeatureData {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}

export const features: FeatureData[] = [
  {
    title: '17 个新闻源',
    titleEn: '17 Sources',
    description: '覆盖中英文主流媒体：微博、36氪、BBC、澎湃、虎嗅、IT之家、Hacker News 等，一个命令全部触达。',
    descriptionEn:
      'Covering Chinese and international mainstream media: Weibo, 36Kr, BBC, The Paper, Huxiu, IT之家, Hacker News, and more.',
  },
  {
    title: '分类 & 过滤',
    titleEn: 'Categories & Filters',
    description: '按分类浏览、关键词过滤（逗号分隔 = OR 逻辑），快速找到你关心的内容。',
    descriptionEn:
      'Browse by category and filter by keywords (comma-separated = OR logic) to find what matters.',
  },
  {
    title: '管道友好',
    titleEn: 'Pipe Friendly',
    description: '--json 输出到 stdout，错误到 stderr，和 jq、grep 等 Unix 工具无缝配合。',
    descriptionEn:
      '--json goes to stdout, errors to stderr, so it works seamlessly with jq, grep, and other Unix tools.',
  },
  {
    title: '插件扩展',
    titleEn: 'Plugin Extensible',
    description: '支持 npm 包和 URL 安装的插件系统，可自定义新闻源和 CLI 命令，本地/全局双作用域。',
    descriptionEn:
      'Install plugins via npm or URL to add custom sources and CLI commands, with local and global scopes.',
  },
  {
    title: '代理友好',
    titleEn: 'Proxy Friendly',
    description: '自动识别 http_proxy / https_proxy 环境变量，国内网络也能稳定访问 Hacker News 等海外源。',
    descriptionEn:
      'Auto-detects http_proxy / https_proxy environment variables for stable access to overseas sources like Hacker News.',
  },
];
