/** 量子位资讯分类页基础 URL */
export const BASE_URL = 'https://www.qbitai.com/category';

/** 默认超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认返回条数 */
export const DEFAULT_LIMIT = 20;

/** 每页文章数（实测约 25 条） */
export const PAGE_SIZE = 25;

/** 最大翻页数 */
export const MAX_PAGES = 10;

/** 分页间隔 (ms) */
export const PAGINATION_DELAY_MS = 300;

/** 分类名 → URL 路径段 */
export const CATEGORIES: Record<string, string> = {
  '资讯': '%E8%B5%84%E8%AE%AF',
  '智能车': 'auto',
  '智库': 'zhiku',
  '活动': 'huodong',
};

/** 默认分类 */
export const DEFAULT_CATEGORY = '资讯';
