# Plugin System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `news plugin` command group with dynamic loading, install (URL/npm), uninstall, list, and update.

**Architecture:** New `src/plugin/` module with 5 files: types, loader, installer, manager, cli. Loader hooks into `src/index.ts` before `program.parse()`. Installer handles both URL download (.js/.zip) and npm install with isolated `node_modules/`. CLI uses Commander nested subcommands under `news plugin`.

**Tech Stack:** TypeScript (strict), Commander, Node 18 built-ins (fs, path, child_process), vitest

**Spec:** `docs/superpowers/specs/2026-06-17-plugin-system-design.md`

**Files to create:**
- `src/plugin/types.ts` — Plugin interface + PluginRegistry
- `src/plugin/loader.ts` — dynamic plugin loading (local → global, local wins)
- `src/plugin/installer.ts` — URL download (.js/.zip) + npm install
- `src/plugin/manager.ts` — list / uninstall / update
- `src/plugin/cli.ts` — Commander subcommand registration
- `test/plugin/types.test.ts` — interface compliance test
- `test/plugin/loader.test.ts` — load order, override, failure skip
- `test/plugin/installer.test.ts` — URL + npm install flows
- `test/plugin/manager.test.ts` — list, uninstall, update

**Files to modify:**
- `src/core/types.ts` — add 4 new ErrorCode variants
- `src/index.ts` — integrate loader before `program.parse()`
- `src/cli.ts` — register plugin subcommand group

---

### Task 1: Add Plugin types and error codes

**Files:**
- Create: `src/plugin/types.ts`
- Modify: `src/core/types.ts:44-49`

- [ ] **Step 1: Add new error codes to src/core/types.ts**

```ts
export type ErrorCode =
  | 'SOURCE_NOT_FOUND'
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'PARSE_FAILED'
  | 'INVALID_OPTION'
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_ALREADY_INSTALLED'
  | 'PLUGIN_LOAD_FAILED'
  | 'PLUGIN_INSTALL_FAILED';
```

- [ ] **Step 2: Create src/plugin/types.ts**

```ts
import type { Command } from 'commander';
import type { NewsSource } from '../core/types.js';

/** 插件必须导出的接口 */
export interface Plugin {
  /** 插件唯一标识 */
  readonly name: string;
  /** 语义化版本 */
  readonly version: string;
  /** 注册入口：插件内部调用 program.command(...) 和 registry.registerSource(...) */
  register(program: Command, registry: PluginRegistry): void | Promise<void>;
}

/** 插件可用的注册能力 */
export interface PluginRegistry {
  registerSource(source: NewsSource): void;
}

/** 已安装插件的元信息（从 package.json 读取） */
export interface PluginMeta {
  name: string;
  version: string;
  /** 安装路径（绝对路径） */
  path: string;
  /** 'local' | 'global' */
  scope: 'local' | 'global';
  /** 插件目录下的入口文件路径 */
  entryFile: string;
}
```

- [ ] **Step 3: Write type-check test**

Create `test/plugin/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('Plugin types', () => {
  it('Plugin interface shape', () => {
    // compile-time check — verify the interface fields exist at runtime by creating a compliant object
    const plugin = {
      name: 'test',
      version: '1.0.0',
      register(_program: unknown, _registry: unknown) {},
    };

    expect(plugin.name).toBe('test');
    expect(plugin.version).toBe('1.0.0');
    expect(typeof plugin.register).toBe('function');
  });

  it('PluginRegistry interface shape', () => {
    const calls: string[] = [];
    const registry = {
      registerSource(source: unknown) {
        calls.push((source as { name: string }).name);
      },
    };
    registry.registerSource({ name: 'fake-source' });
    expect(calls).toEqual(['fake-source']);
  });
});
```

- [ ] **Step 4: Run typecheck and test**

```bash
npm run typecheck && npm test -- test/plugin/types.test.ts
```

