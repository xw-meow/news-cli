import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import { parseDataItems, type BbcDataItem, type BbcApiResponse } from './parser.js';
import { titleContains, sleep } from '../../utils/index.js';
import {
	API_BASE_URL,
	DEFAULT_TIMEOUT,
	DEFAULT_LIMIT,
	HEADERS,
	CATEGORIES,
	COUNTRY,
	PAGINATION_DELAY_MS,
} from './constants.js';

/**
 * 构建 API URL
 * GET /xd/content-collection/:collectionId?country=hk&page=0&size=N&path=/news/xxx
 */
function buildURL(collectionId: string, page: number, pageSize: number, path: string): string {
	const params = new URLSearchParams({
		country: COUNTRY,
		page: String(page),
		size: String(pageSize),
		path,
	});
	return `${API_BASE_URL}/${collectionId}?${params.toString()}`;
}

/**
 * 分页拉取，直到满足 limit 或没有更多数据
 */
async function fetchPaginated(
	collectionId: string,
	path: string,
	limit: number,
): Promise<BbcDataItem[]> {
	const all: BbcDataItem[] = [];
	let page = 0;
	let total = Infinity;

	while (all.length < limit && all.length < total) {
		const url = buildURL(collectionId, page, limit, path);
		const resp = await fetchJSON<BbcApiResponse>(url, DEFAULT_TIMEOUT, HEADERS);

		const data = resp?.data ?? [];
		if (data.length === 0) break;

		total = resp?.total ?? Infinity;
		all.push(...data);

		if (all.length >= total) break;

		page++;
		await sleep(PAGINATION_DELAY_MS);
	}

	return all;
}

export const bbcSource: NewsSource = {
	name: 'bbc',
	description: 'BBC News — 英国广播公司新闻，支持7个分类',

	async listCategories(): Promise<string[]> {
		return Object.keys(CATEGORIES);
	},

	async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
		const category = options?.category;
		const keyword = options?.keyword;
		const limit = options?.limit ?? DEFAULT_LIMIT;

		let items: BbcDataItem[];

		if (category) {
			const cat = CATEGORIES[category];
			if (!cat) {
				// 如果种类不存在，返回空列表
				return [];
			}
			items = await fetchPaginated(cat.collectionId, cat.path, limit);
		} else if (keyword) {
			// 无种类但有关键词时，从所有种类聚合拉取
			const allItems: BbcDataItem[] = [];
			const seen = new Set<string>();
			const perCategoryLimit = Math.max(limit, 20); // 每个种类至少拉20条以保证有关键词的结果

			for (const cat of Object.values(CATEGORIES)) {
				if (allItems.length >= limit * 2) break; // 提前停止，收集足够多了
				const catItems = await fetchPaginated(cat.collectionId, cat.path, perCategoryLimit);
				for (const item of catItems) {
					const key = item.path ?? item.id;
					if (key && !seen.has(key)) {
						seen.add(key);
						allItems.push(item);
					}
				}
			}
			items = allItems;
		} else {
			// 默认：Technology 分类
			const cat = CATEGORIES['technology'];
			items = await fetchPaginated(cat.collectionId, cat.path, limit);
		}

		let articles = parseDataItems(items);

		// 关键词本地过滤
		if (keyword) {
			articles = articles.filter((a) => titleContains(a, keyword));
		}

		return articles.slice(0, limit);
	},
};
