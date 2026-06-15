import Table from 'cli-table3';
import type { NewsArticle } from './types.js';

interface FormatOptions {
  json: boolean;
}

/** 将 NewsArticle[] 格式化为终端表格或 JSON 字符串 */
export function formatOutput(articles: NewsArticle[], opts: FormatOptions): string {
  if (opts.json) {
    return JSON.stringify(articles, null, 2);
  }

  if (articles.length === 0) {
    return '(no news)';
  }

  const table = new Table({
    head: ['#', 'Title', 'Source', 'Time'],
    colWidths: [4, 60, 22, 18],
    wordWrap: true,
    style: { head: ['bold'] },
  });

  articles.forEach((a, i) => {
    table.push([
      String(i + 1),
      a.title,
      a.source,
      a.publishedAt ?? '-',
    ]);
  });

  return table.toString();
}
