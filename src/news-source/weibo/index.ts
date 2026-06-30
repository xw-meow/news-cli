import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import { parseHotBand, extractCategories, matchKeyword } from './parser.js';
import type { HotBandResponse } from './parser.js';
import { HOT_BAND_URL, REFERER, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

export const weiboSource: NewsSource = {
  name: 'weibo',
  description: '微博热搜榜 — 实时热搜，支持按分类和关键词过滤',

  async listCategories(): Promise<string[]> {
    const resp = await fetchJSON<HotBandResponse>(HOT_BAND_URL, DEFAULT_TIMEOUT, {
      Referer: REFERER,
      'X-Requested-With': 'XMLHttpRequest',
    });

    const bandList = resp?.data?.band_list;
    if (!bandList || !Array.isArray(bandList)) {
      return [];
    }

    return extractCategories(bandList);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const resp = await fetchJSON<HotBandResponse>(HOT_BAND_URL, DEFAULT_TIMEOUT, {
      Referer: REFERER,
      'X-Requested-With': 'XMLHttpRequest',
    });

    const bandList = resp?.data?.band_list;
    if (!bandList || !Array.isArray(bandList)) {
      return [];
    }

    let articles = parseHotBand(bandList);

    // 按分类过滤
    if (options?.category) {
      articles = articles.filter((a) => a.category === options.category);
    }

    // 按关键词过滤
    if (options?.keyword) {
      articles = articles.filter((a) => matchKeyword(a, options.keyword!));
    }

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
