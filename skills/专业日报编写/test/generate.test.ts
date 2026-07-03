import { describe, it, expect } from 'vitest';
import { generateReport, todayStr } from '../scripts/generate.js';
import type { SelectedArticles } from '../scripts/dedup.js';
import type { PlanResult } from '../scripts/plan.js';

const plan: PlanResult = {
  topic: 'AI 日报',
  audience: 'AI 从业者',
  style: '正式',
  length: '中',
  keywords: [],
  outputFile: './report.md',
  sources: [],
  targetCount: 2,
};

const selected: SelectedArticles = {
  plan,
  articles: [
    {
      id: '1', title: 'OpenAI 发布 GPT-5', url: 'https://openai.com', source: '36kr',
      snippet: 'OpenAI 今日发布新一代模型。', publishedAt: '2026-07-03T10:00:00Z',
      category: 'AI', imageUrl: null, selectedReason: 'r1',
    },
    {
      id: '2', title: 'Google 推出 Gemini 新版本', url: 'https://google.com', source: 'aibase',
      snippet: 'Google 升级 Gemini。', publishedAt: '2026-07-03T09:00:00Z',
      category: 'AI', imageUrl: null, selectedReason: 'r2',
    },
  ],
};

describe('generateReport', () => {
  it('生成包含标题和导语的 Markdown', () => {
    const md = generateReport(selected);
    expect(md).toContain('# AI 日报');
    expect(md).toContain('## 导语');
    expect(md).toContain('OpenAI 发布 GPT-5');
    expect(md).toContain('[原文链接](https://openai.com)');
    expect(md).toContain('## 今日来源');
    expect(md).toContain('> 该消息来自 36kr · AI，与 AI 日报 主题相关。');
    expect(md).not.toContain('r1');
    expect(md).not.toContain('r2');
  });
});

describe('todayStr', () => {
  it('返回 yyyy-mm-dd 格式', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
