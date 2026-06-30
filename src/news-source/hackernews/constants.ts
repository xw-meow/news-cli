/** Hacker News RSS 镜像地址（hnrss.org 支持官方未提供的分类 RSS） */
export const RSS_BASE = 'https://hnrss.org';

/** 支持的分类及其 RSS 路径 */
export const CATEGORIES: Record<string, string> = {
  top: `${RSS_BASE}/frontpage`,
  new: `${RSS_BASE}/newest`,
  ask: `${RSS_BASE}/ask`,
  show: `${RSS_BASE}/show`,
  jobs: `${RSS_BASE}/jobs`,
};

/** 默认分类 */
export const DEFAULT_CATEGORY = 'new';

/** 默认请求超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认返回条数 */
export const DEFAULT_LIMIT = 20;
