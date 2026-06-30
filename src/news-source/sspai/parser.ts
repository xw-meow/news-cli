import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';
import { CORNER_NAMES, EXCLUDE_TITLES } from './constants.js';

// ---- Activity API 响应类型 ----
// 活动列表 API 中，文章信息嵌套在 item.data 下

export interface ActivityArticleData {
  id: number;
  title?: string;
  corner?: {
    id: number;
    name: string;
  };
}

export interface ActivityItem {
  id: number;
  data?: ActivityArticleData;
}

export interface ActivityResponse {
  error: number;
  msg?: string;
  data?: ActivityItem[];
}

// ---- Article API 响应类型 ----

export interface BodyExtend {
  id?: number;
  title?: string;
  /** HTML 正文，链接嵌入在 <a> 标签中 */
  body?: string;
}

export interface ArticleData {
  id: number;
  title?: string;
  banner?: string;
  body_extends?: BodyExtend[];
  /** Unix 时间戳（秒） */
  released_time?: number;
}

export interface ArticleResponse {
  error: number;
  msg?: string;
  data?: ArticleData;
}

// ---- 解析函数 ----

/**
 * 从活动列表中筛选出目标栏目（派早报/派晚报）的条目。
 * 返回对应的 article id 列表（去重）。
 */
export function filterCornerArticles(list: ActivityItem[]): ActivityItem[] {
  return list.filter(
    (item) =>
      item.data?.id &&
      item.data?.corner?.name &&
      CORNER_NAMES.includes(item.data.corner.name),
  );
}

/**
 * 从 HTML body 中提取第一个链接 URL。
 */
function extractFirstURL(body: string): string {
  const m = body.match(/href="(https?:\/\/[^"]+)"/);
  return m ? m[1] : '';
}

/**
 * 从 HTML body 中提取纯文本作为摘要。
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 将文章详情的 body_extends 解析为 NewsArticle 列表。
 * - 过滤掉标题包含排除关键词的子篇
 * - 以文章本身的 title 作为 category 标记
 * - 从 body HTML 中提取首个链接作为 url，纯文本作为 snippet
 */
export function parseBodyExtends(
  article: ArticleData,
): NewsArticle[] {
  const bodyExtends = article.body_extends;
  if (!bodyExtends || !Array.isArray(bodyExtends)) return [];

  const category = article.title ?? '';
  const articleUrl = `https://sspai.com/post/${article.id}`;

  return bodyExtends
    .filter((ext) => {
      const t = ext.title ?? '';
      if (!t) return false;
      return !EXCLUDE_TITLES.some((kw) => t.includes(kw));
    })
    .map((ext) => {
      const body = ext.body ?? '';
      const url = extractFirstURL(body) || articleUrl;
      return {
        id: hashURL(url),
        title: ext.title ?? '',
        url,
        source: '少数派',
        snippet: stripHTML(body).slice(0, 200) || undefined,
        publishedAt: article.released_time
          ? new Date(article.released_time * 1000).toISOString()
          : undefined,
        category,
        imageUrl: article.banner
          ? `https://cdnfile.sspai.com/${article.banner}`
          : undefined,
      };
    });
}

/**
 * SHA-256 前 12 位 hex，与 RSS parser 保持一致。
 */
function hashURL(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 12);
}
