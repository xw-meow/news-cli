import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import type { ClsArticleItem, ClsApiResponse } from './parser.js';
import { parseArticles } from './parser.js';
import { generateSign } from './sign.js';
import { titleContains, sleep } from '../../utils/index.js';
import {
	APP,
	OS,
	SV,
	DEPTH_ID,
	HOT_LIST_URL,
	DEPTH_LIST_URL,
	DEFAULT_TIMEOUT,
	DEFAULT_LIMIT,
	HEADERS,
	CATEGORIES,
	PAGINATION_DELAY_MS,
} from './constants.js';

/** 构建请求 URL（含 sign 签名） */
function buildSignedURL(
	baseURL: string,
	params: Record<string, string | number | undefined | null>,
): string {
	const sign = generateSign(params);
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			searchParams.set(key, String(value));
		}
	}
	searchParams.set('sign', sign);

	return `${baseURL}?${searchParams.toString()}`;
}

/** 拉取热点列表（无分页，直接返回全部） */
async function fetchHotList(): Promise<ClsArticleItem[]> {
	const params: Record<string, string | number> = {
		app: APP,
		os: OS,
		sv: SV,
	};

	const url = buildSignedURL(HOT_LIST_URL, params);
	const resp = await fetchJSON<ClsApiResponse>(
		url,
		DEFAULT_TIMEOUT,
		HEADERS,
	);

	return resp?.data ?? [];
}

/** 拉取头条列表（last_time 分页，用最小 ctime 作为游标） */
async function fetchDepthList(limit: number): Promise<ClsArticleItem[]> {
	const all: ClsArticleItem[] = [];
	let lastTime: number | undefined;

	while (all.length < limit) {
		const params: Record<string, string | number | undefined> = {
			app: APP,
			id: DEPTH_ID,
			os: OS,
			sv: SV,
		};

		// 第一页不传 last_time
		if (lastTime !== undefined) {
			params.last_time = lastTime;
		}

		const url = buildSignedURL(
			`${DEPTH_LIST_URL}/${DEPTH_ID}`,
			params,
		);
		const resp = await fetchJSON<ClsApiResponse>(
			url,
			DEFAULT_TIMEOUT,
			HEADERS,
		);

		const list = resp?.data ?? [];
		if (list.length === 0) break;

		all.push(...list);

		// 用最小 ctime 作为下一页的 last_time
		const timestamps = list
			.map((item) => item.ctime)
			.filter((t): t is number => t !== undefined);
		if (timestamps.length > 0) {
			lastTime = Math.min(...timestamps);
		} else {
			break;
		}

		await sleep(PAGINATION_DELAY_MS);
	}

	return all;
}

export const clsSource: NewsSource = {
	name: 'cls',
	description: '财联社 — 专业财经资讯，支持热点和头条',

	async listCategories(): Promise<string[]> {
		return Object.keys(CATEGORIES);
	},

	async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
		const category = options?.category;
		const keyword = options?.keyword;
		const limit = options?.limit ?? DEFAULT_LIMIT;

		let items: ClsArticleItem[];
		let resolvedCategory: string;

		if (category && CATEGORIES[category] === 'depth') {
			// 头条：分页拉取
			resolvedCategory = '头条';
			items = await fetchDepthList(limit);
		} else {
			// 默认走热点（无分页）
			resolvedCategory = '热点';
			items = await fetchHotList();
		}

		let articles = parseArticles(items, resolvedCategory);

		// 关键词本地过滤
		if (keyword) {
			articles = articles.filter((a) => titleContains(a, keyword));
		}

		return articles.slice(0, limit);
	},
};
