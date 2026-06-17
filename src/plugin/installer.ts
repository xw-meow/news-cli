import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execSync, execFileSync } from 'node:child_process';
import { NewsCliError } from '../core/types.js';
import { fetchBinary } from '../core/fetcher.js';

/** Validate npm package name to prevent command injection */
function isValidPackageName(name: string): boolean {
  return /^@?[a-zA-Z0-9][a-zA-Z0-9._-]*(\/[a-zA-Z0-9][a-zA-Z0-9._-]*)?$/.test(name);
}

export interface InstallOptions {
  /** 安装目标目录的基路径：局部 = process.cwd()，全局 = ~ */
  basePath: string;
  /** 是否强制覆盖 */
  force: boolean;
}

/** 判断字符串是否是 URL */
function isURL(target: string): boolean {
  return /^https?:\/\//.test(target);
}

/** 从 URL 路径提取文件名（不含查询参数） */
function filenameFromURL(url: string): string {
  try {
    const { pathname } = new URL(url);
    return basename(pathname) || 'plugin';
  } catch {
    return 'plugin';
  }
}

/** 从文件名推断插件名：foo.js → foo, bar.zip → bar */
function pluginNameFromFile(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return filename;
  return filename.slice(0, dot);
}


/** 解压 zip 到目标目录，处理 GitHub 嵌套目录 */
function extractZip(zipPath: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });

  let listing: string;
  try {
    listing = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf-8' });
  } catch {
    throw new NewsCliError('Failed to read zip file', 'PLUGIN_INSTALL_FAILED');
  }

  const entries = listing.trim().split('\n').filter(Boolean);
  if (entries.length === 0) {
    throw new NewsCliError('Zip file is empty', 'PLUGIN_INSTALL_FAILED');
  }

  // 检查是否所有条目都在同一顶层目录下（如 repo-branch/...）
  const firstSlash = entries[0].indexOf('/');
  let stripPrefix = '';
  if (firstSlash > 0) {
    const topDir = entries[0].slice(0, firstSlash);
    if (entries.every((e) => e.startsWith(topDir + '/') || e === topDir + '/')) {
      stripPrefix = topDir + '/';
    }
  }

  if (stripPrefix) {
    execFileSync('unzip', ['-o', zipPath, '-d', destDir], { encoding: 'utf-8' });
    const nestedDir = join(destDir, stripPrefix.replace(/\/$/, ''));
    const filesInNested = readdirSync(nestedDir);
    for (const f of filesInNested) {
      renameSync(join(nestedDir, f), join(destDir, f));
    }
    rmSync(nestedDir, { recursive: true, force: true });
  } else {
    execFileSync('unzip', ['-o', zipPath, '-d', destDir], { encoding: 'utf-8' });
  }
}

/** 在解压后的目录中查找入口文件 */
function findEntryFile(dir: string, pluginName: string): string | null {
  const candidates = ['index.js', 'plugin.js', `${pluginName}.js`];
  // Also check package.json "main"
  const pkgPath = join(dir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.main) {
        candidates.unshift(pkg.main);
      }
    } catch {
      // ignore
    }
  }

  for (const c of candidates) {
    const fp = join(dir, c);
    if (existsSync(fp)) return fp;
  }

  // 递归查找 (最多 2 层)
  function searchRecursive(currentDir: string, depth: number): string | null {
    if (depth > 2) return null;
    for (const c of ['index.js', 'plugin.js']) {
      const fp = join(currentDir, c);
      if (existsSync(fp)) return fp;
    }
    let subEntries: string[];
    try {
      subEntries = readdirSync(currentDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      return null;
    }
    for (const sub of subEntries) {
      const found = searchRecursive(join(currentDir, sub), depth + 1);
      if (found) return found;
    }
    return null;
  }

  return searchRecursive(dir, 1);
}

/**
 * 安装插件：根据 target 自动判断 URL 还是 npm。
 */
export async function installPlugin(
  target: string,
  opts: InstallOptions,
): Promise<string /* plugin name */> {
  if (isURL(target)) {
    return installFromURL(target, opts);
  }
  return installFromNpm(target, opts);
}

