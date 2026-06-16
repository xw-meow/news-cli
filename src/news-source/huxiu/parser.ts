import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';
import { CHANNELS } from './constants.js';

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/* ── API 响应类型 ── */

export interface HuxiuChannel {
  channel_id: number;
  name: string;
}

export interface HuxiuChannelListResponse {
  success: boolean;
  data: HuxiuChannel[];
}

export interface HuxiuArticleItem {
  aid: number;
  title: string;
  pic_path: string;
  url: string;
  dateline: number;
  is_original: boolean;
  label: string;
  is_none_headpic: boolean;
  is_video_article: boolean;
  count_info: {
    favorite_num: number;
    total_comment_num: number;
  };
  user_info: {
    uid: number;
    username: string;
    avatar: string;
    ip_url: string;
  };
  video_info: {
    duration: string;
  };
}

export interface HuxiuArticleListData {
  name: string;
  last_id: number;
  datalist: HuxiuArticleItem[];
  share_info: {
    share_url: string;
    share_title: string;
    share_desc: string;
    share_img: string;
  };
}

export interface HuxiuArticleListResponse {
  success: boolean;
  data: HuxiuArticleListData;
}

/* ── 解析函数 ── */

/**
 * 解析频道列表响应
 */
export function parseChannelList(data: HuxiuChannelListResponse): string[] {
  if (!data.success || !Array.isArray(data.data)) return [];
  return data.data.map((c) => c.name);
}

/**
 * 将文章数据列表转换为 NewsArticle[]
 */
export function parseArticles(
  datalist: HuxiuArticleItem[],
  channelName?: string,
): NewsArticle[] {
  return datalist.map((item) => {
    const url = item.url || `https://www.huxiu.com/article/${item.aid}.html`;

    return {
      id: hash(url),
      title: item.title,
      url,
      source: '虎嗅网',
      snippet: item.label || undefined,
      publishedAt: item.dateline
        ? new Date(item.dateline * 1000).toISOString()
        : undefined,
      category: channelName || CHANNELS[0],
      imageUrl: item.pic_path || undefined,
    } as NewsArticle;
  });
}
