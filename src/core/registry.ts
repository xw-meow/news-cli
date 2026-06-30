import type { NewsSource } from './types.js';

const sources = new Map<string, NewsSource>();

export function registerSource(source: NewsSource): void {
  if (sources.has(source.name)) {
    throw new Error(`Source "${source.name}" already registered`);
  }
  sources.set(source.name, source);
}

export function getSource(name: string): NewsSource | undefined {
  return sources.get(name);
}

export function listSources(): NewsSource[] {
  return [...sources.values()];
}

/** 仅用于测试：清空注册表 */
export function clearSources(): void {
  sources.clear();
}