export async function installFromURL(url: string, opts: InstallOptions): Promise<string> {
  const filename = filenameFromURL(url);
  const pluginName = pluginNameFromFile(filename);
  const pluginDir = join(opts.basePath, '.news-plugins', pluginName);

  if (existsSync(pluginDir) && !opts.force) {
    throw new NewsCliError(
      `Plugin "${pluginName}" already installed. Use --force to overwrite.`,
      'PLUGIN_ALREADY_INSTALLED',
    );
  }

  if (opts.force && existsSync(pluginDir)) {
    rmSync(pluginDir, { recursive: true, force: true });
  }

  mkdirSync(pluginDir, { recursive: true });

  const isZip = filename.endsWith('.zip');
  const downloadPath = join(pluginDir, isZip ? 'plugin.zip' : filename);

  // 下载（使用共享 fetcher 基础设施：重试 + 超时 + UA）
  let buffer: Buffer;
  try {
    buffer = await fetchBinary(url, 30000);
  } catch (err) {
    // 下载失败时清理
    if (existsSync(pluginDir)) {
      rmSync(pluginDir, { recursive: true, force: true });
    }
    throw err;
  }
  writeFileSync(downloadPath, buffer);

  if (isZip) {
    extractZip(downloadPath, pluginDir);
    rmSync(downloadPath, { force: true });
    const entry = findEntryFile(pluginDir, pluginName);
    if (!entry) {
      rmSync(pluginDir, { recursive: true, force: true });
      throw new NewsCliError(
        `Cannot determine entry point in zip. Expected index.js, plugin.js, or ${pluginName}.js.`,
        'PLUGIN_INSTALL_FAILED',
      );
    }
  }

  // 确保有 package.json（zip 可能自带）
  const pkgPath = join(pluginDir, 'package.json');
  if (!existsSync(pkgPath)) {
    writeFileSync(
      pkgPath,
      JSON.stringify(
        {
          name: pluginName,
          version: '0.1.0',
          type: 'module',
          main: isZip ? undefined : filename,
          'news-plugin': { source: url },
        },
        null,
        2,
      ),
    );
  } else {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      pkg['news-plugin'] = { source: url };
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    } catch {
      // ignore
    }
  }

  return pluginName;
}

export async function installFromNpm(packageName: string, opts: InstallOptions): Promise<string> {
  if (!isValidPackageName(packageName)) {
    throw new NewsCliError(
      `Invalid npm package name: "${packageName}"`,
      'INVALID_OPTION',
    );
  }

  const pluginName = packageName.replace(/^@/, '').replace(/\//, '-');
  const pluginDir = join(opts.basePath, '.news-plugins', pluginName);

  if (existsSync(pluginDir) && !opts.force) {
    throw new NewsCliError(
      `Plugin "${pluginName}" already installed. Use --force to overwrite.`,
      'PLUGIN_ALREADY_INSTALLED',
    );
  }

  if (opts.force && existsSync(pluginDir)) {
    rmSync(pluginDir, { recursive: true, force: true });
  }

  mkdirSync(pluginDir, { recursive: true });

  try {
    execSync('npm init -y', { cwd: pluginDir, stdio: 'pipe' });
  } catch (err) {
    rmSync(pluginDir, { recursive: true, force: true });
    throw new NewsCliError(
      `npm init failed: ${err instanceof Error ? err.message : String(err)}`,
      'PLUGIN_INSTALL_FAILED',
    );
  }

  try {
    execSync(`npm install ${packageName}`, { cwd: pluginDir, stdio: 'pipe' });
  } catch (err) {
    rmSync(pluginDir, { recursive: true, force: true });
    throw new NewsCliError(
      `npm install failed: ${err instanceof Error ? err.message : String(err)}`,
      'PLUGIN_INSTALL_FAILED',
    );
  }

  const pkgPath = join(pluginDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.type = pkg.type || 'module';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  writeFileSync(
    join(pluginDir, 'index.js'),
    `// Auto-generated by news-cli — wraps npm package "${packageName}"
export { plugin } from '${packageName}';\n`,
  );

  return pluginName;
}
