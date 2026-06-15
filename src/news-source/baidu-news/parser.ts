import { parse as htmlParse } from 'node-html-parser';
import { createHash } from 'node:crypto';
import { NewsCliError } from '../../core/types.js';
import type { NewsArticle } from '../../core/types.js';

/**
 * 解析百度新闻 HTML → NewsArticle[]
 * @param html - 百度新闻页面 HTML
 * @param category - 新闻分类
 * @param baseURL - 页面基地址，用于补全相对链接
 */
export function parseHTML(html: string, category: string, baseURL: string): NewsArticle[] {
  let root: ReturnType<typeof htmlParse>;
  try {
    root = htmlParse(html);
  } catch {
    throw new NewsCliError('Failed to parse Baidu News HTML', 'PARSE_FAILED');
  }

  const articles: NewsArticle[] = [];

  // 遍历所有链接，提取看起来像新闻的条目
  const links = root.querySelectorAll('a');
  const seen = new Set<string>();

  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;

    // 过滤非新闻链接
    if (href.startsWith('javascript:')) continue;
    if (href === '#' || href.startsWith('#')) continue;
    // 跳过百度站内搜索链接（热搜侧边栏，非真实新闻）
    if (href.includes('baidu.com/s?') && href.includes('wd=')) continue;

    const title = link.text.trim();
    if (!title || title.length < 6 || title.length > 200) continue;

    // 跳过导航/UI文字
    const navTexts = new Set([
      '首页', '下一页', '上一页', '登录', '注册', '更多', '更多>',
      '返回首页', '百度首页', '换一换', '换一换', '刷新',
      '设置', '意见反馈', '投诉', '举报', '分享', '收藏',
      '查看全部', '加载更多', '展开', '收起', '搜索', '取消',
    ]);
    if (navTexts.has(title)) continue;
    if (title.startsWith('')) continue; // 图标字体

    const fullURL = resolveURL(href, baseURL);
    const id = hash(fullURL);

    if (seen.has(id)) continue;
    seen.add(id);

    // 尝试从父节点提取来源和时间
    const parent = link.closest('div, li, .result, .news-item');
    const source = extractSource(parent ?? root, link);
    const time = extractTime(parent ?? root);
    const snippet = extractSnippet(parent ?? root, title);

    articles.push({
      id,
      title,
      url: fullURL,
      source: source ?? '百度新闻',
      snippet,
      publishedAt: time ? parseChineseTime(time) : undefined,
      category,
    });
  }

  return articles;
}

/** 从文本中提取来源名 */
function extractSource(parent: ReturnType<typeof htmlParse>, _link: ReturnType<typeof htmlParse>): string | undefined {
  // 常见来源容器选择器
  const sourceEl = parent.querySelector('.c-author, .source, [class*="source"], [class*="author"], [class*="news-source"], span');
  if (sourceEl) {
    const text = sourceEl.text.trim();
    if (text && isValidSource(text)) {
      return text;
    }
  }
  return undefined;
}

/** 过滤明显不是来源名的文本（时间、数字排名等） */
function isValidSource(text: string): boolean {
  if (text.length > 30 || text.length === 1) return false;
  // 纯数字（排名）
  if (/^\d+$/.test(text)) return false;
  // 时间格式
  if (/\d{4}[年/-]/.test(text)) return false;
  if (/(\d+)(分钟|小时|天)前/.test(text)) return false;
  // unicode 图标字符
  if (/[-]/.test(text)) return false;
  return true;
}

/** 从文本中提取时间 */
function extractTime(parent: ReturnType<typeof htmlParse>): string | undefined {
  const timeEl = parent.querySelector('.c-time, time, [class*="time"], [class*="date"]');
  if (timeEl) {
    const text = timeEl.text.trim();
    if (text) return text;
  }

  // 正则兜底：匹配中文时间格式 "2024年06月15日 10:30" 或 "6小时前"
  const text = parent.text;
  const timeMatch = text.match(/(\d{4}年\d{2}月\d{2}日\s*\d{2}:\d{2}|\d+[分钟小时天]前)/);
  return timeMatch?.[1];
}

/** 从父节点提取摘要 */
function extractSnippet(parent: ReturnType<typeof htmlParse>, title: string): string | undefined {
  const snippetEl = parent.querySelector('.c-summary, .summary, [class*="summary"], [class*="desc"], p');
  if (snippetEl) {
    const text = snippetEl.text.trim();
    if (text && text !== title && text.length > 5) {
      return text.slice(0, 200);
    }
  }
  return undefined;
}

/** 解析中文时间格式为 ISO 字符串 */
function parseChineseTime(text: string): string | undefined {
  // "2024年06月15日 10:30"
  const match = text.match(/(\d{4})年(\d{2})月(\d{2})日\s*(\d{2}):(\d{2})/);
  if (match) {
    const [, y, m, d, h, min] = match;
    return new Date(`${y}-${m}-${d}T${h}:${min}:00+08:00`).toISOString();
  }

  // "X小时前" / "X分钟前" / "X天前" — 粗略估算
  const relative = text.match(/(\d+)(小时|分钟|天)前/);
  if (relative) {
    const num = parseInt(relative[1], 10);
    const unit = relative[2];
    const now = Date.now();
    let ms = 0;
    if (unit === '分钟') ms = num * 60 * 1000;
    else if (unit === '小时') ms = num * 3600 * 1000;
    else if (unit === '天') ms = num * 86400 * 1000;
    return new Date(now - ms).toISOString();
  }

  return undefined;
}

/** 补全相对 URL */
function resolveURL(href: string, base: string): string {
  const trimmed = href.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return 'https:' + trimmed;
  }
  if (trimmed.startsWith('/')) {
    return base + trimmed;
  }
  return base + '/' + trimmed;
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}
