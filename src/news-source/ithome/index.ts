import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchHTML } from '../../core/fetcher.js';
import { parseArticles, getLastDataOt } from './parser.js';
import { titleContains } from '../../utils/keyword-filter.js';
import {
  CATEGORIES,
  DOMAINPAGE_URL,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
} from './constants.js';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * 将 data-ot 值转为毫秒时间戳，用于 AJAX 分页的 ot 参数。
 * 支持 ISO 和 2026/6/10 13:16:22 两种格式。
 */
function dataOtToMs(dataOt: string): number {
  // ISO 格式直接用 Date 解析
  if (/^\d{4}-\d{2}-\d{2}T/.test(dataOt)) {
    return new Date(dataOt).getTime();
  }
  // 2026/6/10 13:16:22 → 补零后用北京时间解析
  const m = dataOt.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) {
    const y = m[1], mo = m[2].padStart(2, '0'), d = m[3].padStart(2, '0');
    const h = m[4].padStart(2, '0'), min = m[5], s = m[6];
    return new Date(`${y}-${mo}-${d}T${h}:${min}:${s}+08:00`).getTime();
  }
  return 0;
}

/**
 * 通过 AJAX POST 加载更多文章。
 * 返回 HTML 片段（<li>…</li>），可交由 parseArticles 解析。
 */
async function fetchMore(
  domain: string,
  lastDataOt: string,
): Promise<string> {
  const otMs = dataOtToMs(lastDataOt);
  if (otMs === 0) return '';

  const body = new URLSearchParams({ domain, subdomain: '', ot: String(otMs) });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(DOMAINPAGE_URL, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) return '';

    const result = (await response.json()) as {
      success?: boolean;
      content?: { count?: number; html?: string };
    };

    if (result.success && result.content?.html) {
      return result.content.html;
    }
    return '';
  } catch {
    clearTimeout(timer);
    return '';
  }
}

export const ithomeSource: NewsSource = {
  name: 'ithome',
  description: 'IT之家 — 前沿科技新闻，支持20个分类',

  async listCategories(): Promise<string[]> {
    return Object.keys(CATEGORIES);
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const category = options?.category;
    const keyword = options?.keyword;
    const limit = options?.limit ?? DEFAULT_LIMIT;

    // 确定目标分类（默认业界）
    const effectiveCategory = category || '业界';
    const catConfig = CATEGORIES[effectiveCategory] ?? CATEGORIES['业界'];

    // 拉取首页 HTML
    const html = await fetchHTML(catConfig.url, DEFAULT_TIMEOUT);
    let articles = parseArticles(html, effectiveCategory);
    let lastDataOt = getLastDataOt(html);

    // AJAX 分页补足（首页通常 ≥ 20 条，一般不需翻页）
    while (articles.length < limit && articles.length > 0 && lastDataOt) {
      const moreHtml = await fetchMore(catConfig.domain, lastDataOt);
      if (!moreHtml) break;

      const moreArticles = parseArticles(moreHtml, category);
      if (moreArticles.length === 0) break;

      articles = articles.concat(moreArticles);
      lastDataOt = getLastDataOt(moreHtml);
    }

    // 关键词本地过滤
    if (keyword) {
      articles = articles.filter((a) => titleContains(a, keyword));
    }

    return articles.slice(0, limit);
  },
};
