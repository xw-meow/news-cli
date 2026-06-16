import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import type { KrNewsItem, KrApiResponse } from './parser.js';
import { parseArticles } from './parser.js';
import { titleContains, sleep } from '../../utils/index.js';
import {
    API_URL,
    DEFAULT_TIMEOUT,
    DEFAULT_LIMIT,
    HEADERS,
    CHANNELS,
} from './constants.js';

const PAGE_SIZE = 30;
const PAGINATION_DELAY_MS = 300;

/** 根据显示名称反查 subnavNick */
function resolveChannelNick(category?: string): string {
    if (!category) return 'web_news';
    if (CHANNELS[category]) return category;
    for (const [nick, name] of Object.entries(CHANNELS)) {
        if (name === category) return nick;
    }
    return 'web_news';
}

/** 根据 subnavNick 获取显示名称 */
function resolveDisplayName(nick: string): string {
    return CHANNELS[nick] || '最新';
}

/** 编码 pageCallback: JSON → base64 */
function encodeCallback(cursor: Record<string, string | number>): string {
    const json = JSON.stringify(cursor);
    return Buffer.from(json, 'utf-8').toString('base64');
}

/** 构建初始 pageCallback（首页） */
function initialCursor(): Record<string, number> {
    const nowMs = Date.now();
    return {
        firstId: 9999999999,
        lastId: 9999999999,
        firstCreateTime: nowMs,
        lastCreateTime: nowMs,
    };
}

/** 从首页结果更新游标用于翻页 */
function nextCursor(
    items: KrNewsItem[],
    firstId: number,
    firstCreateTime: number,
): Record<string, number> {
    const last = items[items.length - 1];
    return {
        firstId,
        firstCreateTime,
        lastId: last?.itemId ?? 9999999999,
        lastCreateTime: last?.templateMaterial?.publishTime ?? Date.now(),
    };
}

/** 构建 POST 请求体 */
function buildBody(nick: string, cursor: Record<string, string | number>): string {
    const nowMs = Date.now();
    return JSON.stringify({
        partner_id: 'web',
        timestamp: nowMs,
        param: {
            subnavType: 1,
            subnavNick: nick,
            pageSize: PAGE_SIZE,
            pageEvent: 1,
            pageCallback: encodeCallback(cursor),
            siteId: 1,
            platformId: 2,
        },
    });
}

/** 发送一次 POST 请求并返回 items */
async function fetchPage(nick: string, cursor: Record<string, string | number>): Promise<KrNewsItem[]> {
    const body = buildBody(nick, cursor);
    const resp = await fetchJSON<KrApiResponse>(
        API_URL,
        DEFAULT_TIMEOUT,
        HEADERS,
        'POST',
        body,
    );
    return resp?.data?.itemList ?? [];
}

export const kr36Source: NewsSource = {
    name: '36kr',
    description: '36氪 — 最新、推荐、创投、财经、AI、科技、企服等17个频道',

    async listCategories(): Promise<string[]> {
        return Object.values(CHANNELS);
    },

    async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
        const keyword = options?.keyword;
        const limit = options?.limit ?? DEFAULT_LIMIT;
        const nick = resolveChannelNick(options?.category);
        const displayName = resolveDisplayName(nick);

        const allItems: KrNewsItem[] = [];

        // 首页
        const cursor = initialCursor();
        const firstPage = await fetchPage(nick, cursor);
        if (firstPage.length === 0) return [];

        allItems.push(...firstPage);

        const firstItem = firstPage[0];
        const firstId = firstItem.itemId ?? 9999999999;
        const firstCreateTime = firstItem.templateMaterial?.publishTime ?? cursor.firstCreateTime;

        // 翻页直到满足 limit
        while (allItems.length < limit) {
            await sleep(PAGINATION_DELAY_MS);
            const pageCursor = nextCursor(allItems, firstId, firstCreateTime);
            const page = await fetchPage(nick, pageCursor);

            // 按 itemId 去重
            const existingIds = new Set(allItems.map((i) => i.itemId));
            const newItems = page.filter((i) => !existingIds.has(i.itemId));
            if (newItems.length === 0) break;

            allItems.push(...newItems);
        }

        let articles = parseArticles(allItems, displayName);

        // 关键词本地过滤
        if (keyword) {
            articles = articles.filter((a) => titleContains(a, keyword));
        }

        return articles.slice(0, limit);
    },
};
