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
