import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface SourcePlan {
  name: string;
  category: string | null;
  limit: number;
  keywords: string | null;
}

export interface PlanResult {
  topic: string;
  audience: string;
  style: string;
  length: string;
  keywords: string[];
  outputFile: string;
  sources: SourcePlan[];
  targetCount: number;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function parseRequest(input: string): PlanResult {
  const topic = extractTopic(input);
  const audience = extractPattern(input, /面向\s*([^，,。]+)/) || '对该主题感兴趣的读者';
  const style = extractPattern(input, /([^，,。\s]+)\s*风格/) || '平衡';
  const length = extractLength(input);
  const keywords = extractKeywords(input);
  const outputFile = extractPattern(input, /保存到\s*(\S+)/) || `./daily-report-${todayStr()}.md`;
  const targetCount = extractTargetCount(input) || lengthToCount(length);
  const sources = recommendSources(topic, keywords);

  return { topic, audience, style, length, keywords, outputFile, sources, targetCount };
}

function extractTopic(input: string): string {
  const m = input.match(/(?:写一份|生成一份|来一份|做一份)\s*(?:今天[的]?|今日[的]?|昨天[的]?|昨日[的]?|最近[的]?)?\s*(.*?日报)/);
  return m ? m[1].trim() : input.replace(/[，,。]/g, ' ').trim();
}

function extractPattern(input: string, regex: RegExp): string | null {
  const m = input.match(regex);
  return m ? m[1].trim() : null;
}

function extractLength(input: string): string {
  if (input.includes('短')) return '短';
  if (input.includes('长')) return '长';
  return '中';
}

function extractKeywords(input: string): string[] {
  const m = input.match(/关键词[是为]?\s*[""]?(.*?)[""]?[，,。]/);
  if (!m) return [];
  return m[1].split(/[,，]/).map(s => s.trim()).filter(Boolean);
}

function extractTargetCount(input: string): number | null {
  const m = input.match(/(\d+)\s*条/);
  return m ? parseInt(m[1], 10) : null;
}

function lengthToCount(length: string): number {
  if (length === '短') return 6;
  if (length === '长') return 16;
  return 10;
}

export function recommendSources(topic: string, keywords: string[] = []): SourcePlan[] {
  const t = topic.toLowerCase();
  const keywordStr = keywords.length ? keywords.join(',') : null;

  if (t.includes('ai') || t.includes('人工智能') || t.includes('大模型')) {
    return [
      { name: 'aibase', category: null, limit: 20, keywords: keywordStr },
      { name: '36kr', category: 'AI', limit: 20, keywords: keywordStr },
      { name: 'tencent-news', category: '科技/AI', limit: 20, keywords: keywordStr },
      { name: 'weibo', category: null, limit: 20, keywords: keywordStr || 'AI,大模型' },
    ];
  }

  if (t.includes('科技') || t.includes('互联网')) {
    return [
      { name: 'ithome', category: '业界', limit: 20, keywords: keywordStr },
      { name: '36kr', category: '科技', limit: 20, keywords: keywordStr },
      { name: 'tencent-news', category: '科技/AI', limit: 20, keywords: keywordStr },
      { name: 'weibo', category: null, limit: 20, keywords: keywordStr || '科技' },
      { name: 'hackernews', category: 'top', limit: 15, keywords: keywordStr },
    ];
  }

  if (t.includes('财经') || t.includes('商业')) {
    return [
      { name: 'cls', category: '头条', limit: 20, keywords: keywordStr },
      { name: '36kr', category: '财经', limit: 20, keywords: keywordStr },
      { name: 'yicai', category: '最新', limit: 20, keywords: keywordStr },
      { name: 'tencent-news', category: '财经', limit: 20, keywords: keywordStr },
    ];
  }

  if (t.includes('汽车')) {
    return [
      { name: 'autohome', category: '最新', limit: 20, keywords: keywordStr },
      { name: '36kr', category: '汽车', limit: 20, keywords: keywordStr },
    ];
  }

  if (t.includes('国际') || t.includes('海外')) {
    return [
      { name: 'bbc', category: 'technology', limit: 15, keywords: keywordStr },
      { name: 'google-news', category: 'world', limit: 15, keywords: keywordStr },
      { name: 'hackernews', category: 'top', limit: 15, keywords: keywordStr },
    ];
  }

  return [
    { name: 'pengpai', category: '要闻', limit: 20, keywords: keywordStr },
    { name: 'chinanews', category: '即时新闻', limit: 20, keywords: keywordStr },
    { name: 'weibo', category: null, limit: 20, keywords: keywordStr || '热点' },
    { name: 'google-news-cn', category: 'headlines', limit: 15, keywords: keywordStr },
  ];
}

export function writePlan(plan: PlanResult, path = './tmp/report-plan.json'): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(plan, null, 2), 'utf8');
}
