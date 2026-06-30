import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchHTML } from '../../core/fetcher.js';
import { parseArticles } from './parser.js';
import { titleContains } from '../../utils/index.js';
import {
  BASE_URL,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
  MAX_LOOKBACK_DAYS,
} from './constants.js';

/**
 * 格式化日期为 YYYYMMDD
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * 格式化日期为 YYYY-MM-DD（供 parser 补全年份）
 */
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const peopleCnSource: NewsSource = {
  name: 'people-cn',
  description: '人民网 — 每日要闻回顾',

  async listCategories(): Promise<string[]> {
    return [];
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const keyword = options?.keyword;
    const limit = options?.limit ?? DEFAULT_LIMIT;

    const allArticles: NewsArticle[] = [];
    const today = new Date();

    // 日期回溯循环：从今天开始，逐日往前直到凑够 limit 或超过最大回溯天数
    for (let offset = 0; offset < MAX_LOOKBACK_DAYS; offset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - offset);

      const dateCompact = formatDate(targetDate);
      const dateISO = formatDateISO(targetDate);
      const url = `${BASE_URL}/${dateCompact}.html`;

      try {
        const html = await fetchHTML(url, DEFAULT_TIMEOUT);
        const articles = parseArticles(html, dateISO);
        allArticles.push(...articles);
      } catch {
        // 当天页面抓取失败则跳过，继续往前一天
        continue;
      }

      if (allArticles.length >= limit) break;
    }

    // 关键词本地过滤
    let result = allArticles;
    if (keyword) {
      result = result.filter((a) => titleContains(a, keyword));
    }

    return result.slice(0, limit);
  },
};
