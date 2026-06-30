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
