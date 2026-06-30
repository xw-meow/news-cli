import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import { parseNewsItems } from './parser.js';
import type { PengpaiChannelResponse, PengpaiSearchResponse, PengpaiNewsItem } from './parser.js';
import { titleContains, sleep } from '../../utils/index.js';
import {
  CHANNEL_CONTENT_URL,
  SEARCH_API_URL,
  REFERER,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
  CHANNELS,
} from './constants.js';

const PAGE_SIZE = 20;
const DELAY_MS = 500;
const headers = { Referer: REFERER };

/** 频道 API 分页拉取 */
async function fetchChannelPaginated(
  channelId: string,
  limit: number,
): Promise<PengpaiNewsItem[]> {
  const all: PengpaiNewsItem[] = [];
  const isYaowen = channelId === '';
  let cursor: number | undefined;

  while (all.length < limit) {
    const body: Record<string, unknown> = {
      channelId,
      excludeContIds: all.map((i) => i.contId),
      listRecommendIds: [],
      pageSize: PAGE_SIZE,
    };

    if (isYaowen) {
      // 要闻：startTime 始终为空字符串
      body.startTime = '';
    } else if (cursor) {
      body.startTime = cursor;
    }

    const resp = await fetchJSON<PengpaiChannelResponse>(
      CHANNEL_CONTENT_URL,
      DEFAULT_TIMEOUT,
      headers,
      'POST',
      JSON.stringify(body),
    );

    const list = resp?.data?.list ?? [];
    if (list.length === 0) break;

    all.push(...list);
    cursor = resp?.data?.startTime;

    if (!resp?.data?.hasNext) break;

    await sleep(DELAY_MS);
  }

  return all;
}

/** 搜索 API 分页拉取 */
async function fetchSearchPaginated(
  keyword: string,
  limit: number,
): Promise<PengpaiNewsItem[]> {
  const all: PengpaiNewsItem[] = [];
  let pageNum = 1;

  while (all.length < limit) {
    const body = JSON.stringify({
      word: keyword,
      orderType: 1,
      pageNum,
      pageSize: PAGE_SIZE,
      searchType: 1,
    });

    const resp = await fetchJSON<PengpaiSearchResponse>(
      SEARCH_API_URL,
      DEFAULT_TIMEOUT,
      headers,
      'POST',
      body,
    );

    const list = resp?.data?.list ?? [];
    if (list.length === 0) break;

    all.push(...list);
    if (list.length < PAGE_SIZE) break;

    pageNum++;
    await sleep(DELAY_MS);
  }

  return all;
}

export const pengpaiSource: NewsSource = {
  name: 'pengpai',
  description: '澎湃新闻 — 专注时政与思想，支持22个频道和关键词搜索',

  async listCategories(): Promise<string[]> {
    return Object.keys(CHANNELS);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category;
    const keyword = options?.keyword;
    const limit = options?.limit ?? DEFAULT_LIMIT;

    let items: PengpaiNewsItem[];

    if (keyword && !category) {
      // 规则2：无种类 + 有关键词 → 搜索 API
      items = await fetchSearchPaginated(keyword, limit);
    } else {
      // 规则1+3+4：走频道 API（默认要闻，或指定种类）
      const channelId = category ? CHANNELS[category] : CHANNELS['要闻'];
      items = await fetchChannelPaginated(channelId!, limit);
    }

    let articles = parseNewsItems(items);

    // 规则3：有关键词时，本地标题过滤
    if (keyword) {
      articles = articles.filter((a) => titleContains(a, keyword));
    }

    return articles.slice(0, limit);
  },
};
