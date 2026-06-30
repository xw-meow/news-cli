import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import type { AibaseArticleItem, AibaseApiResponse } from './parser.js';
import { parseArticles } from './parser.js';
import { titleContains, sleep } from '../../utils/index.js';
import {
	API_URL,
	DEFAULT_TIMEOUT,
	DEFAULT_LIMIT,
	HEADERS,
	PAGINATION_DELAY_MS,
} from './constants.js';

/** 构建 API URL（带分页参数） */
function buildURL(pageNo: number): string {
	const t = Date.now();
	const params = new URLSearchParams({
		langType: 'zh_cn',
		pageNo: String(pageNo),
		t: String(t),
	});
	return `${API_URL}?${params.toString()}`;
}

/** 分页拉取文章，直到满足 limit 或没有更多页 */
async function fetchAll(limit: number): Promise<AibaseArticleItem[]> {
	const all: AibaseArticleItem[] = [];
	let pageNo = 1;
	let totalPage = 1;

	while (all.length < limit && pageNo <= totalPage) {
		const url = buildURL(pageNo);
		const resp = await fetchJSON<AibaseApiResponse>(
			url,
			DEFAULT_TIMEOUT,
			HEADERS,
		);

		if (!resp?.data?.list || resp.data.list.length === 0) break;

		const list = resp.data.list;
		totalPage = resp.data.totalPage ?? 1;
		all.push(...list);

		if (pageNo >= totalPage) break;

		pageNo++;
		await sleep(PAGINATION_DELAY_MS);
	}

	return all;
}

export const aibaseSource: NewsSource = {
	name: 'aibase',
	description: 'AIbase — AI 领域最新资讯',

	async listCategories(): Promise<string[]> {
		return [];
	},

	async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
		const keyword = options?.keyword;
		const limit = options?.limit ?? DEFAULT_LIMIT;

		const items = await fetchAll(limit);

		let articles = parseArticles(items);

		// 关键词本地过滤
		if (keyword) {
			articles = articles.filter((a) => titleContains(a, keyword));
		}

		return articles.slice(0, limit);
	},
};
