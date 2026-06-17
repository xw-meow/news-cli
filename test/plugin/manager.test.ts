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

  it('listPlugins returns empty when no plugins', () => {
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
