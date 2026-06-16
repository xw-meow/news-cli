import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';

/** 腾讯新闻单篇文章（API 返回格式） */
export interface TencentNewsItem {
	id?: string;
	title?: string;
	articletype?: string;
	publish_time?: string; // "2026-06-15 13:24:45"
	pic_info?: {
		big_img?: string[];
		small_img?: string[];
	};
	link_info?: {
		share_url?: string;
		url?: string;
		short_url?: string;
		org_url?: string;
	};
	media_info?: {
		chl_id?: string;
		chl_name?: string;
	};
	desc?: string;
}

/** 腾讯新闻 API 响应格式 */
export interface TencentNewsApiResponse {
	code: number;
	message?: string;
	data?: TencentNewsItem[];
}

function hash(input: string): string {
	return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/** 解析 publish_time 字符串为 ISO 格式 */
function parsePublishTime(publishTime: string): string | undefined {
	try {
		const d = new Date(publishTime);
		if (isNaN(d.getTime())) return undefined;
		return d.toISOString();
	} catch {
		return undefined;
	}
}

/** 提取封面图：优先 big_img，其次 small_img */
function extractImage(item: TencentNewsItem): string | undefined {
	const big = item.pic_info?.big_img;
	if (big && big.length > 0) return big[0];
	const small = item.pic_info?.small_img;
	if (small && small.length > 0) return small[0];
	return undefined;
}

/**
 * 将腾讯新闻 API 返回的文章列表解析为 NewsArticle[]
 */
export function parseArticles(
	items: TencentNewsItem[],
	category: string,
): NewsArticle[] {
	return items
		.filter((item) => {
			return !!(item.title && item.id);
		})
		.map((item) => {
			const title = item.title?.trim() || 'Untitled';
			const articleId = item.id!;
			// 优先使用 url，其次 share_url
			const url =
				item.link_info?.url ||
				item.link_info?.share_url ||
				`https://new.qq.com/rain/a/${articleId}`;
			const publishedAt = item.publish_time
				? parsePublishTime(item.publish_time)
				: undefined;

			return {
				id: hash(articleId),
				title,
				url,
				source: item.media_info?.chl_name?.trim() || '腾讯新闻',
				snippet: item.desc?.trim() || undefined,
				publishedAt,
				category,
				imageUrl: extractImage(item),
			};
		});
}