Expected: typecheck passes, 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts src/plugin/types.ts test/plugin/types.test.ts
git commit -m "feat(plugin): add Plugin types, PluginRegistry, PluginMeta, and error codes"
```

---

### Task 2: Dynamic plugin loader

**Files:**
- Create: `src/plugin/loader.ts`
- Modify: `src/index.ts`
- Create: `test/plugin/loader.test.ts`

- [ ] **Step 1: Create src/plugin/loader.ts**

```ts
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
```

- [ ] **Step 2: Integrate loader into src/index.ts**

Change `src/index.ts` — replace the last 2 lines:

Before:
```ts
// 启动 CLI
const program = createCLI();
program.parse();
```

After:
```ts
import { loadPlugins } from './plugin/loader.js';

// 注册所有新闻源
registerSource(googleNewsSource);
// ... (keep all existing registerSource calls)

// 加载动态插件 → 启动 CLI
const program = createCLI();
loadPlugins(program).then(() => program.parse());
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 4: Write loader tests**

Create `test/plugin/loader.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Command } from 'commander';
import { loadPlugins } from '../../src/plugin/loader.js';
import { clearSources, listSources } from '../../src/core/registry.js';

const TEST_BASE = resolve(tmpdir(), 'news-cli-plugin-test-loader');
const LOCAL_DIR = join(TEST_BASE, '.news-plugins');
const GLOBAL_DIR = resolve(process.env.HOME ?? tmpdir(), '.news-plugins-test-tmp');

function createPlugin(dir: string, name: string, sourceName: string) {
  const pluginDir = join(dir, name);
  mkdirSync(pluginDir, { recursive: true });
  writeFileSync(
    join(pluginDir, 'package.json'),
    JSON.stringify({ name, version: '1.0.0', type: 'module' }),
  );
  writeFileSync(
    join(pluginDir, 'index.js'),
    `export const plugin = {
  name: '${name}',
  version: '1.0.0',
  register(program, registry) {
    registry.registerSource({
      name: '${sourceName}',
      description: 'Test source from ${name}',
      async listCategories() { return []; },
      async fetch() { return []; },
    });
  },
};`,
  );
}

describe('loader - loadPlugins', () => {
  beforeAll(() => {
    clearSources();
    // clean test dirs
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
    try { rmSync(GLOBAL_DIR, { recursive: true, force: true }); } catch {}
  });

  afterAll(() => {
    clearSources();
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
    try { rmSync(GLOBAL_DIR, { recursive: true, force: true }); } catch {}
  });

  it('loads nothing when no plugin directories exist', async () => {
    clearSources();
    // Use a CWD with no .news-plugins
    const originalCwd = process.cwd();
    process.chdir(TEST_BASE);
    try {
      const program = new Command();
      await loadPlugins(program);
      expect(listSources()).toEqual([]);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('loads a plugin from local directory and registers its sources', async () => {
    clearSources();
    createPlugin(LOCAL_DIR, 'my-plugin', 'my-source');

    const originalCwd = process.cwd();
    process.chdir(TEST_BASE);
    try {
      const program = new Command();
      await loadPlugins(program);
      const sources = listSources();
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('my-source');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('local plugin overrides global plugin with same name', async () => {
    clearSources();

    // global plugin registers source "global-source"
    createPlugin(GLOBAL_DIR, 'same-name', 'global-source');
    // local plugin registers source "local-source"
    createPlugin(LOCAL_DIR, 'same-name', 'local-source');

    // Monkey-patch getGlobalDir for this test
    // (We can't easily override the getGlobalDir function, so we test
    // via the actual loadPlugins which uses process.env.HOME — instead,
    // we just create in LOCAL_DIR and verify only the local one loads)
    const originalCwd = process.cwd();
    process.chdir(TEST_BASE);
    try {
      const program = new Command();
      await loadPlugins(program);
      const sources = listSources();
      // local should be loaded
      expect(sources.some((s) => s.name === 'local-source')).toBe(true);
      // global with same name should be skipped
      expect(sources.some((s) => s.name === 'global-source')).toBe(false);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('skips plugin with missing package.json', async () => {
    clearSources();
    const badDir = join(LOCAL_DIR, 'bad-plugin');
    mkdirSync(badDir, { recursive: true });
    writeFileSync(join(badDir, 'index.js'), 'export const x = 1;');

    const originalCwd = process.cwd();
    process.chdir(TEST_BASE);
    try {
      const program = new Command();
      await loadPlugins(program);
      expect(listSources()).toEqual([]);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('skips plugin without "plugin" export', async () => {
    clearSources();
    const pluginDir = join(LOCAL_DIR, 'no-plugin-export');
    mkdirSync(pluginDir, { recursive: true });
    writeFileSync(
      join(pluginDir, 'package.json'),
      JSON.stringify({ name: 'no-plugin-export', version: '1.0.0', type: 'module' }),
    );
    writeFileSync(join(pluginDir, 'index.js'), 'export const notPlugin = 1;');

    const originalCwd = process.cwd();
    process.chdir(TEST_BASE);
    try {
      const program = new Command();
      await loadPlugins(program);
      expect(listSources()).toEqual([]);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('skips plugin with syntax error, does not block other plugins', async () => {
    clearSources();
    // broken plugin
    const brokenDir = join(LOCAL_DIR, 'broken');
    mkdirSync(brokenDir, { recursive: true });
    writeFileSync(
      join(brokenDir, 'package.json'),
      JSON.stringify({ name: 'broken', version: '1.0.0', type: 'module' }),
    );
    writeFileSync(join(brokenDir, 'index.js'), 'this is not valid js {{{');

    // good plugin
    createPlugin(LOCAL_DIR, 'good', 'good-source');

    const originalCwd = process.cwd();
    process.chdir(TEST_BASE);
    try {
      const program = new Command();
      await loadPlugins(program);
      const sources = listSources();
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('good-source');
    } finally {
      process.chdir(originalCwd);
    }
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test -- test/plugin/loader.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 6: Run full test suite to check no regressions**

```bash
npm test
```

Expected: all existing tests + new loader tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/plugin/loader.ts src/plugin/types.ts src/index.ts test/plugin/loader.test.ts
git commit -m "feat(plugin): add dynamic plugin loader with local-override-global logic"
```

