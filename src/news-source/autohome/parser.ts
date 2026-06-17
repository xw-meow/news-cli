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

/** 规范化文章 URL：去 #pvareaid 片段、补全 https: 前缀 */
function normalizeUrl(href: string): string {
  let url = href.replace(/#pvareaid=\d+.*$/, '');
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }
  return url;
}

/** 解析相对时间（X分钟前 / X小时前 / X天前）为 ISO 8601 */
function parseRelativeTime(text: string): string | undefined {
  const now = Date.now();

  // X分钟前
  let m = text.match(/(\d+)\s*分钟前/);
  if (m) {
    return new Date(now - Number(m[1]) * 60_000).toISOString();
  }

  // X小时前
  m = text.match(/(\d+)\s*小时前/);
  if (m) {
    return new Date(now - Number(m[1]) * 3_600_000).toISOString();
  }

  // X天前
  m = text.match(/(\d+)\s*天前/);
  if (m) {
    return new Date(now - Number(m[1]) * 86_400_000).toISOString();
  }

  return undefined;
}

/** 去掉摘要开头的 [来源标签] */
function cleanSnippet(text: string): string {
  return text.replace(/^\[[^\]]*\]\s*/, '').trim();
}

/** 匹配汽车之家文章 URL 的正则 */
const ARTICLE_URL_RE = /\/\/www\.autohome\.com\.cn\/[^"]*\.html/i;

/**
 * 从 HTML 中解析文章列表。
 * 每个文章块是 <li> 内含 <a> 包裹的标题/图片/时间/摘要。
 */
export function parseArticles(html: string, category?: string): NewsArticle[] {
  const articles: NewsArticle[] = [];

  const liRegex = /(<li\b[^>]*>[\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = liRegex.exec(html)) !== null) {
    const block = liMatch[1];

    // 必须包含文章链接
    const aMatch = block.match(/<a\s[^>]*href="([^"]*)"[^>]*>/i);
    if (!aMatch) continue;

    const href = aMatch[1];
    if (!ARTICLE_URL_RE.test(href)) continue;

    // 跳过侧边栏条目（用 <h4> 标识）
    if (/<h4[\s>]/i.test(block)) continue;

    const url = normalizeUrl(href);

    // 标题：优先 <h2>/<h3>（焦点文章用 h2，普通文章用 h3），回退到第一个 <p>
    let title = '';
    const headingMatch = block.match(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/i);
    if (headingMatch) {
      title = decodeEntities(stripHtml(headingMatch[2])).trim();
    } else {
      const pMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch) {
        title = cleanSnippet(decodeEntities(stripHtml(pMatch[1])).trim());
      }
    }

    if (!title) continue;

    // 封面图
    let imageUrl: string | undefined;
    const imgMatch = block.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    if (imgMatch) {
      const src = imgMatch[1];
      imageUrl = src.startsWith('//') ? 'https:' + src : src;
    }

    // 相对时间（优先）；焦点文章用 data-operation-extend 中的绝对时间 dt 回退
    let publishedAt: string | undefined;
    const timeMatch = block.match(/(\d+)\s*(?:分钟|小时|天)前/);
    if (timeMatch) {
      publishedAt = parseRelativeTime(timeMatch[0]);
    } else {
      const dtMatch = block.match(/"dt":"([^"]+)"/);
      if (dtMatch) {
        const d = new Date(dtMatch[1] + '+08:00');
        if (!isNaN(d.getTime())) {
          publishedAt = d.toISOString();
        }
      }
    }

    // 摘要：从 <p> 文本中取，去掉 [来源] 前缀，跳过与标题相同的
    let snippet: string | undefined;
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pRegex.exec(block)) !== null) {
      const content = decodeEntities(stripHtml(pMatch[1])).trim();
      const cleaned = cleanSnippet(content);
      if (cleaned && cleaned !== title) {
        snippet = cleaned;
        break;
      }
    }

    articles.push({
      id: hash(url),
      title,
      url,
      source: '汽车之家',
      snippet,
      publishedAt,
      category,
      imageUrl,
    });
  }

  return articles;
}
