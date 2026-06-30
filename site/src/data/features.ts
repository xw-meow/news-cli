export interface FeatureData {
  title: string;
  description: string;
}

export const features: FeatureData[] = [
  {
    title: '17 个新闻源',
    description: '覆盖中英文主流媒体：微博、36氪、BBC、澎湃、虎嗅、IT之家、Hacker News 等，一个命令全部触达。',
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
  {
    title: '代理友好',
    description: '自动识别 http_proxy / https_proxy 环境变量，国内网络也能稳定访问 Hacker News 等海外源。',
  },
];
