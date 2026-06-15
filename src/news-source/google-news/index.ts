import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { NewsCliError } from '../../core/types.js';
import { fetchRSS } from '../../core/fetcher.js';
import { parseRSS } from './parser.js';
import { RSS_BASE, CATEGORIES, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

function buildURL(category: string, keyword?: string): string {
  const topicId = CATEGORIES[category];

  if (keyword) {
    const query = keyword.split(',').map((k) => k.trim()).join(' OR ');
    const encoded = encodeURIComponent(query);
    const base = topicId
      ? `${RSS_BASE}/topics/${topicId}`
      : RSS_BASE;
    return `${base}?q=${encoded}`;
  }

  if (topicId) {
    return `${RSS_BASE}/topics/${topicId}`;
  }

  // 默认：头条
  return RSS_BASE;
}

export const googleNewsSource: NewsSource = {
  name: 'google-news',
  description: 'Google News — global headlines by category',

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
