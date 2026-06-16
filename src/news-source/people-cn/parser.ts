import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * 从 <li><a href="URL">标题</a> [时间戳]</li> 块中解析文章。
 * @param html - 人民网 review 页面 HTML
 * @param dateStr - 页面日期（YYYY-MM-DD），用于为无年份的时间戳补全年份
 */
export function parseArticles(html: string, dateStr: string): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // 提取 <li>…</li> 块
  const liRegex = /<li>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = liRegex.exec(html)) !== null) {
    const block = liMatch[1];

    // 提取第一个 <a> 标签的 href
    let hrefMatch = block.match(/<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i);
    if (!hrefMatch) {
      hrefMatch = block.match(/<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i);
    }
    if (!hrefMatch) continue;

    const url = hrefMatch[1];

    // 提取第一个 <a> 标签的文本内容
    const aTextMatch = block.match(/<a\s[^>]*>([\s\S]*?)<\/a>/i);
    if (!aTextMatch) continue;

    const title = stripHtml(aTextMatch[1]).replace(/\s+/g, ' ').trim();
    if (!title) continue;

    // 提取时间戳 [YYYY年MM月DD日HH:MM] 或 [MM月DD日HH:MM]
    const timeMatch = block.match(/\[([^\]]+)\]/);
    let publishedAt: string | undefined;

    if (timeMatch) {
      publishedAt = parsePeopleTime(timeMatch[1], dateStr);
    }

    articles.push({
      id: hash(url),
      title,
      url,
      source: '人民网',
      publishedAt,
    });
  }

  return articles;
}

/**
 * 解析人民网时间格式为 ISO 8601。
 * 支持两种格式：
 *   - YYYY年MM月DD日HH:MM（含年份）
 *   - MM月DD日HH:MM（无年份，用 dateStr 补全）
 */
function parsePeopleTime(raw: string, dateStr: string): string | undefined {
  // YYYY年MM月DD日HH:MM
  let m = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})/);
  if (m) {
    const y = m[1], mo = m[2].padStart(2, '0'), d = m[3].padStart(2, '0');
    const h = m[4].padStart(2, '0'), min = m[5];
    const date = new Date(`${y}-${mo}-${d}T${h}:${min}:00+08:00`);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  // MM月DD日HH:MM（无年份，从 dateStr 补）
  m = raw.match(/(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})/);
  if (m) {
    const dateParts = dateStr.split('-');
    const y = dateParts[0];
    const mo = m[1].padStart(2, '0'), d = m[2].padStart(2, '0');
    const h = m[3].padStart(2, '0'), min = m[4];
    const date = new Date(`${y}-${mo}-${d}T${h}:${min}:00+08:00`);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  return undefined;
}
