import { describe, it, expect } from 'vitest';

describe('Plugin types', () => {
  it('Plugin interface shape', () => {
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
