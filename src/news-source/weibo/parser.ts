import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';

/** hot_band API 返回的单个热搜条目 */
export interface HotBandItem {
  word?: string;
  word_scheme?: string;
  note?: string;
  num?: number;
  rank?: number;
  realpos?: number;
  category?: string;
  onboard_time?: number;
  topic_flag?: number;
  flag?: number;
}

/** hot_band API 顶层响应 */
export interface HotBandResponse {
  ok: number;
  http_code?: number;
  data?: {
    band_list?: HotBandItem[];
  };
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/** 根据 word_scheme 构建微博搜索 URL */
function buildWeiboURL(wordScheme?: string, word?: string): string {
  // word_scheme 形如 "#话题#" 或纯文本
  const topic = wordScheme ?? word ?? '';
  if (!topic) return 'https://weibo.com/';
  // 去掉首尾 # 以避免双重编码问题
  const clean = topic.replace(/^#+/, '').replace(/#+$/, '');
  return `https://s.weibo.com/weibo?q=${encodeURIComponent(clean)}`;
}

/**
 * 将 hot_band band_list 转换为 NewsArticle[]
 * @param items - band_list 条目
 * @returns 标准化后的新闻文章列表
 */
export function parseHotBand(items: HotBandItem[]): NewsArticle[] {
  return items.map((item) => {
    const title = item.word?.trim() || 'Untitled';
    const url = buildWeiboURL(item.word_scheme, item.word);
    const idSource = item.word_scheme ?? item.word ?? url;

    return {
      id: hash(idSource),
      title,
      url,
      source: '微博热搜',
      snippet: item.note || undefined,
      publishedAt: item.onboard_time
        ? new Date(item.onboard_time * 1000).toISOString()
        : undefined,
      category: item.category || undefined,
    };
  });
}

/**
 * 从热搜条目中提取所有不重复的分类
 */
export function extractCategories(items: HotBandItem[]): string[] {
  const cats = new Set<string>();
  for (const item of items) {
    if (item.category) {
      cats.add(item.category);
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
