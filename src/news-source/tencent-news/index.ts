import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import type { TencentNewsItem, TencentNewsApiResponse } from './parser.js';
import { parseArticles } from './parser.js';
import { titleContains } from '../../utils/index.js';
import {
	API_URL,
	DEFAULT_TIMEOUT,
	DEFAULT_LIMIT,
	MAX_ITEM_COUNT,
	HEADERS,
	CHANNELS,
} from './constants.js';

/** 根据显示名称或 channel_id 反查 channel_id */
function resolveChannelId(category?: string): string {
	if (!category) return 'news_news_fx';
	// 如果直接传了 channel_id
	if (CHANNELS[category]) return category;
	// 根据显示名称反查
	for (const [id, name] of Object.entries(CHANNELS)) {
		if (name === category) return id;
	}
	return 'news_news_fx'; // 默认科技/AI
}

/** 根据 channel_id 获取显示名称 */
function resolveDisplayName(channelId: string): string {
	return CHANNELS[channelId] || '科技/AI';
}

/** 构建请求体 */
function buildBody(channelId: string, itemCount: number): string {
	return JSON.stringify({
		base_req: { from: 'pc' },
		forward: '1',
		channel_id: channelId,
		item_count: itemCount,
	});
}

export const tencentNewsSource: NewsSource = {
	name: 'tencent-news',
	description: '腾讯新闻 — 科技/AI、要闻、财经、体育、娱乐',

	async listCategories(): Promise<string[]> {
		return Object.values(CHANNELS);
	},

	async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
		const keyword = options?.keyword;
		const limit = options?.limit ?? DEFAULT_LIMIT;
		const channelId = resolveChannelId(options?.category);
		const displayName = resolveDisplayName(channelId);

		const itemCount = Math.min(limit, MAX_ITEM_COUNT);
		const body = buildBody(channelId, itemCount);

		const resp = await fetchJSON<TencentNewsApiResponse>(
			API_URL,
			DEFAULT_TIMEOUT,
			HEADERS,
			'POST',
			body,
		);

		const items: TencentNewsItem[] = resp?.data ?? [];

		let articles = parseArticles(items, displayName);

		// 关键词本地过滤
		if (keyword) {
			articles = articles.filter((a) => titleContains(a, keyword));
		}

		return articles.slice(0, limit);
	},
};
