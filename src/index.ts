import { registerSource } from './core/registry.js';
import { createCLI } from './cli.js';
import { loadPlugins } from './plugin/loader.js';
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
import { kr36Source } from './news-source/36kr/index.js';
import { peopleCnSource } from './news-source/people-cn/index.js';
import { huxiuSource } from './news-source/huxiu/index.js';
import { yicaiSource } from './news-source/yicai/index.js';
import { autohomeSource } from './news-source/autohome/index.js';
import { bbcSource } from './news-source/bbc/index.js';

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
registerSource(kr36Source);
registerSource(peopleCnSource);
registerSource(huxiuSource);
registerSource(yicaiSource);
registerSource(autohomeSource);
registerSource(bbcSource);

// 加载动态插件 → 启动 CLI
const program = createCLI();
loadPlugins(program)
  .then(() => program.parse())
  .catch((err: unknown) => {
    process.stderr.write(`[ERROR] Plugin loader failed: ${err instanceof Error ? err.message : String(err)}\n`);
    program.parse(); // still parse even if loader fails
  });
