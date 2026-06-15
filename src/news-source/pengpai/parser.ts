import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';

/** 搜索 API 返回的 nodeInfo */
interface PengpaiNodeInfo {
  nodeId?: number;
  name?: string;
}

/** 搜索 API 返回的单条新闻 */
export interface PengpaiNewsItem {
  contId?: string;
  name?: string;
  summary?: string;
  pubTime?: string;
  pubTimeLong?: number;
  pic?: string;
  smallPic?: string;
  nodeInfo?: PengpaiNodeInfo;
}

/** 搜索 API 顶层响应 */
export interface PengpaiSearchResponse {
  code: number;
  data?: {
    list?: PengpaiNewsItem[];
  };
  desc?: string;
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/** 去除 HTML 标签，返回纯文本 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/** 根据 contId 构建文章 URL */
function buildArticleURL(contId: string): string {
  return `https://www.thepaper.cn/newsDetail_forward_${contId}`;
}

/**
 * 将搜索 API 返回的 list 转换为 NewsArticle[]
 */
export function parseSearchResults(items: PengpaiNewsItem[]): NewsArticle[] {
  return items.map((item) => {
    const rawTitle = item.name?.trim() || 'Untitled';
    const title = stripHtml(rawTitle);
    const contId = item.contId ?? '';
    const url = contId ? buildArticleURL(contId) : 'https://www.thepaper.cn/';
    const idSource = contId || rawTitle;

    return {
      id: hash(idSource),
      title: title || 'Untitled',
      url,
      source: '澎湃新闻',
      snippet: item.summary ? stripHtml(item.summary) : undefined,
      publishedAt: item.pubTimeLong
        ? new Date(item.pubTimeLong).toISOString()
        : undefined,
      category: item.nodeInfo?.name || undefined,
      imageUrl: item.pic || item.smallPic || undefined,
    };
  });
}

/**
 * 从搜索结果中提取所有不重复的分类
 */
export function extractCategories(items: PengpaiNewsItem[]): string[] {
  const cats = new Set<string>();
  for (const item of items) {
    if (item.nodeInfo?.name) {
      cats.add(item.nodeInfo.name);
    }
  }
  return [...cats].sort();
}

/**
 * 关键词模糊匹配：逗号分隔为 OR 关系
 */
export function matchKeyword(article: NewsArticle, keyword: string): boolean {
  const terms = keyword.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
  if (terms.length === 0) return true;
  const text = `${article.title} ${article.snippet ?? ''}`.toLowerCase();
  return terms.some((term) => text.includes(term));
}
