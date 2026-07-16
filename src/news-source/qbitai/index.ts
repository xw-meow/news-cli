import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchHTML } from '../../core/fetcher.js';
import { parseArticles, listCategories } from './parser.js';
import { titleContains, sleep } from '../../utils/index.js';
import {
  BASE_URL,
  CATEGORIES,
  DEFAULT_CATEGORY,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
  MAX_PAGES,
  PAGINATION_DELAY_MS,
} from './constants.js';

/** 拼接分页 URL */
function buildPageUrl(categoryPath: string, page: number): string {
  if (page === 1) {
    return `${BASE_URL}/${categoryPath}`;
  }
  return `${BASE_URL}/${categoryPath}?page=${page}`;
}

export const qbitaiSource: NewsSource = {
  name: 'qbitai',
  description: '量子位 QbitAI — AI 与科技资讯，支持资讯、智能车、智库、活动分类',

  async listCategories(): Promise<string[]> {
    return listCategories();
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category;
    const keyword = options?.keyword;
    const limit = options?.limit ?? DEFAULT_LIMIT;

    // 确定目标分类（默认资讯，未知分类回退到资讯）
    const effectiveCategory = category && CATEGORIES[category] ? category : DEFAULT_CATEGORY;
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

      if (page < MAX_PAGES) {
        await sleep(PAGINATION_DELAY_MS);
      }
    }

    // 关键词本地过滤
    if (keyword) {
      articles = articles.filter((a) => titleContains(a, keyword));
    }

    return articles.slice(0, limit);
  },
};
