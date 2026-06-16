import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';
import { DETAIL_URL_PREFIX } from './constants.js';

/** AIbase 单篇文章（API 返回格式） */
export interface AibaseArticleItem {
	oid: number;
	title?: string;
	subtitle?: string;
	thumb?: string;
	sourceName?: string;
	author?: string;
	description?: string;
	createTime?: string; // "2026-06-16 10:04:40"
	pv?: number;
}

/** AIbase API 响应格式 */
export interface AibaseApiResponse {
	code: number;
	msg?: string;
	data?: {
		list?: AibaseArticleItem[];
		totalCount?: number;
		pageSize?: number;
		pageNo?: number;
		totalPage?: number;
	};
}

function hash(input: string): string {
	return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/** 从 oid 构建文章 URL */
function buildArticleURL(oid: number): string {
	return `${DETAIL_URL_PREFIX}/${oid}`;
}

/** 解析 createTime 字符串为 ISO 格式 */
function parseCreateTime(createTime: string): string | undefined {
	try {
		const d = new Date(createTime);
		if (isNaN(d.getTime())) return undefined;
		return d.toISOString();
	} catch {
		return undefined;
	}
}

/**
 * 将 AIbase API 返回的文章列表解析为 NewsArticle[]
 */
export function parseArticles(items: AibaseArticleItem[]): NewsArticle[] {
	return items
		.filter((item) => {
			const hasContent = !!(item.title || item.subtitle || item.description);
			return hasContent && item.oid;
		})
		.map((item) => {
			const title = item.title?.trim() || item.subtitle?.trim() || 'Untitled';
			const url = buildArticleURL(item.oid);
			const publishedAt = item.createTime
				? parseCreateTime(item.createTime)
				: undefined;

			return {
				id: hash(String(item.oid)),
				title,
				url,
				source: item.sourceName?.trim() || 'AIbase',
				snippet: item.description?.trim() || undefined,
				publishedAt,
				imageUrl: item.thumb || undefined,
			};
		});
}
