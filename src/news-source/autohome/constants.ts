/** 默认超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认条数 */
export const DEFAULT_LIMIT = 20;

/** 最大翻页数 */
export const MAX_PAGES = 10;

/** 基础域名 */
export const BASE_URL = 'https://www.autohome.com.cn';

/** 分类名 → URL 路径 */
export const CATEGORIES: Record<string, string> = {
  '最新': '/all/',
  '车闻': '/news/',
  '导购': '/advice/',
  '试驾评测': '/drive/',
  '用车': '/use/',
  '文化': '/culture/',
  '游记': '/travels/',
  '技术': '/tech/',
  '改装赛事': '/tuning/',
  '新能源': '/ev/',
  '行业': '/hangye/list/',
};
