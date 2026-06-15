/** 频道内容 API */
export const CHANNEL_CONTENT_URL = 'https://api.thepaper.cn/contentapi/nodeCont/getByChannelId';

/** 搜索 API */
export const SEARCH_API_URL = 'https://api.thepaper.cn/search/web/news';

/** Referer */
export const REFERER = 'https://www.thepaper.cn/';

/** 默认超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认条数 */
export const DEFAULT_LIMIT = 20;

/** 频道名 → channelId（要闻特殊：空字符串） */
export const CHANNELS: Record<string, string> = {
  要闻: '',
  深度: '143064',
  直播: '128409',
  视频: '26916',
  时事: '25950',
  国际: '122908',
  财经: '25951',
  视听: '154646',
  科技: '119908',
  暖闻: '136261',
  澎湃号: '36079',
  智库: '119489',
  思想: '25952',
  生活: '25953',
  上海: '-8',
  奔流: '143022',
  健康: '143065',
  体育: '-21',
  评论: '-24',
  ESG: '122153',
  文旅: '143013',
  短剧: '150010',
};

/** 搜索结果需排除：标题含这些关键词，或 nodeInfo.name 匹配 */
export const EXCLUDE_TITLE_KEYWORDS = ['澎湃早晚报', '早餐湃', '澎湃ai早新闻', '晚安湃'];
export const EXCLUDE_NODE_NAMES = new Set(['澎湃早晚报早餐湃']);
