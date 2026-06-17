import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Command } from 'commander';
import { loadPlugins } from '../../src/plugin/loader.js';
import { clearSources, listSources } from '../../src/core/registry.js';

const TEST_BASE = resolve(tmpdir(), 'news-cli-plugin-test-loader');
const LOCAL_DIR = join(TEST_BASE, '.news-plugins');

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
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
    mkdirSync(TEST_BASE, { recursive: true });
  });

  afterAll(() => {
    clearSources();
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
  });

  beforeEach(() => {
    clearSources();
    // Clean up local plugin directory between tests to avoid state leakage
    if (existsSync(LOCAL_DIR)) {
      try { rmSync(LOCAL_DIR, { recursive: true, force: true }); } catch {}
    }
  });

  it('loads nothing when no plugin directories exist', async () => {
    clearSources();
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

    const GLOBAL_DIR = resolve(process.env.HOME ?? tmpdir(), '.news-plugins-loader-test');

    try {
      // global plugin registers source "global-source"
      createPlugin(GLOBAL_DIR, 'same-name', 'global-source');
      // local plugin registers source "local-source"
      createPlugin(LOCAL_DIR, 'same-name', 'local-source');

      // Monkey-patch: override HOME to point to our test global dir
      const originalHome = process.env.HOME;
      process.env.HOME = resolve(tmpdir(), 'news-cli-plugin-test-loader');

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
        process.env.HOME = originalHome;
      }
    } finally {
      try { rmSync(GLOBAL_DIR, { recursive: true, force: true }); } catch {}
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
