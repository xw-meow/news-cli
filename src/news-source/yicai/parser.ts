import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';
import { CATEGORY_MAP } from './constants.js';

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/* ── script 变量中的新闻项类型 ── */

export interface YicaiNewsItem {
  NewsID: number;
  NewsTitle: string;
  NewsNotes?: string;
  NewsThumbs?: string;
  NewsThumbs1?: string;
  NewsSource?: string;
  CreateDate?: string;
  url?: string;
  originPic?: string;
  pubDate?: string;
  NewsType?: number;
  ChannelName?: string;
  SubChannelName?: string;
}

/* ── 解析函数 ── */

/**
 * 从 HTML 中提取指定 script 变量（headList / latestList）的 JSON 数组
 */
export function extractList(html: string, varName: string): YicaiNewsItem[] {
  const regex = new RegExp(
    `${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`,
  );
  const m = html.match(regex);
  if (!m) return [];

  try {
    return JSON.parse(m[1]) as YicaiNewsItem[];
  } catch {
    return [];
  }
}

/**
 * 将 YicaiNewsItem[] 转为 NewsArticle[]
 */
export function parseArticles(
  items: YicaiNewsItem[],
  category: string,
): NewsArticle[] {
  return items.map((item) => {
    // 构造完整 URL
    const path = item.url || `/news/${item.NewsID}.html`;
    const url = path.startsWith('http') ? path : `https://www.yicai.com${path}`;

    // 构造图片 URL
    let imageUrl: string | undefined;
    if (item.originPic) {
      imageUrl = item.originPic.startsWith('http')
        ? item.originPic
        : `https://imgcdn.yicai.com/uppics/slides/${item.originPic}`;
    } else if (item.NewsThumbs) {
      imageUrl = item.NewsThumbs.startsWith('http')
        ? item.NewsThumbs
        : `https://imgcdn.yicai.com/uppics/thumbs/${item.NewsThumbs}`;
    }

    return {
      id: hash(url),
      title: item.NewsTitle || '',
      url,
      source: '第一财经',
      snippet: item.NewsNotes || undefined,
      publishedAt: item.CreateDate
        ? new Date(item.CreateDate).toISOString()
        : undefined,
      category,
      imageUrl,
    } as NewsArticle;
  });
}

/**
 * 列出所有可用分类
 */
export function listCategories(): string[] {
  return Object.keys(CATEGORY_MAP);
}
