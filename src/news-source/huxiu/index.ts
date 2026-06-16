import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import { sleep, titleContains } from '../../utils/index.js';
import type {
  HuxiuChannelListResponse,
  HuxiuArticleListResponse,
} from './parser.js';
import { parseArticles, parseChannelList } from './parser.js';
import {
  CHANNEL_LIST_URL,
  ARTICLE_LIST_URL,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
  PAGE_SIZE,
  PAGINATION_DELAY_MS,
  ALL_CHANNEL_ID,
  CHANNELS,
} from './constants.js';

/** channel name → channel_id 反查 */
function resolveChannelId(name: string): number | undefined {
  for (const [id, n] of Object.entries(CHANNELS)) {
    if (n === name) return Number(id);
  }
  return undefined;
}

export const huxiuSource: NewsSource = {
  name: 'huxiu',
  description: '虎嗅网 — 商业科技资讯，支持14个频道',

  async listCategories(): Promise<string[]> {
    try {
      const res = await fetchJSON<HuxiuChannelListResponse>(
        CHANNEL_LIST_URL,
        DEFAULT_TIMEOUT,
        { 'Content-Type': 'application/x-www-form-urlencoded' },
        'POST',
        'platform=www',
      );
      return parseChannelList(res);
    } catch {
      // API 挂了就用硬编码列表兜底
      return Object.values(CHANNELS).filter((n) => n !== '全部');
    }
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category;
    const keyword = options?.keyword;
    const limit = options?.limit ?? DEFAULT_LIMIT;

    const channelId =
      category && category !== '全部'
        ? (resolveChannelId(category) ?? ALL_CHANNEL_ID)
        : ALL_CHANNEL_ID;

    const channelName = CHANNELS[channelId];

    let cursor: number | undefined;
    const seenIds = new Set<number>();
    const allItems: NewsArticle[] = [];

    while (allItems.length < limit) {
      const body = new URLSearchParams({
        platform: 'www',
        channel_id: String(channelId),
        last_id: String(cursor ?? ''),
        pagesize: String(PAGE_SIZE),
      });

      let res: HuxiuArticleListResponse;
      try {
        res = await fetchJSON<HuxiuArticleListResponse>(
          ARTICLE_LIST_URL,
          DEFAULT_TIMEOUT,
          { 'Content-Type': 'application/x-www-form-urlencoded' },
          'POST',
          body.toString(),
        );
      } catch {
        break;
      }

      if (!res.success || !res.data?.datalist) break;

      // 过滤已见过的 aid
      const freshItems = res.data.datalist.filter(
        (item) => !seenIds.has(item.aid),
      );
      if (freshItems.length === 0) break;

      // 记录 aid 去重
      for (const item of freshItems) {
        seenIds.add(item.aid);
      }

      const articles = parseArticles(freshItems, channelName);
      allItems.push(...articles);

      // 更新游标
      cursor = res.data.last_id;
      if (!cursor) break;

      if (allItems.length < limit) {
        await sleep(PAGINATION_DELAY_MS);
      }
    }

    // 关键词本地过滤
    let result = allItems;
    if (keyword) {
      result = result.filter((a) => titleContains(a, keyword));
    }

    return result.slice(0, limit);
  },
};
