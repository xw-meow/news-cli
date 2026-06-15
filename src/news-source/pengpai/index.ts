import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import { parseSearchResults, extractCategories } from './parser.js';
import type { PengpaiSearchResponse } from './parser.js';
import {
  SEARCH_API_URL,
  REFERER,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
  DEFAULT_KEYWORD,
} from './constants.js';

function buildSearchBody(keyword: string, pageSize: number): string {
  return JSON.stringify({
    word: keyword,
    orderType: 1,
    pageNum: 1,
    pageSize,
    searchType: 1,
  });
}

async function searchPengpai(keyword: string): Promise<PengpaiSearchResponse> {
  const body = buildSearchBody(keyword, 50); // 拉取足够多以支持本地过滤
  return fetchJSON<PengpaiSearchResponse>(
    SEARCH_API_URL,
    DEFAULT_TIMEOUT,
    {
      Referer: REFERER,
    },
    'POST',
    body,
  );
}

export const pengpaiSource: NewsSource = {
  name: 'pengpai',
  description: '澎湃新闻 — 专注时政与思想，支持关键词搜索和分类过滤',

  async listCategories(): Promise<string[]> {
    const resp = await searchPengpai(DEFAULT_KEYWORD);
    const list = resp?.data?.list;
    if (!list || !Array.isArray(list)) {
      return [];
    }
    return extractCategories(list);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const keyword = options?.keyword || DEFAULT_KEYWORD;

    const resp = await searchPengpai(keyword);
    const list = resp?.data?.list;
    if (!list || !Array.isArray(list)) {
      return [];
    }

    let articles = parseSearchResults(list);

    // 按分类过滤
    if (options?.category) {
      articles = articles.filter((a) => a.category === options.category);
    }

    // 本地关键词过滤：只匹配标题，避免摘要噪声导致的误匹配
    if (options?.keyword) {
      const terms = options.keyword
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      if (terms.length > 0) {
        articles = articles.filter((a) =>
          terms.some((term) => a.title.toLowerCase().includes(term)),
        );
      }
    }

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
