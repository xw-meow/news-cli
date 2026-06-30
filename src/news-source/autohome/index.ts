import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchHTML } from '../../core/fetcher.js';
import { parseArticles } from './parser.js';
import { titleContains } from '../../utils/index.js';
import {
  BASE_URL,
  CATEGORIES,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
  MAX_PAGES,
} from './constants.js';

/** 拼接分页 URL */
function buildPageUrl(categoryPath: string, page: number): string {
  if (page === 1) {
    return `${BASE_URL}${categoryPath}#liststart`;
  }
  return `${BASE_URL}${categoryPath}${page}/#liststart`;
}

export const autohomeSource: NewsSource = {
  name: 'autohome',
  description: '汽车之家 — 最新汽车资讯，支持11个分类',

  async listCategories(): Promise<string[]> {
    return Object.keys(CATEGORIES);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category;
    const keyword = options?.keyword;
    const limit = options?.limit ?? DEFAULT_LIMIT;

    // 确定目标分类（默认最新，未知分类回退到最新）
    const effectiveCategory = (category && CATEGORIES[category]) ? category : '最新';
    const categoryPath = CATEGORIES[effectiveCategory];

    // 逐页抓取直到凑够 limit
    let articles: NewsArticle[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const pageUrl = buildPageUrl(categoryPath, page);
      const html = await fetchHTML(pageUrl, DEFAULT_TIMEOUT);
      const pageArticles = parseArticles(html, effectiveCategory);
      if (pageArticles.length === 0) break;
      articles = articles.concat(pageArticles);
      if (articles.length >= limit) break;
    }

    // 关键词本地过滤
    if (keyword) {
      articles = articles.filter((a) => titleContains(a, keyword));
    }

    return articles.slice(0, limit);
  },
};
