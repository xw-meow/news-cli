import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchHTML } from '../../core/fetcher.js';
import { titleContains } from '../../utils/index.js';
import { extractList, parseArticles, listCategories } from './parser.js';
import { HOME_URL, DEFAULT_TIMEOUT, DEFAULT_LIMIT, CATEGORY_MAP } from './constants.js';

export const yicaiSource: NewsSource = {
  name: 'yicai',
  description: '第一财经 — 首页头条与最新新闻',

  async listCategories(): Promise<string[]> {
    return listCategories();
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category || '最新';
    const keyword = options?.keyword;
    const limit = options?.limit ?? DEFAULT_LIMIT;

    // 确定要抓取的 script 变量名，并修正未知分类
    const varName = CATEGORY_MAP[category] ?? CATEGORY_MAP['最新'];
    const effectiveCategory = CATEGORY_MAP[category] ? category : '最新';

    // 抓取首页 HTML（一次性拿到所有数据）
    const html = await fetchHTML(HOME_URL, DEFAULT_TIMEOUT);

    // 提取对应的 JSON 数组并解析
    const items = extractList(html, varName);
    let articles = parseArticles(items, effectiveCategory);

    // 关键词本地过滤
    if (keyword) {
      articles = articles.filter((a) => titleContains(a, keyword));
    }

    return articles.slice(0, limit);
  },
};
