import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';
import { NewsCliError } from '../../core/types.js';
import type { NewsArticle } from '../../core/types.js';

interface RSSItem {
  title?: string;
  link?: string;
  guid?: string | { '#text': string };
  pubDate?: string;
  description?: string;
  comments?: string;
}

const parser = new XMLParser({
  ignoreAttributes: true,
  isArray: (_name: string) => _name === 'item',
});

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * 解析 Hacker News RSS XML → NewsArticle[]
 */
export function parseRSS(xml: string, category: string): NewsArticle[] {
  let parsed: { rss?: { channel?: { item?: RSSItem[] } } };
  try {
    parsed = parser.parse(xml);
  } catch {
    throw new NewsCliError('Failed to parse RSS XML', 'PARSE_FAILED');
  }

  if (Object.keys(parsed).length === 0) {
    throw new NewsCliError('Failed to parse RSS XML', 'PARSE_FAILED');
  }

  const items = parsed?.rss?.channel?.item;
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.map((item: RSSItem) => {
    const title = item.title?.trim() || 'Untitled';
    // HN RSS 的 <link> 是外部文章链接；<comments> 是 HN 讨论页
    const link = item.link?.trim() ?? '';
    const hnLink = item.comments?.trim();

    return {
      id: hash(link || hnLink || title),
      title,
      url: link || hnLink || '',
      source: 'Hacker News',
      snippet: item.description ? stripHtml(item.description) : undefined,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      category,
    };
  });
}
