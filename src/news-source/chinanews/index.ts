import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { NewsCliError } from '../../core/types.js';
import { fetchRSS } from '../../core/fetcher.js';
import { parseRSS } from './parser.js';
import { titleContains } from '../../utils/keyword-filter.js';
import { CATEGORIES, DEFAULT_CATEGORY, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

export const chinanewsSource: NewsSource = {
  name: 'chinanews',
  description: '中国新闻网 — 24个分类频道，默认即时新闻',

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

    // 关键字本地标题过滤
    if (options?.keyword) {
      articles = articles.filter((a) => titleContains(a, options.keyword!));
    }

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
