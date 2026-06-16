export const API_URL = 'https://i.news.qq.com/web_feed/getPCList';
export const DEFAULT_TIMEOUT = 10_000;
export const DEFAULT_LIMIT = 20;
export const MAX_ITEM_COUNT = 50;

export const HEADERS: Record<string, string> = {
	'content-type': 'application/json',
	origin: 'https://news.qq.com',
	referer: 'https://news.qq.com/',
};

/** 频道 ID → 显示名称 */
export const CHANNELS: Record<string, string> = {
	news_news_fx: '科技/AI',
	news_news_top: '要闻',
	news_news_finance: '财经',
	news_news_sports: '体育',
	news_news_ent: '娱乐',
};
