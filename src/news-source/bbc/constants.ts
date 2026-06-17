/** BBC Content Collection API base URL */
export const API_BASE_URL = 'https://web-cdn.api.bbci.co.uk/xd/content-collection';

/** BBC 网站 base URL */
export const BASE_URL = 'https://www.bbc.com';

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 20;

/** 默认超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认条数 */
export const DEFAULT_LIMIT = 20;

/** 分页间隔 (ms) */
export const PAGINATION_DELAY_MS = 300;

/** 默认 country 参数 */
export const COUNTRY = 'hk';

/** 请求头 */
export const HEADERS: Record<string, string> = {
	origin: BASE_URL,
	referer: BASE_URL + '/',
	accept: '*/*',
};

/**
 * 种类定义: category name → { path, collectionId }
 * 一个 path 可以有多个 collection（如 Business 页面的不同 More 区域）
 */
export const CATEGORIES: Record<string, { path: string; collectionId: string; label: string }> = {
	technology: {
		path: '/news/technology',
		collectionId: 'd2ff7807-ec32-469a-b5c6-6e516e9c7d91',
		label: 'Technology',
	},
	business: {
		path: '/news/business',
		collectionId: 'd2784d93-6410-4ed2-9841-0706eec42c7e',
		label: 'Business',
	},
	'business-more': {
		path: '/news/business',
		collectionId: '88fd0876-50da-481a-b9e3-9077445b06d4',
		label: 'Business More',
	},
	health: {
		path: '/news/health',
		collectionId: '6ed73d1f-7950-4ca4-89cf-0895035868a9',
		label: 'Health',
	},
	culture: {
		path: '/news/culture',
		collectionId: 'a26b1243-a1a8-4a3d-9d90-3cb8037aad94',
		label: 'Culture',
	},
	arts: {
		path: '/news/arts',
		collectionId: 'f30bef18-5bdd-403b-b2b0-8023b06c4f59',
		label: 'Arts',
	},
	travel: {
		path: '/news/travel',
		collectionId: '6ddbca4a-80f3-4875-8dd7-cbe76fca05b8',
		label: 'Travel',
	},
};
