import { Command } from 'commander';
import { getSource, listSources } from './core/registry.js';
import { formatOutput } from './core/formatter.js';
import { NewsCliError } from './core/types.js';
import { error as logError } from './utils/logger.js';
import { registerPluginCommands } from './plugin/cli.js';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('news')
    .description('Fetch news from multiple sources')
    .version('0.1.0');

  // news list — 列出所有可用源
  program
    .command('list')
    .description('List all available news sources')
    .option('--json', 'Output as JSON')
    .action((opts: { json?: boolean }) => {
      const sources = listSources();

      if (opts.json) {
        const data = sources.map((s) => ({ name: s.name, description: s.description }));
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
        return;
      }

      if (sources.length === 0) {
        process.stdout.write('(no sources available)\n');
        return;
      }

      const B = '\x1b[1m';
      const G = '\x1b[90m';
      const C = '\x1b[36m';
      const R = '\x1b[0m';
      const D = `${G}—${R}`;

      const nameWidth = Math.max(...sources.map((s) => s.name.length));
      const prefixWidth = nameWidth + 4;

      for (const s of sources) {
        const nameCol = `  ${B}${C}${s.name}${R}`;
        const padding = prefixWidth - s.name.length - 2;
        process.stdout.write(`${nameCol}${' '.repeat(Math.max(padding, 2))}${D} ${s.description}\n`);
      }

      process.stdout.write(`\n${G}---${R}\n`);
      process.stdout.write(`${G}当前已收录 ${B}${sources.length}${R}${G} 个新闻源${R}\n`);
    });

  // news categories <source> — 列出某个源的分类
  program
    .command('categories <source>')
    .description('List categories for a news source')
    .action(async (sourceName: string) => {
      try {
        const source = getSource(sourceName);
        if (!source) {
          throw new NewsCliError(
            `Unknown source "${sourceName}". Run "news list" to see available sources.`,
            'SOURCE_NOT_FOUND',
          );
        }
        const cats = await source.listCategories();
        if (cats.length === 0) {
          process.stdout.write('(no categories)\n');
        } else {
          for (const c of cats) {
            process.stdout.write(`${c}\n`);
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // news get <source> [options] — 抓取新闻
  program
    .command('get <source>')
    .description('Fetch news from a source')
    .option('-c, --category <cat>', 'Filter by category')
    .option('-k, --keyword <keywords>', 'Search keywords (comma-separated = OR)')
    .option('-l, --limit <num>', 'Max articles', (v) => parseInt(v, 10))
    .option('--json', 'Output as JSON')
    .action(async (sourceName: string, opts: {
      category?: string;
      keyword?: string;
      limit?: number;
      json?: boolean;
    }) => {
      try {
        const source = getSource(sourceName);
        if (!source) {
          throw new NewsCliError(
            `Unknown source "${sourceName}". Run "news list" to see available sources.`,
            'SOURCE_NOT_FOUND',
          );
        }

        if (opts.limit !== undefined && (isNaN(opts.limit) || opts.limit < 1)) {
          throw new NewsCliError('--limit must be a positive number', 'INVALID_OPTION');
        }

        const articles = await source.fetch({
          category: opts.category,
          keyword: opts.keyword,
          limit: opts.limit,
        });

        const output = formatOutput(articles, { json: opts.json ?? false });
        process.stdout.write(output + '\n');
      } catch (err) {
        handleError(err);
      }
    });

  // news plugin — 插件管理
  registerPluginCommands(program);

  return program;
}

function handleError(err: unknown): never {
  if (err instanceof NewsCliError) {
    logError(err.message);
    process.exit(err.exitCode);
  }

  logError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
