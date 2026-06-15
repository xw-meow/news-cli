import type { NewsSource, NewsArticle, FetchOptions } from '../../core/types.js';
import { fetchJSON } from '../../core/fetcher.js';
import { titleContains } from '../../utils/keyword-filter.js';
import {
  filterCornerArticles,
  parseBodyExtends,
} from './parser.js';
import type { ActivityResponse, ArticleResponse } from './parser.js';
import {
  ACTIVITY_API_URL,
  ARTICLE_API_URL,
  USER_SLUG,
  AUTH_HEADER,
  REFERER,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMIT,
  ACTIVITY_PAGE_SIZE,
} from './constants.js';

const headers = {
  Authorization: AUTH_HEADER,
  Referer: REFERER,
};

/**
 * 从活动列表 API 拉取并筛选出目标栏目文章。
 * 返回去重后的 article id 列表。
 */
async function fetchCornerArticleIds(limit: number): Promise<number[]> {
  const now = Math.floor(Date.now() / 1000);
  const url = `${ACTIVITY_API_URL}?limit=${ACTIVITY_PAGE_SIZE}&offset=0&created_at=${now}&slug=${USER_SLUG}&has_article_body_extend_status=true`;

  const resp = await fetchJSON<ActivityResponse>(url, DEFAULT_TIMEOUT, headers);

  const list = resp?.data;
  if (!list || !Array.isArray(list)) return [];

  const filtered = filterCornerArticles(list);

  // 去重（同一篇文章可能出现在多个活动条目中）
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const item of filtered) {
    const id = item.data!.id;
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }

  return ids.slice(0, limit);
}

/**
 * 根据 article id 拉取文章详情，解析 body_extends 为新闻列表。
 */
async function fetchArticleNews(articleId: number): Promise<NewsArticle[]> {
  const url = `${ARTICLE_API_URL}?id=${articleId}&support_webp=true&view=second`;

  const resp = await fetchJSON<ArticleResponse>(url, DEFAULT_TIMEOUT, headers);

  const data = resp?.data;
  if (!data) return [];

  return parseBodyExtends(data);
}

export const sspaiSource: NewsSource = {
  name: 'sspai',
  description: '少数派 — 派早报/派晚报精选，支持关键词过滤',

  async listCategories(): Promise<string[]> {
    return [];
  },

  async fetch(options?: FetchOptions): Promise<NewsArticle[]> {
    const limit = options?.limit ?? DEFAULT_LIMIT;

    // Step 1: 从活动列表获取目标栏目的 article id
    const articleIds = await fetchCornerArticleIds(limit);

    if (articleIds.length === 0) return [];

    // Step 2: 并行拉取所有文章详情，解析 body_extends
    const results = await Promise.all(
      articleIds.map((id) => fetchArticleNews(id)),
    );
    const all = results.flat();

    // 去重（不同文章可能 body_extends 中有相同 URL）
    const seen = new Set<string>();
    const deduped: NewsArticle[] = [];
    for (const a of all) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        deduped.push(a);
      }
    }

    // Step 3: 关键词本地过滤
    let result = deduped;
    if (options?.keyword) {
      result = result.filter((a) => titleContains(a, options.keyword!));
    }

    return result.slice(0, limit);
  },
};
