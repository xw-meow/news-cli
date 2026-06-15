import { registerSource } from './core/registry.js';
import { createCLI } from './cli.js';
import { googleNewsSource } from './news-source/google-news/index.js';
import { googleNewsCNSource } from './news-source/google-news-cn/index.js';
import { weiboSource } from './news-source/weibo/index.js';

// 注册所有新闻源
registerSource(googleNewsSource);
registerSource(googleNewsCNSource);
registerSource(weiboSource);

// 启动 CLI
const program = createCLI();
program.parse();
