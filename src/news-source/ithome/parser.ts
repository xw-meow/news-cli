import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_: string, d: string) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_: string, h: string) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * 解析 data-ot 时间戳为 ISO 8601。
 * 支持两种格式：
 *   - ISO: 2026-06-15T20:47:10.7930000+08:00
 *   - 简写: 2026/6/10 13:16:22（专题页使用，假定北京时间）
 */
function parseTimestamp(dataOt: string): string | undefined {
  // ISO 8601 格式
  if (/^\d{4}-\d{2}-\d{2}T/.test(dataOt)) {
    const d = new Date(dataOt);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  // 2026/6/10 13:16:22 格式
  const m = dataOt.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) {
    const y = m[1], mo = m[2].padStart(2, '0'), d = m[3].padStart(2, '0');
    const h = m[4].padStart(2, '0'), min = m[5], s = m[6];
    const date = new Date(`${y}-${mo}-${d}T${h}:${min}:${s}+08:00`);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

/**
 * 从 HTML 中解析文章列表。
 * 支持整页 HTML（含 <ul class="bl">）以及 AJAX 分页返回的 <li> 片段。
 */
export function parseArticles(html: string, category?: string): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // 每个文章块以 <li> 开头、</li> 结尾，内部含 data-ot
  const liRegex = /<li>([\s\S]*?)<\/li>/g;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = liRegex.exec(html)) !== null) {
    const block = liMatch[1];

    // data-ot 是判断有效文章块的标记
    const dataOtMatch = block.match(/data-ot="([^"]*)"/);
    if (!dataOtMatch) continue;

    // 提取标题链接（href 可能在 class="title" 前后）
    let titleMatch = block.match(
      /<a\s[^>]*href="([^"]*)"[^>]*class="title"[^>]*>([\s\S]*?)<\/a>/,
    );
    if (!titleMatch) {
      titleMatch = block.match(
        /<a\s[^>]*class="title"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/,
      );
    }
    if (!titleMatch) continue;

    const url = titleMatch[1];
    const rawTitle = titleMatch[2];

    // 提取摘要
    const snippetMatch = block.match(/<div class="m">([\s\S]*?)<\/div>/);

    // 提取封面图
    const imgMatch = block.match(/data-original="([^"]*)"/);

    const title = decodeEntities(stripHtml(rawTitle)).trim();
    if (!title) continue;

    const publishedAt = parseTimestamp(dataOtMatch[1]);

    articles.push({
      id: hash(url),
      title,
      url,
      source: 'IT之家',
      snippet: snippetMatch ? decodeEntities(stripHtml(snippetMatch[1])) : undefined,
      publishedAt,
      category,
      imageUrl: imgMatch ? imgMatch[1] : undefined,
    });
  }

  return articles;
}

/**
 * 从 HTML 中提取最后一个 data-ot 值，用于 AJAX 分页。
 */
export function getLastDataOt(html: string): string | undefined {
  const matches = html.match(/data-ot="([^"]*)"/g);
  if (!matches || matches.length === 0) return undefined;
  const last = matches[matches.length - 1];
  const m = last.match(/data-ot="([^"]*)"/);
  return m ? m[1] : undefined;
}
