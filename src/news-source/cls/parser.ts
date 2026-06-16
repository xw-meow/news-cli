import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';

/** 财联社单篇文章（API 返回格式，热点和头条字段略有差异） */
export interface ClsArticleItem {
	id?: string | number;
	title?: string;
	brief?: string;
	content?: string;
	ctime?: number; // Unix 时间戳（秒）
	/** 热点 API 使用 img，头条 API 使用 image */
	img?: string;
	image?: string;
}

/** 财联社 API 通用响应格式 */
export interface ClsApiResponse {
	errno: number;
	msg?: string;
	data?: ClsArticleItem[];
}

function hash(input: string): string {
	return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/** 从文章 ID 构建 URL */
function buildArticleURL(articleId: string | number): string {
	return `https://www.cls.cn/detail/${articleId}`;
}

/** 提取图片 URL：优先 img（热点），否则 image（头条） */
function extractImage(item: ClsArticleItem): string | undefined {
	return item.img || item.image || undefined;
}

/**
 * 将财联社 API 返回的文章列表解析为 NewsArticle[]
 */
export function parseArticles(
	items: ClsArticleItem[],
	category: string,
): NewsArticle[] {
	return items
		.filter((item) => {
			// 至少需要有标题或内容
			return !!(item.title || item.brief || item.content);
		})
		.map((item) => {
			const rawTitle = item.title?.trim() || '';
			const title = rawTitle || 'Untitled';
			const articleId = item.id ?? '';
			const url = articleId ? buildArticleURL(articleId) : 'https://www.cls.cn/';

			// ctime 是秒级时间戳，转为 ISO 字符串
			const publishedAt = item.ctime
				? new Date(item.ctime * 1000).toISOString()
				: undefined;

			return {
				id: hash(String(articleId || title)),
				title,
				url,
				source: '财联社',
				snippet: item.brief?.trim() || item.content?.trim() || undefined,
				publishedAt,
				category,
				imageUrl: extractImage(item),
			};
		});
}