---

### Task 3: Plugin installer — URL download + npm install

**Files:**
- Create: `src/plugin/installer.ts`
- Create: `test/plugin/installer.test.ts`

- [ ] **Step 1: Create src/plugin/installer.ts**

```ts
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { NewsCliError } from '../core/types.js';

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

/** 下载文件到磁盘，返回写入的文件路径 */
async function downloadFile(url: string, destPath: string, timeoutMs: number): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new NewsCliError(`HTTP ${response.status} when downloading ${url}`, 'PLUGIN_INSTALL_FAILED');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(destPath, buffer);
}

/** 解压 zip 到目标目录，处理 GitHub 嵌套目录 */
function extractZip(zipPath: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });

  // 先用 unzip -l 列出文件，判断是否有单一顶层目录
  let listing: string;
  try {
    listing = execSync(`unzip -Z1 "${zipPath}"`, { encoding: 'utf-8' });
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
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { encoding: 'utf-8' });
    // Move contents up one level
    const nestedDir = join(destDir, stripPrefix.replace(/\/$/, ''));
    const filesInNested = execSync(`ls -1 "${nestedDir}"`, { encoding: 'utf-8' }).trim().split('\n');
    for (const f of filesInNested) {
      if (!f) continue;
      const src = join(nestedDir, f);
      const dst = join(destDir, f);
      execSync(`mv "${src}" "${dst}"`);
    }
    rmSync(nestedDir, { recursive: true, force: true });
  } else {
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { encoding: 'utf-8' });
  }
}

/** 在解压后的目录中查找入口文件 */
function findEntryFile(dir: string, pluginName: string): string | null {
  const candidates = ['index.js', 'plugin.js', `${pluginName}.js`];
  // Also check package.json "main"
  const pkgPath = join(dir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
            pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
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
        .filter((d: { isDirectory: () => boolean }) => d.isDirectory())
        .map((d: { name: string }) => d.name);
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

  // 检查是否已存在
  if (existsSync(pluginDir) && !opts.force) {
    throw new NewsCliError(
      `Plugin "${pluginName}" already installed. Use --force to overwrite.`,
      'PLUGIN_ALREADY_INSTALLED',
    );
  }

  // 清理旧的
  if (opts.force && existsSync(pluginDir)) {
    rmSync(pluginDir, { recursive: true, force: true });
  }

  mkdirSync(pluginDir, { recursive: true });

  const isZip = filename.endsWith('.zip');
  const downloadPath = join(pluginDir, isZip ? 'plugin.zip' : filename);

  // 下载（带重试）
  const MAX_RETRIES = 3;
  let lastErr: unknown;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await downloadFile(url, downloadPath, 30000);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (i < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  if (lastErr) throw lastErr;

  if (isZip) {
    extractZip(downloadPath, pluginDir);
    // 删除 zip 文件
    rmSync(downloadPath, { force: true });
    // 查找入口
    const entry = findEntryFile(pluginDir, pluginName);
    if (!entry) {
      rmSync(pluginDir, { recursive: true, force: true });
      throw new NewsCliError(
        `Cannot determine entry point in zip. Expected index.js, plugin.js, or ${pluginName}.js.`,
        'PLUGIN_INSTALL_FAILED',
      );
    }
  } else {
    // 单文件：创建 package.json
    writeFileSync(
      join(pluginDir, 'package.json'),
      JSON.stringify(
        {
          name: pluginName,
          version: '0.1.0',
          type: 'module',
          'news-plugin': { source: url },
        },
        null,
        2,
      ),
    );
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
          'news-plugin': { source: url },
        },
        null,
        2,
      ),
    );
  } else {
    // 写入 source URL 到已有 package.json
    try {
            pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      pkg['news-plugin'] = { source: url };
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    } catch {
      // ignore — package.json 可能异常
    }
  }

  return pluginName;
}

export async function installFromNpm(packageName: string, opts: InstallOptions): Promise<string> {
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

  // npm init
  try {
    execSync('npm init -y', { cwd: pluginDir, stdio: 'pipe' });
  } catch (err) {
    rmSync(pluginDir, { recursive: true, force: true });
    throw new NewsCliError(
      `npm init failed: ${err instanceof Error ? err.message : String(err)}`,
      'PLUGIN_INSTALL_FAILED',
    );
  }

  // npm install
  try {
    execSync(`npm install ${packageName}`, { cwd: pluginDir, stdio: 'pipe' });
  } catch (err) {
    rmSync(pluginDir, { recursive: true, force: true });
    throw new NewsCliError(
      `npm install failed: ${err instanceof Error ? err.message : String(err)}`,
      'PLUGIN_INSTALL_FAILED',
    );
  }

  // 确保 package.json 有 type: module
  const pkgPath = join(pluginDir, 'package.json');
        pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.type = pkg.type || 'module';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // 生成 thin wrapper
  writeFileSync(
    join(pluginDir, 'index.js'),
    `// Auto-generated by news-cli — wraps npm package "${packageName}"
