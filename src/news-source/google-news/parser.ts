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
  source?: { '#text'?: string; '@_url'?: string };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (_name: string, jpath: string) => jpath === 'rss.channel.item',
});

/**
 * 解析 Google News RSS XML → NewsArticle[]
 * @param xml - RSS XML 字符串
 * @param category - 新闻分类
 * @returns 解析后的新闻列表
 */
export function parseRSS(xml: string, category: string): NewsArticle[] {
  let parsed: { rss?: { channel?: { item?: RSSItem[] } } };
  try {
    parsed = parser.parse(xml);
  } catch {
    throw new NewsCliError('Failed to parse RSS XML', 'PARSE_FAILED');
  }

  // Empty object means malformed/non-XML input
  if (Object.keys(parsed).length === 0) {
    throw new NewsCliError('Failed to parse RSS XML', 'PARSE_FAILED');
  }

  const items = parsed?.rss?.channel?.item;
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.map((item: RSSItem) => {
    const rawTitle = item.title ?? 'Untitled';
    // Google News RSS 标题格式: "Article Title - Source Name"
    const sourceFromTitle = extractSourceFromTitle(rawTitle);
    const title = rawTitle.replace(` - ${sourceFromTitle}`, '').trim();

    const source =
      item.source?.['#text'] ?? sourceFromTitle ?? 'Google News';

    return {
      id: hash(item.link ?? item.guid ?? rawTitle),
      title: title || rawTitle,
      url: item.link ?? '',
      source,
      snippet: item.description?.replace(/<[^>]*>/g, '').trim(),
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      category,
    };
  });
}

/** 从 "Title - Source Name" 格式提取来源名 */
function extractSourceFromTitle(title: string): string | undefined {
  const lastDash = title.lastIndexOf(' - ');
  if (lastDash === -1) return undefined;
  return title.slice(lastDash + 3).trim();
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}
