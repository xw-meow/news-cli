export const API_URL = 'https://mcpapi.aibase.cn/api/aiInfo/aiNews';
export const DETAIL_URL_PREFIX = 'https://news.aibase.com/zh/news';
export const DEFAULT_TIMEOUT = 10_000;
export const DEFAULT_LIMIT = 20;
export const PAGE_SIZE = 20;
export const PAGINATION_DELAY_MS = 300;

export const HEADERS: Record<string, string> = {
	referer: 'https://news.aibase.com/',
};
