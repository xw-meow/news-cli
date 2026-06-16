import { registerSource } from './core/registry.js';
import { createCLI } from './cli.js';
import { googleNewsSource } from './news-source/google-news/index.js';
import { googleNewsCNSource } from './news-source/google-news-cn/index.js';
import { weiboSource } from './news-source/weibo/index.js';
import { pengpaiSource } from './news-source/pengpai/index.js';
import { chinanewsSource } from './news-source/chinanews/index.js';
import { sspaiSource } from './news-source/sspai/index.js';
import { ithomeSource } from './news-source/ithome/index.js';
import { clsSource } from './news-source/cls/index.js';
import { aibaseSource } from './news-source/aibase/index.js';
import { tencentNewsSource } from './news-source/tencent-news/index.js';

// 注册所有新闻源
registerSource(googleNewsSource);
registerSource(googleNewsCNSource);
registerSource(weiboSource);
registerSource(pengpaiSource);
registerSource(chinanewsSource);
registerSource(sspaiSource);
registerSource(ithomeSource);
registerSource(clsSource);
registerSource(aibaseSource);
registerSource(tencentNewsSource);

// 启动 CLI
const program = createCLI();
program.parse();
