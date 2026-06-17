import { createHash } from 'node:crypto';
import { parse as parseJS, type Node } from 'acorn';
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

/* ── AST 遍历辅助 ── */

/** 浅浅遍历 AST，找到第一个 targetVar = [...] 的数组范围 [start, end] */
function findArrayRange(
  ast: Node,
  targetVar: string,
  code: string,
): [number, number] | null {
  function walk(node: unknown, parentType?: string): [number, number] | null {
    if (!node || typeof node !== 'object') return null;
    const n = node as Record<string, unknown>;

    // 处理 `targetVar = [...]` 形式的 ExpressionStatement
    if (
      n.type === 'AssignmentExpression' &&
      (n.left as Record<string, unknown>)?.type === 'Identifier' &&
      (n.left as Record<string, unknown>)?.name === targetVar &&
      (n.right as Record<string, unknown>)?.type === 'ArrayExpression'
    ) {
      const right = n.right as Record<string, unknown>;
      return (right as { range: [number, number] }).range;
    }

    // 处理 `var targetVar = [...]` 形式（以防万一）
    if (
      n.type === 'VariableDeclarator' &&
      (n.id as Record<string, unknown>)?.type === 'Identifier' &&
      (n.id as Record<string, unknown>)?.name === targetVar &&
      (n.init as Record<string, unknown>)?.type === 'ArrayExpression'
    ) {
      const init = n.init as Record<string, unknown>;
      return (init as { range: [number, number] }).range;
    }

    // 遍历子节点
    for (const key of Object.keys(n)) {
      if (key === 'parent') continue;
      const child = n[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          const result = walk(item, n.type as string);
          if (result) return result;
        }
      } else if (child && typeof child === 'object') {
        const result = walk(child, n.type as string);
        if (result) return result;
      }
    }

    return null;
  }

  return walk(ast);
}

/* ── 解析函数 ── */

/**
 * 从 HTML 中提取指定 script 变量（headList / latestList）的 JSON 数组。
 * 使用 acorn 做 AST 级 JS 解析，100% 精确处理字符串内嵌 `]`、模板字符串等边界情况。
 */
export function extractList(html: string, varName: string): YicaiNewsItem[] {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const code = scriptMatch[1];

    let ast: Node;
    try {
      ast = parseJS(code, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        ranges: true,
      }) as unknown as Node;
    } catch {
      continue;
    }

    const range = findArrayRange(ast, varName, code);
    if (range) {
      try {
        const jsonStr = code.slice(range[0], range[1]);
        return JSON.parse(jsonStr) as YicaiNewsItem[];
      } catch {
        return [];
      }
    }
  }

  return [];
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
