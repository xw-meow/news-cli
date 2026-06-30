import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { NewsCliError } from '../../core/types.js';
import { fetchRSS } from '../../core/fetcher.js';
import { parseRSS } from '../google-news/parser.js';
import { RSS_BASE, CATEGORIES, LOCALE_PARAMS, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

function buildURL(category: string, keyword?: string): string {
  const topicId = CATEGORIES[category];

  // 关键词搜索：始终使用 /rss/search 端点 + 中国区 locale
  if (keyword) {
    const query = keyword.split(',').map((k) => k.trim()).join(' OR ');
    const encoded = encodeURIComponent(query);
    return `${RSS_BASE}/search?q=${encoded}&${LOCALE_PARAMS}`;
  }

  if (topicId) {
    return `${RSS_BASE}/topics/${topicId}?${LOCALE_PARAMS}`;
  }

  // 默认：中国区头条
  return `${RSS_BASE}?${LOCALE_PARAMS}`;
}

export const googleNewsCNSource: NewsSource = {
  name: 'google-news-cn',
  description: 'Google News 中国版 — 中文新闻，支持分类和关键词搜索',

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

    const url = buildURL(category, options?.keyword);
    const xml = await fetchRSS(url, DEFAULT_TIMEOUT);
    const articles = parseRSS(xml, category);

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
