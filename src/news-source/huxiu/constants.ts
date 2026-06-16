/** 虎嗅网 API 基础配置 */

export const CHANNEL_LIST_URL = 'https://api-ms-article.huxiu.com/v1/channel/channelList';

export const ARTICLE_LIST_URL = 'https://api-ms-article.huxiu.com/v1/channel/pcArticleList';

export const DEFAULT_TIMEOUT = 10_000;

export const DEFAULT_LIMIT = 20;

/** 分页大小 */
export const PAGE_SIZE = 20;

/** 分页间隔 (ms) */
export const PAGINATION_DELAY_MS = 300;

/** 全部频道的 channel_id */
export const ALL_CHANNEL_ID = 0;

/** 频道列表（channel_id → 中文名），channel_id=0 为「全部」 */
export const CHANNELS: Record<number, string> = {
  0: '全部',
  105: '前沿科技',
  21: '车与出行',
  103: '商业消费',
  106: '社会文化',
  115: '金融财经',
  114: '出海',
  107: '国际热点',
  22: '游戏娱乐',
  118: '健康',
  119: '书影音',
  120: '医疗',
  121: '3C数码',
  122: '观点',
  123: '其他',
};