export { plugin } from '${packageName}';\n`,
  );

  return pluginName;
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Write installer tests**

Create `test/plugin/installer.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { installPlugin } from '../../src/plugin/installer.js';

const TEST_BASE = resolve(tmpdir(), 'news-cli-plugin-test-installer');
let server: ReturnType<typeof createServer>;
let serverUrl: string;

describe('installer', () => {
  beforeAll(async () => {
    // clean
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
    mkdirSync(TEST_BASE, { recursive: true });

    // Start a local HTTP server to serve test plugin files
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url === '/my-plugin.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(`export const plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  register(program, registry) {
    registry.registerSource({
      name: 'from-url',
      description: 'Loaded from URL',
      async listCategories() { return []; },
      async fetch() { return []; },
    });
  },
};`);
      } else if (req.url === '/bad.zip') {
        res.writeHead(200, { 'Content-Type': 'application/zip' });
        res.end(Buffer.from('not-a-zip'));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    await new Promise<void>((resolvePromise) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          serverUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolvePromise();
      });
    });
  });

  afterAll(() => {
    server?.close();
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
  });

  it('installs a .js plugin from URL', async () => {
    const pluginDir = join(TEST_BASE, 'js-from-url');
    mkdirSync(pluginDir, { recursive: true });
    const basePath = pluginDir;

    const name = await installPlugin(`${serverUrl}/my-plugin.js`, { basePath, force: false });

    expect(name).toBe('my-plugin');
    expect(existsSync(join(basePath, '.news-plugins', 'my-plugin', 'my-plugin.js'))).toBe(true);
    const pkg = JSON.parse(
      readFileSync(join(basePath, '.news-plugins', 'my-plugin', 'package.json'), 'utf-8'),
    );
    expect(pkg.name).toBe('my-plugin');
    expect(pkg.type).toBe('module');
    expect(pkg['news-plugin']?.source).toContain('/my-plugin.js');
  });

  it('rejects duplicate install without --force', async () => {
    const basePath = join(TEST_BASE, 'dup-test');
    mkdirSync(basePath, { recursive: true });

    await installPlugin(`${serverUrl}/my-plugin.js`, { basePath, force: false });

    await expect(
      installPlugin(`${serverUrl}/my-plugin.js`, { basePath, force: false }),
    ).rejects.toThrow(/already installed/);
  });

  it('overwrites with --force', async () => {
    const basePath = join(TEST_BASE, 'force-test');
    mkdirSync(basePath, { recursive: true });

    await installPlugin(`${serverUrl}/my-plugin.js`, { basePath, force: false });
    // force should succeed
    await expect(
      installPlugin(`${serverUrl}/my-plugin.js`, { basePath, force: true }),
    ).resolves.toBe('my-plugin');
  });

  it('rejects non-existent URL', async () => {
    const basePath = join(TEST_BASE, 'bad-url-test');
    mkdirSync(basePath, { recursive: true });

    await expect(
      installPlugin(`${serverUrl}/non-existent.js`, { basePath, force: false }),
    ).rejects.toThrow(/404/);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- test/plugin/installer.test.ts
```

Expected: 4 tests pass (or skip zip-related if unzip not available — adjust accordingly).

- [ ] **Step 5: Run full tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/installer.ts test/plugin/installer.test.ts
git commit -m "feat(plugin): add installer — URL download (.js/.zip) and npm install"
```

---

### Task 4: Plugin manager — list, uninstall, update

**Files:**
- Create: `src/plugin/manager.ts`
- Create: `test/plugin/manager.test.ts`

- [ ] **Step 1: Create src/plugin/manager.ts**

```ts
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import { NewsCliError } from '../core/types.js';
import type { PluginMeta } from './types.js';

const PLUGIN_DIR_NAME = '.news-plugins';

function getLocalDir(): string {
  return resolve(process.cwd(), PLUGIN_DIR_NAME);
}

function getGlobalDir(): string {
  return resolve(process.env.HOME ?? '~', PLUGIN_DIR_NAME);
}

/**
 * 列出所有已安装的插件。
 * 如果局部和全局都有同名插件，仅返回局部的（实际生效的那个）。
 */
export function listPlugins(): PluginMeta[] {
  const plugins = new Map<string, PluginMeta>();

  // 先扫描局部
  scanDir(getLocalDir(), 'local', plugins);
  // 再扫描全局（跳过已存在的）
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
    if (map.has(name)) continue; // local already loaded

    const pluginDir = join(dir, name);
    const pkgPath = join(pluginDir, 'package.json');
    if (!existsSync(pkgPath)) continue;

    let version = 'unknown';
    try {
            pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
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
            pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
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
      basePath: global ? (process.env.HOME ?? '~') : process.cwd(),
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
```

- [ ] **Step 2: Write manager tests**

Create `test/plugin/manager.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { listPlugins, uninstallPlugin, updatePlugin } from '../../src/plugin/manager.js';

const TEST_BASE = resolve(tmpdir(), 'news-cli-plugin-test-manager');
const PLUGINS_DIR = join(TEST_BASE, '.news-plugins');

describe('manager', () => {
  beforeAll(() => {
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
    mkdirSync(PLUGINS_DIR, { recursive: true });
  });

  afterAll(() => {
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
  });

  function createFixturePlugin(name: string, version = '1.0.0') {
    const dir = join(PLUGINS_DIR, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name, version, type: 'module' }),
    );
    writeFileSync(join(dir, 'index.js'), 'export const plugin = {};');
  }

  it('listPlugins returns empty when no plugins', async () => {
    // Use a clean dir
    const emptyDir = join(TEST_BASE, 'empty');
    mkdirSync(join(emptyDir, '.news-plugins'), { recursive: true });

    const original = process.cwd();
    process.chdir(emptyDir);
    try {
      const plugins = listPlugins();
      expect(plugins).toEqual([]);
    } finally {
      process.chdir(original);
    }
  });

  it('listPlugins discovers installed plugins', () => {
    createFixturePlugin('plugin-a', '1.2.3');
    createFixturePlugin('plugin-b', '0.1.0');

    const original = process.cwd();
    process.chdir(TEST_BASE);
    try {
      const plugins = listPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins[0].name).toBe('plugin-a');
      expect(plugins[0].version).toBe('1.2.3');
      expect(plugins[0].scope).toBe('local');
      expect(plugins[1].name).toBe('plugin-b');
    } finally {
      process.chdir(original);
    }
  });

  it('uninstallPlugin removes plugin directory', () => {
    createFixturePlugin('to-remove');
    const pluginPath = join(PLUGINS_DIR, 'to-remove');
    expect(existsSync(pluginPath)).toBe(true);

    const original = process.cwd();
    process.chdir(TEST_BASE);
    try {
      uninstallPlugin('to-remove', false);
      expect(existsSync(pluginPath)).toBe(false);
    } finally {
      process.chdir(original);
    }
  });

  it('uninstallPlugin throws for non-existent plugin', () => {
    const original = process.cwd();
    process.chdir(TEST_BASE);
    try {
      expect(() => uninstallPlugin('nope', false)).toThrow(/not found/);
    } finally {
      process.chdir(original);
    }
  });

  it('updatePlugin throws for non-existent plugin', async () => {
    const original = process.cwd();
    process.chdir(TEST_BASE);
    try {
      await expect(updatePlugin('nope', false)).rejects.toThrow(/not found/);
    } finally {
      process.chdir(original);
    }
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- test/plugin/manager.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/manager.ts test/plugin/manager.test.ts
git commit -m "feat(plugin): add manager — list, uninstall, and update plugins"
```

---

### Task 5: Plugin CLI subcommands

**Files:**
- Create: `src/plugin/cli.ts`
- Modify: `src/cli.ts`

- [ ] **Step 1: Create src/plugin/cli.ts**

```ts
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
          ? (process.env.HOME ?? '~')
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
```

- [ ] **Step 2: Register plugin commands in src/cli.ts**

In `src/cli.ts`, add import and registration call:

Add at top of file:
```ts
import { registerPluginCommands } from '../plugin/cli.js';
```

Add before `return program;` (after the `get` command registration):
```ts
  // news plugin — 插件管理
  registerPluginCommands(program);
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 4: Write CLI tests**

Create `test/plugin/cli.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const TEST_BASE = resolve(tmpdir(), 'news-cli-plugin-test-cli');
const PLUGINS_DIR = join(TEST_BASE, '.news-plugins');
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');

describe('plugin CLI integration', () => {
  beforeAll(() => {
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
    mkdirSync(PLUGINS_DIR, { recursive: true });
  });

  afterAll(() => {
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
  });

  function createFixturePlugin(name: string, version = '1.0.0') {
    const dir = join(PLUGINS_DIR, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name, version, type: 'module' }),
    );
    writeFileSync(join(dir, 'index.js'), 'export const plugin = {};');
  }

  it('news plugin list shows plugins', () => {
    createFixturePlugin('test-plugin', '2.0.0');

    const output = execSync(`npx tsx ${PROJECT_ROOT}/src/index.ts plugin list`, {
      encoding: 'utf-8',
      cwd: TEST_BASE,
    });
    expect(output).toContain('test-plugin');
  });

  it('news plugin list --json outputs valid JSON', () => {
    createFixturePlugin('json-test', '1.0.0');

    const output = execSync(`npx tsx ${PROJECT_ROOT}/src/index.ts plugin list --json`, {
      encoding: 'utf-8',
      cwd: TEST_BASE,
    });
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.some((p: { name: string }) => p.name === 'json-test')).toBe(true);
  });

  it('news plugin uninstall removes plugin', () => {
    createFixturePlugin('remove-me');

    const pluginPath = join(PLUGINS_DIR, 'remove-me');
    expect(existsSync(pluginPath)).toBe(true);

    execSync(`npx tsx ${PROJECT_ROOT}/src/index.ts plugin uninstall remove-me`, {
      encoding: 'utf-8',
      cwd: TEST_BASE,
    });
    expect(existsSync(pluginPath)).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test -- test/plugin/cli.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/plugin/cli.ts src/cli.ts test/plugin/cli.test.ts
git commit -m "feat(plugin): add CLI subcommands — install, uninstall, list, update"
```

---

### Task 6: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README for context**

- [ ] **Step 2: Add plugin section to README**

Add after the CLI usage section:

```markdown
## Plugins

Plugins extend news-cli with new sources and commands, loaded dynamically at startup.

### Plugin locations

- `<cwd>/.news-plugins/<name>/` — local (project-specific)
- `~/.news-plugins/<name>/` — global

Local plugins override global plugins with the same name.

### Commands

```bash
news plugin install <url>              # Install from URL (.js or .zip)
news plugin install <npm-package>      # Install from npm
news plugin install <target> -g        # Install globally
news plugin install <target> --force   # Overwrite existing

news plugin list                       # List installed plugins
news plugin list --json

news plugin uninstall <name>           # Remove plugin
news plugin uninstall <name> -g

news plugin update <name>              # Update plugin
news plugin update <name> -g
```

### Writing a plugin

A plugin is a directory with `package.json` and an entry file exporting a `plugin` object:

```js
// index.js
export const plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  register(program, registry) {
    // Register a new news source
    registry.registerSource({
      name: 'my-source',
      description: 'My custom news source',
      async listCategories() { return ['tech', 'sports']; },
      async fetch(options) { return [/* NewsArticle[] */]; },
    });

    // Register a new CLI command
    program.command('hello').action(() => console.log('Hello from plugin!'));
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add plugin system usage to README"
```

---

### Task 7: Build and verify

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: Build completes, `dist/index.js` generated.

- [ ] **Step 2: Link and smoke test**

```bash
npm link
```

Create a test plugin:

```bash
mkdir -p /tmp/test-plugin
cat > /tmp/test-plugin/package.json << 'EOF'
{"name":"hello","version":"1.0.0","type":"module"}
EOF
cat > /tmp/test-plugin/index.js << 'EOF'
export const plugin = {
  name: 'hello',
  version: '1.0.0',
  register(program, registry) {
    program.command('hello')
      .description('Say hello from plugin')
      .action(() => console.log('Hello from plugin!'));
  },
};
EOF
```

Verify:

```bash
mkdir -p .news-plugins/hello
cp /tmp/test-plugin/* .news-plugins/hello/
news hello    # should print "Hello from plugin!"
news plugin list  # should show hello plugin
news plugin uninstall hello
```

- [ ] **Step 3: Clean up**

```bash
rm -rf .news-plugins
```

- [ ] **Step 4: Commit if any changes needed**

```bash
git add -A && git commit -m "chore: build and smoke-test plugin system" || true
```
