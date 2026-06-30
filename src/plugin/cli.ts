import { homedir } from 'node:os';
import type { Command } from 'commander';
import { installPlugin } from './installer.js';
import { listPlugins, uninstallPlugin, updatePlugin } from './manager.js';
import { NewsCliError } from '../core/types.js';
import { error as logError } from '../utils/logger.js';

export function registerPluginCommands(program: Command): void {
  const pluginCmd = program
    .command('plugin')
    .description('Manage plugins');

  // news plugin install <target>
  pluginCmd
    .command('install <target>')
    .description('Install a plugin (URL or npm package)')
    .option('-g, --global', 'Install globally (~/.news-plugins)')
    .option('--force', 'Overwrite existing installation')
    .action(async (target: string, opts: { global?: boolean; force?: boolean }) => {
      try {
        const basePath = opts.global
          ? (process.env.HOME ?? homedir())
          : process.cwd();
        const name = await installPlugin(target, {
          basePath,
          force: opts.force ?? false,
        });
        process.stdout.write(`Plugin "${name}" installed successfully.\n`);
      } catch (err) {
        handlePluginError(err);
      }
    });

  // news plugin uninstall <name>
  pluginCmd
    .command('uninstall <name>')
    .description('Uninstall a plugin')
    .option('-g, --global', 'Uninstall from global (~/.news-plugins)')
    .action((name: string, opts: { global?: boolean }) => {
      try {
        uninstallPlugin(name, opts.global ?? false);
        process.stdout.write(`Plugin "${name}" uninstalled.\n`);
      } catch (err) {
        handlePluginError(err);
      }
    });

  // news plugin list
  pluginCmd
    .command('list')
    .description('List installed plugins')
    .option('--json', 'Output as JSON')
    .action((opts: { json?: boolean }) => {
      const plugins = listPlugins();

      if (opts.json) {
        process.stdout.write(JSON.stringify(plugins, null, 2) + '\n');
        return;
      }

      if (plugins.length === 0) {
        process.stdout.write('(no plugins installed)\n');
        return;
      }

      const B = '\x1b[1m';
      const G = '\x1b[90m';
      const C = '\x1b[36m';
      const Y = '\x1b[33m';
      const R = '\x1b[0m';

      const nameWidth = Math.max(...plugins.map((p) => p.name.length), 4);
      const verWidth = Math.max(...plugins.map((p) => p.version.length), 7);

      for (const p of plugins) {
        const nameCol = `  ${B}${C}${p.name.padEnd(nameWidth)}${R}`;
        const verCol = `v${p.version.padEnd(verWidth)}`;
        const scopeTag = p.scope === 'global' ? `${Y}global${R}` : 'local ';
        process.stdout.write(`${nameCol}  ${verCol}  ${scopeTag}  ${G}${p.path}${R}\n`);
      }

      process.stdout.write(`\n${G}---${R}\n`);
      process.stdout.write(`${G}${plugins.length} plugin(s)${R}\n`);
    });

  // news plugin update <name>
  pluginCmd
    .command('update <name>')
    .description('Update an installed plugin')
    .option('-g, --global', 'Update global plugin (~/.news-plugins)')
    .action(async (name: string, opts: { global?: boolean }) => {
      try {
        await updatePlugin(name, opts.global ?? false);
        process.stdout.write(`Plugin "${name}" updated.\n`);
      } catch (err) {
        handlePluginError(err);
      }
    });
}

function handlePluginError(err: unknown): never {
  if (err instanceof NewsCliError) {
    logError(err.message);
    process.exit(err.exitCode);
  }
  logError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
