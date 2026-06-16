import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import type { KrNewsItem, KrApiResponse } from './parser.js';
import { parseArticles } from './parser.js';
import { titleContains } from '../../utils/index.js';
import {
    API_URL,
    DEFAULT_TIMEOUT,
    DEFAULT_LIMIT,
    HEADERS,
    CHANNELS,
} from './constants.js';

/** 根据显示名称反查 subnavNick */
function resolveChannelNick(category?: string): string {
    if (!category) return 'web_news';
    // 如果直接传了 subnavNick
    if (CHANNELS[category]) return category;
    // 根据显示名称反查
    for (const [nick, name] of Object.entries(CHANNELS)) {
        if (name === category) return nick;
    }
    return 'web_news'; // 默认资讯
}

/** 根据 subnavNick 获取显示名称 */
function resolveDisplayName(nick: string): string {
    return CHANNELS[nick] || '资讯';
}

/** 编码 pageCallback: JSON → base64 */
function encodeCallback(cursor: Record<string, string | number>): string {
    const json = JSON.stringify(cursor);
    return Buffer.from(json, 'utf-8').toString('base64');
}

/** 构建 36kr POST 请求体 */
function buildBody(nick: string): string {
    const nowMs = Date.now();
    const callback = encodeCallback({
        firstId: 9999999999,
        lastId: 9999999999,
        firstCreateTime: nowMs,
        lastCreateTime: nowMs,
    });

    return JSON.stringify({
        partner_id: 'web',
        timestamp: nowMs,
        param: {
            subnavType: 1,
            subnavNick: nick,
            pageSize: 30,
            pageEvent: 1,
            pageCallback: callback,
            siteId: 1,
            platformId: 2,
        },
    });
}

export const kr36Source: NewsSource = {
    name: '36kr',
    description: '36氪 — 资讯、推荐、企服、科技、金融、创业',

    async listCategories(): Promise<string[]> {
        return Object.values(CHANNELS);
    },

    async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
        const keyword = options?.keyword;
        const limit = options?.limit ?? DEFAULT_LIMIT;
        const nick = resolveChannelNick(options?.category);
        const displayName = resolveDisplayName(nick);

        const body = buildBody(nick);

        const resp = await fetchJSON<KrApiResponse>(
            API_URL,
            DEFAULT_TIMEOUT,
            HEADERS,
            'POST',
            body,
        );

        const items: KrNewsItem[] = resp?.data?.itemList ?? [];

        let articles = parseArticles(items, displayName);

        // 关键词本地过滤
        if (keyword) {
            articles = articles.filter((a) => titleContains(a, keyword));
        }

        return articles.slice(0, limit);
    },
};
