import { registerSource } from './core/registry.js';
import { createCLI } from './cli.js';
import { googleNewsSource } from './news-source/google-news/index.js';
import { baiduNewsSource } from './news-source/baidu-news/index.js';

// 注册所有新闻源
registerSource(googleNewsSource);
registerSource(baiduNewsSource);

// 启动 CLI
const program = createCLI();
program.parse();
