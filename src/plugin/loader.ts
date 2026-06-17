import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Command } from 'commander';
import type { Plugin, PluginRegistry } from './types.js';
import { registerSource } from '../core/registry.js';
import { error as logError } from '../utils/logger.js';

const PLUGIN_DIR_NAME = '.news-plugins';

function getLocalDir(): string {
  return resolve(process.cwd(), PLUGIN_DIR_NAME);
}

function getGlobalDir(): string {
  return resolve(process.env.HOME ?? '~', PLUGIN_DIR_NAME);
}

/**
 * 从指定目录加载所有插件。
 * 返回已加载的插件名集合，用于全局去重。
 */
async function loadFromDir(
  dir: string,
  program: Command,
  registry: PluginRegistry,
  skipNames: Set<string>,
): Promise<Set<string>> {
  const loaded = new Set<string>();

  if (!existsSync(dir)) return loaded;

  let entries: string[];
  try {
    entries = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return loaded;
  }

  for (const name of entries) {
    if (skipNames.has(name)) continue;

    const pluginDir = join(dir, name);
    const pkgPath = join(pluginDir, 'package.json');
    if (!existsSync(pkgPath)) continue;

    let pkg: { main?: string };
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    } catch {
      logError(`Plugin "${name}": invalid package.json, skipping`);
      continue;
    }

    const entryFile = pkg.main ? join(pluginDir, pkg.main) : join(pluginDir, 'index.js');
    if (!existsSync(entryFile)) {
      logError(`Plugin "${name}": entry file not found: ${entryFile}, skipping`);
      continue;
    }

    try {
      const mod = await import(pathToFileURL(entryFile).href);
      const plugin: Plugin | undefined = mod?.plugin;
      if (!plugin || typeof plugin.register !== 'function') {
        logError(`Plugin "${name}": missing "plugin" export with register(), skipping`);
        continue;
      }
      await plugin.register(program, registry);
      loaded.add(name);
    } catch (err: unknown) {
      logError(
        `Plugin "${name}": load failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return loaded;
}

/**
 * 加载所有插件：先局部再全局，局部覆盖全局同名插件。
 * 失败不阻塞 CLI 启动。
 */
export async function loadPlugins(program: Command): Promise<void> {
  const registry: PluginRegistry = {
    registerSource(source) {
      registerSource(source);
    },
  };

  const localNames = await loadFromDir(getLocalDir(), program, registry, new Set());
  await loadFromDir(getGlobalDir(), program, registry, localNames);
}
