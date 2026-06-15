/** 百度新闻基础 URL */
export const BASE_URL = 'https://news.baidu.com';

/** 支持的分类及其路径 */
export const CATEGORIES: Record<string, string> = {
  headlines: '/',
  guonei: '/guonei',
  guoji: '/guoji',
  mil: '/mil',
  finance: '/finance',
  ent: '/ent',
  sports: '/sports',
  tech: '/tech',
};

/** 搜索 URL 模板 */
export const SEARCH_URL = 'https://news.baidu.com/ns';

/** 默认请求超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认返回条数 */
export const DEFAULT_LIMIT = 20;
