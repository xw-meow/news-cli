import type { NewsArticle } from '../core/types.js';

/**
 * 通用异步等待
 * @param ms - 等待毫秒数
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 标题关键词过滤：逗号分隔 = OR 关系，不区分大小写。
 * 无关键词时全部通过。
 */
export function titleContains(article: NewsArticle, keyword: string): boolean {
	const terms = keyword
		.split(',')
		.map((k) => k.trim().toLowerCase())
		.filter(Boolean);
	if (terms.length === 0) return true;
	const t = article.title.toLowerCase();
	return terms.some((term) => t.includes(term));
}
