import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';
import { EXCLUDE_TITLE_KEYWORDS, EXCLUDE_NODE_NAMES } from './constants.js';

interface PengpaiNodeInfo {
  nodeId?: number;
  name?: string;
}

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

export interface PengpaiChannelResponse {
  code: number;
  data?: { hasNext?: boolean; startTime?: number; list?: PengpaiNewsItem[] };
}

export interface PengpaiSearchResponse {
  code: number;
  data?: { list?: PengpaiNewsItem[] };
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function buildArticleURL(contId: string): string {
  return `https://www.thepaper.cn/newsDetail_forward_${contId}`;
}

export function parseNewsItems(items: PengpaiNewsItem[]): NewsArticle[] {
  return items
    .filter((item) => {
      const title = (item.name ?? '').toLowerCase();
      if (EXCLUDE_TITLE_KEYWORDS.some((kw) => title.includes(kw))) return false;
      const nodeName = item.nodeInfo?.name;
      if (nodeName && EXCLUDE_NODE_NAMES.has(nodeName)) return false;
      return true;
    })
    .map((item) => {
      const rawTitle = item.name?.trim() || 'Untitled';
      const title = stripHtml(rawTitle);
      const contId = item.contId ?? '';
      const url = contId ? buildArticleURL(contId) : 'https://www.thepaper.cn/';

      return {
        id: hash(contId || rawTitle),
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
