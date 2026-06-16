import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';

/** 36kr 单篇文章 item（API 返回 itemList 中的元素） */
export interface KrNewsItem {
    itemId?: number;
    templateMaterial?: {
        widgetTitle?: string;
        widgetUrl?: string;
        widgetImage?: string;
        publishTime?: number; // ms timestamp
        snippet?: string;
    };
}

/** 36kr API 响应格式 */
export interface KrApiResponse {
    code: number;
    msg?: string;
    data?: {
        itemList?: KrNewsItem[];
    };
}

function hash(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/** 将 ms 时间戳转为 ISO 字符串 */
function parsePublishTime(ms: number): string | undefined {
    try {
        if (!ms || ms <= 0) return undefined;
        const d = new Date(ms);
        if (isNaN(d.getTime())) return undefined;
        return d.toISOString();
    } catch {
        return undefined;
    }
}

/**
 * 将 36kr API 返回的 itemList 解析为 NewsArticle[]
 */
export function parseArticles(
    items: KrNewsItem[],
    category: string,
): NewsArticle[] {
    return items
        .filter((item) => {
            const tm = item.templateMaterial;
            return !!(tm?.widgetTitle && tm?.widgetUrl);
        })
        .map((item) => {
            const tm = item.templateMaterial!;
            const title = tm.widgetTitle?.trim() || 'Untitled';
            const url = tm.widgetUrl!;
            const publishedAt = tm.publishTime
                ? parsePublishTime(tm.publishTime)
                : undefined;

            return {
                id: hash(url),
                title,
                url,
                source: '36氪',
                snippet: tm.snippet?.trim() || undefined,
                publishedAt,
                category,
                imageUrl: tm.widgetImage || undefined,
            };
        });
}
