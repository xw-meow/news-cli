import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';
import { BASE_URL } from './constants.js';

/** BBC API 返回的单条数据 */
export interface BbcDataItem {
	path?: string;
	id?: string;
	type?: string;
	subtype?: string;
	title?: string;
	summary?: string;
	topics?: string[];
	indexImage?: {
		model?: {
			blocks?: {
				src?: string;
				altText?: string;
				width?: number;
				height?: number;
			};
		};
	};
	firstPublishedAt?: string;
	lastPublishedAt?: string;
	state?: string;
}

/** BBC Content Collection API 响应 */
export interface BbcApiResponse {
	page?: number;
	pageSize?: number;
	total?: number;
	data?: BbcDataItem[];
}

function hash(input: string): string {
	return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function buildArticleURL(path: string): string {
	return `${BASE_URL}${path}`;
}

/**
 * 将 BBC API 返回的数据解析为 NewsArticle[]
 */
export function parseDataItems(items: BbcDataItem[]): NewsArticle[] {
	return items
		.filter((item) => {
			// 过滤非 article 类型（如 video、gallery 等）
			if (item.type !== 'article') return false;
			if (!item.path) return false;
			if (!item.title) return false;
			return true;
		})
		.map((item) => {
			const title = item.title!.trim();
			const url = buildArticleURL(item.path!);
			const imageUrl = item.indexImage?.model?.blocks?.src || undefined;
			const publishedAt = item.firstPublishedAt || undefined;

			return {
				id: hash(item.path!),
				title,
				url,
				source: 'BBC News',
				snippet: item.summary?.trim() || undefined,
				publishedAt,
				category: item.topics?.length ? item.topics[0] : undefined,
				imageUrl,
			};
		});
}
