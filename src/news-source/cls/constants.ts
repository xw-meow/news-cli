/** API 配置常量（网站升级时可动态修改） */
export const APP = 'CailianpressWeb';
export const OS = 'web';
export const SV = '8.7.9';

/** 头条 depth ID */
export const DEPTH_ID = 1000;

/** API 基础地址 */
export const BASE_URL = 'https://www.cls.cn';

/** 热点列表 API（无分页，一次返回全部） */
export const HOT_LIST_URL = `${BASE_URL}/v2/article/hot/list`;

/** 头条 depth 列表 API（last_time 分页） */
export const DEPTH_LIST_URL = `${BASE_URL}/v3/depth/list`;

/** 默认超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认条数 */
export const DEFAULT_LIMIT = 20;

/** 请求头 */
export const HEADERS: Record<string, string> = {
	'accept': 'application/json, text/plain, */*',
	'accept-language': 'zh-CN,zh;q=0.9',
	'referer': 'https://www.cls.cn/depth?id=1000',
};

/** 分类映射 */
export const CATEGORIES: Record<string, string> = {
	'热点': 'hot',
	'头条': 'depth',
};

/** 分页间隔 (ms) */
export const PAGINATION_DELAY_MS = 500;
