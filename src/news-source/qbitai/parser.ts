import { createHash } from 'node:crypto';
import type { NewsArticle } from '../../core/types.js';
import { CATEGORIES } from './constants.js';

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
    .replace(/&#x([0-9a-f]+);/gi, (_: string, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ');
}

function cleanText(html: string): string {
  return decodeEntities(stripHtml(html)).replace(/\s+/g, ' ').trim();
}

/** 解析相对时间为 ISO 8601；无法解析时返回 undefined */
function parseRelativeTime(text: string): string | undefined {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // X分钟前
  let m = text.match(/(\d+)\s*分钟前/);
  if (m) {
    return new Date(now.getTime() - Number(m[1]) * 60_000).toISOString();
  }

  // X小时前
  m = text.match(/(\d+)\s*小时前/);
  if (m) {
    return new Date(now.getTime() - Number(m[1]) * 3_600_000).toISOString();
  }

  // X天前
  m = text.match(/(\d+)\s*天前/);
  if (m) {
    return new Date(today.getTime() - Number(m[1]) * 86_400_000).toISOString();
  }

  // 昨天 HH:MM
  m = text.match(/昨天\s*(\d{1,2}):(\d{2})/);
  if (m) {
    const d = new Date(today.getTime() - 86_400_000 + Number(m[1]) * 3_600_000 + Number(m[2]) * 60_000);
    return d.toISOString();
  }

  return undefined;
}

/** 从文本块中提取第一个匹配组的值 */
function extractMatch(html: string, regex: RegExp): string | undefined {
  const match = html.match(regex);
  return match ? cleanText(match[1]) : undefined;
}

/**
 * 从量子位分类页 HTML 中解析文章列表。
 * 每个文章块以 <div class="picture_text"> 开头。
 */
export function parseArticles(html: string, category?: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const seenUrls = new Set<string>();

  // 按 article 块起始标记切片，第一段是列表前的 HTML，跳过
  const marker = /<div\b[^>]*\bclass=["'][^"']*\bpicture_text\b[^"']*["'][^>]*>/gi;
  const parts = html.split(marker);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    // 文章链接：优先 .text_box h4 a，回退 .picture a
    const titleLinkMatch = part.match(
      /<div\b[^>]*\bclass=["'][^"']*\btext_box\b[^"']*["'][^>]*>[\s\S]*?<h4[^>]*>\s*<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h4>/i,
    );
    const pictureLinkMatch = part.match(
      /<div\b[^>]*\bclass=["'][^"']*\bpicture\b[^"']*["'][^>]*>[\s\S]*?<a\s+[^>]*href=["']([^"']+)["'][^>]*>/i,
    );
    const url = titleLinkMatch?.[1] ?? pictureLinkMatch?.[1];
    if (!url) continue;

    const absoluteUrl = url.startsWith('http') ? url : `https://www.qbitai.com${url}`;
    if (seenUrls.has(absoluteUrl)) continue;
    seenUrls.add(absoluteUrl);

    // 标题
    const title = titleLinkMatch ? cleanText(titleLinkMatch[2]) : '';
    if (!title) continue;

    // 封面图
    let imageUrl: string | undefined;
    const imgMatch = part.match(
      /<div\b[^>]*\bclass=["'][^"']*\bpicture\b[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/i,
    );
    if (imgMatch) {
      const src = imgMatch[1];
      imageUrl = src.startsWith('//') ? `https:${src}` : src;
    }

    // 摘要：.text_box 下第一个非空的 <p> 文本
    let snippet: string | undefined;
    const textBoxMatch = part.match(
      /<div\b[^>]*\bclass=["'][^"']*\btext_box\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    if (textBoxMatch) {
      const textBox = textBoxMatch[1];
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pRegex.exec(textBox)) !== null) {
        const content = cleanText(pMatch[1]);
        if (content && content !== title) {
          snippet = content;
          break;
        }
      }
    }

    // 发布时间
    let publishedAt: string | undefined;
    const timeText = extractMatch(
      part,
      /<span\b[^>]*\bclass=["'][^"']*\btime\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    );
    if (timeText) {
      publishedAt = parseRelativeTime(timeText);
    }

    // 作者
    let author: string | undefined;
    const authorMatch = part.match(
      /<span\b[^>]*\bclass=["'][^"']*\bauthor\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    );
    if (authorMatch) {
      author = cleanText(authorMatch[1].replace(/<a[^>]*>[\s\S]*?<\/a>/gi, '')) || undefined;
    }

    articles.push({
      id: hash(absoluteUrl),
      title,
      url: absoluteUrl,
      source: author || '量子位',
      snippet,
      publishedAt,
      category,
      imageUrl,
    });
  }

  return articles;
}

/** 列出所有可用分类 */
export function listCategories(): string[] {
  return Object.keys(CATEGORIES);
}
