import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { installPlugin } from '../../src/plugin/installer.js';

const TEST_BASE = resolve(tmpdir(), 'news-cli-plugin-test-installer');
let server: ReturnType<typeof createServer>;
let serverUrl: string;

describe('installer', () => {
  beforeAll(async () => {
    try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch {}
    mkdirSync(TEST_BASE, { recursive: true });

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
    const installPath = join(basePath, '.news-plugins', 'my-plugin');
    expect(existsSync(join(installPath, 'my-plugin.js'))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(installPath, 'package.json'), 'utf-8'));
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
    await expect(
      installPlugin(`${serverUrl}/my-plugin.js`, { basePath, force: true }),
    ).resolves.toBe('my-plugin');
  });

  it('rejects non-existent URL', async () => {
    const basePath = join(TEST_BASE, 'bad-url-test');
    mkdirSync(basePath, { recursive: true });

    await expect(
      installPlugin(`${serverUrl}/non-existent.js`, { basePath, force: false }),
    ).rejects.toThrow();
  });
});
