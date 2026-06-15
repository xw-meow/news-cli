import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { NewsCliError } from '../../core/types.js';
import { fetchRSS } from '../../core/fetcher.js';
import { parseHTML } from './parser.js';
import { BASE_URL, SEARCH_URL, CATEGORIES, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

function buildURL(category: string, keyword?: string): { url: string; base: string } {
  if (keyword) {
    const query = keyword.split(',').map((k) => k.trim()).join(' ');
    const encoded = encodeURIComponent(query);
    return {
      url: `${SEARCH_URL}?word=${encoded}&tn=news&from=news&cl=2&rn=20`,
      base: SEARCH_URL,
    };
  }

  const path = CATEGORIES[category];
  if (path && path !== '/') {
    return { url: `${BASE_URL}${path}`, base: BASE_URL };
  }

  return { url: BASE_URL, base: BASE_URL };
}

export const baiduNewsSource: NewsSource = {
  name: 'baidu-news',
  description: '百度新闻 — 国内综合新闻，支持分类和关键词搜索',

  async listCategories(): Promise<string[]> {
    return Object.keys(CATEGORIES);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category ?? 'headlines';

    if (!(category in CATEGORIES)) {
      const available = Object.keys(CATEGORIES).join(', ');
      throw new NewsCliError(
        `Unknown category "${category}". Available: ${available}`,
        'INVALID_OPTION',
      );
    }

    const { url, base } = buildURL(category, options?.keyword);
    const html = await fetchRSS(url, DEFAULT_TIMEOUT);
    const articles = parseHTML(html, category, base);

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
