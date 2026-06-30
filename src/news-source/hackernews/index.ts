import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { NewsCliError } from '../../core/types.js';
import { fetchRSS } from '../../core/fetcher.js';
import { parseRSS } from './parser.js';
import { titleContains } from '../../utils/index.js';
import { CATEGORIES, DEFAULT_CATEGORY, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

export const hackernewsSource: NewsSource = {
  name: 'hackernews',
  description: 'Hacker News — 科技新闻聚合与讨论',

  async listCategories(): Promise<string[]> {
    return Object.keys(CATEGORIES);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category ?? DEFAULT_CATEGORY;
    const url = CATEGORIES[category];

    if (!url) {
      const available = Object.keys(CATEGORIES).join(', ');
      throw new NewsCliError(
        `Unknown category "${category}". Available: ${available}`,
        'INVALID_OPTION',
      );
    }

    const xml = await fetchRSS(url, DEFAULT_TIMEOUT);
    let articles = parseRSS(xml, category);

    if (options?.keyword) {
      articles = articles.filter((a) => titleContains(a, options.keyword!));
    }

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
