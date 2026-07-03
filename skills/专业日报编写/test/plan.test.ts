import { describe, it, expect } from 'vitest';
import { parseRequest, recommendSources } from '../scripts/plan.js';

describe('parseRequest', () => {
  it('解析完整诉求', () => {
    const input = '帮我写一份今天的 AI 行业日报，面向 AI 从业者，正式风格，10 条左右，保存到 docs/ai-daily.md';
    const result = parseRequest(input);
    expect(result.topic).toBe('AI 行业日报');
    expect(result.audience).toBe('AI 从业者');
    expect(result.style).toBe('正式');
    expect(result.length).toBe('中');
    expect(result.targetCount).toBe(10);
    expect(result.outputFile).toBe('docs/ai-daily.md');
  });

  it('解析最小诉求并使用默认值', () => {
    const input = '写一份 AI 日报';
    const result = parseRequest(input);
    expect(result.topic).toBe('AI 日报');
    expect(result.audience).toBe('对该主题感兴趣的读者');
    expect(result.style).toBe('平衡');
    expect(result.length).toBe('中');
    expect(result.outputFile.startsWith('./daily-report-')).toBe(true);
  });
});

describe('recommendSources', () => {
  it('AI 主题返回推荐源', () => {
    const sources = recommendSources('AI 行业日报');
    expect(sources.map(s => s.name)).toContain('aibase');
    expect(sources.map(s => s.name)).toContain('36kr');
  });
});
