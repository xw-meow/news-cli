import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { NewsCliError } from '../core/types.js';
import type { PluginMeta } from './types.js';

const PLUGIN_DIR_NAME = '.news-plugins';

function getLocalDir(): string {
  return resolve(process.cwd(), PLUGIN_DIR_NAME);
}

function getGlobalDir(): string {
  return resolve(process.env.HOME ?? homedir(), PLUGIN_DIR_NAME);
}

/**
 * 列出所有已安装的插件。
 * 如果局部和全局都有同名插件，仅返回局部的（实际生效的那个）。
 */
export function listPlugins(): PluginMeta[] {
  const plugins = new Map<string, PluginMeta>();

  scanDir(getLocalDir(), 'local', plugins);
  scanDir(getGlobalDir(), 'global', plugins);

  return [...plugins.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function scanDir(dir: string, scope: 'local' | 'global', map: Map<string, PluginMeta>): void {
  if (!existsSync(dir)) return;

  let entries: string[];
  try {
    entries = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return;
  }

  for (const name of entries) {
    if (map.has(name)) continue;

    const pluginDir = join(dir, name);
    const pkgPath = join(pluginDir, 'package.json');
    if (!existsSync(pkgPath)) continue;

    let version = 'unknown';
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      version = pkg.version ?? 'unknown';
    } catch {
      // keep unknown
    }

    map.set(name, {
      name,
      version,
      path: pluginDir,
      scope,
      entryFile: join(pluginDir, 'index.js'),
    });
  }
}

/**
 * 卸载插件。
 */
export function uninstallPlugin(name: string, global: boolean): void {
  const baseDir = global ? getGlobalDir() : getLocalDir();
  const pluginDir = join(baseDir, name);

  if (!existsSync(pluginDir)) {
    throw new NewsCliError(
      `Plugin "${name}" not found at ${pluginDir}`,
      'PLUGIN_NOT_FOUND',
    );
  }

  rmSync(pluginDir, { recursive: true, force: true });
}

/**
 * 更新插件。
 */
export async function updatePlugin(name: string, global: boolean): Promise<void> {
  const baseDir = global ? getGlobalDir() : getLocalDir();
  const pluginDir = join(baseDir, name);

  if (!existsSync(pluginDir)) {
    throw new NewsCliError(
      `Plugin "${name}" not found at ${pluginDir}`,
      'PLUGIN_NOT_FOUND',
    );
  }

  const pkgPath = join(pluginDir, 'package.json');
  let sourceUrl: string | undefined;
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      sourceUrl = pkg['news-plugin']?.source;
    } catch {
      // ignore
    }
  }

  if (sourceUrl) {
    // URL-sourced plugin: remove and re-download via installer
    rmSync(pluginDir, { recursive: true, force: true });
    const { installFromURL } = await import('./installer.js');
    await installFromURL(sourceUrl, {
      basePath: global ? dirname(getGlobalDir()) : process.cwd(),
      force: true,
    });
    return;
  }

  // npm plugin: run npm update
  try {
    execSync('npm update', { cwd: pluginDir, stdio: 'inherit' });
  } catch (err) {
    throw new NewsCliError(
      `npm update failed: ${err instanceof Error ? err.message : String(err)}`,
      'PLUGIN_INSTALL_FAILED',
    );
  }
}
