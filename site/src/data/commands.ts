export interface CommandOption {
  flag: string;
  description: string;
  descriptionEn: string;
}

export interface CommandData {
  name: string;
  group: string;
  usage: string;
  description: string;
  descriptionEn: string;
  options: CommandOption[];
  examples: string[];
}

export const commands: CommandData[] = [
  {
    name: 'get',
    group: '基础命令',
    usage: 'news get <source> [options]',
    description: '从指定新闻源获取最新新闻',
    descriptionEn: 'Fetch latest news from a specified source',
    options: [
      { flag: '-c, --category <cat>', description: '指定分类（用 news categories <source> 查看可选分类）', descriptionEn: 'Specify category (use news categories <source> to list)' },
      { flag: '-l, --limit <n>', description: '限制返回条数（默认 20）', descriptionEn: 'Limit number of results (default 20)' },
      { flag: '-k, --keyword <kw>', description: '关键词过滤，逗号分隔 = OR 逻辑，不区分大小写', descriptionEn: 'Keyword filter, comma-separated = OR logic, case-insensitive' },
      { flag: '--json', description: 'JSON 输出，管道友好，可与 jq 配合', descriptionEn: 'JSON output, pipe-friendly, works with jq' },
      { flag: 'http_proxy / https_proxy', description: '设置环境变量后自动走代理访问海外源', descriptionEn: 'Set env vars to route traffic through a proxy for overseas sources' },
    ],
    examples: [
      'news get weibo -l 10',
      'news get google-news -c technology -k "AI,LLM"',
      'news get hackernews -c ask -l 5',
      'news get hackernews -k "AI,open source" --json',
      'news get 36kr --json | jq \'.[].title\'',
    ],
  },
  {
    name: 'list',
    group: '基础命令',
    usage: 'news list [options]',
    description: '列出所有可用的新闻源',
    descriptionEn: 'List all available news sources',
    options: [
      { flag: '--json', description: 'JSON 格式输出 [{name, description}, ...]', descriptionEn: 'JSON output [{name, description}, ...]' },
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
    descriptionEn: 'Show categories for a news source',
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
    descriptionEn: 'Install a plugin from URL (.js/.zip) or npm package name',
    options: [
      { flag: '-g, --global', description: '安装到全局（~/.news-plugins/）', descriptionEn: 'Install globally (~/.news-plugins/)' },
      { flag: '--force', description: '覆盖已存在的同名插件', descriptionEn: 'Overwrite existing plugin with same name' },
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
    descriptionEn: 'List installed plugins',
    options: [
      { flag: '--json', description: 'JSON 格式输出', descriptionEn: 'JSON output' },
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
    descriptionEn: 'Uninstall a plugin',
    options: [
      { flag: '-g, --global', description: '从全局卸载', descriptionEn: 'Uninstall from global scope' },
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
    descriptionEn: 'Update a plugin to the latest version',
    options: [
      { flag: '-g, --global', description: '更新全局安装的插件', descriptionEn: 'Update globally installed plugin' },
    ],
    examples: [
      'news plugin update my-plugin',
      'news plugin update my-plugin -g',
    ],
  },
];
