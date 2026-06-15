import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { NewsCliError } from '../../core/types.js';
import { fetchRSS } from '../../core/fetcher.js';
import { parseHTML } from './parser.js';
import { BASE_URL, SEARCH_URL, CATEGORIES, DEFAULT_TIMEOUT, DEFAULT_LIMIT } from './constants.js';

function buildRequest(category: string, keyword?: string): { url: string; base: string; headers: Record<string, string> } {
  const commonHeaders: Record<string, string> = {
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': 'https://news.baidu.com/',
  };

  if (keyword) {
    const query = keyword.split(',').map((k) => k.trim()).join(' ');
    const encoded = encodeURIComponent(query);
    return {
      url: `${SEARCH_URL}?word=${encoded}&pn=0&cl=2&ct=0&tn=newstitle&rn=20&ie=utf-8`,
      base: SEARCH_URL,
      headers: commonHeaders,
    };
  }

  const path = CATEGORIES[category];
  return {
    url: path && path !== '/' ? `${BASE_URL}${path}` : BASE_URL,
    base: BASE_URL,
    headers: commonHeaders,
  };
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

    const { url, base, headers } = buildRequest(category, options?.keyword);
    const html = await fetchRSS(url, DEFAULT_TIMEOUT, headers);
    const articles = parseHTML(html, category, base);

    const limit = options?.limit ?? DEFAULT_LIMIT;
    return articles.slice(0, limit);
  },
};
