import { describe, it, expect } from 'vitest';
import { parseNewsItems } from '../../../src/news-source/pengpai/parser.js';
import type { PengpaiNewsItem } from '../../../src/news-source/pengpai/parser.js';

const sampleItems: PengpaiNewsItem[] = [
  {
    contId: '33382650',
    name: '以开放型经济为轴，丽水莲都区多维度编织"全球贸易链接网"',
    summary: '…摘要内容…',
    pubTimeLong: 1781513621719,
    pic: 'https://imgpai.thepaper.cn/image.png',
    nodeInfo: { nodeId: 12345, name: '澎湃浙江' },
  },
  {
    contId: '33382600',
    name: '活力中国调研行｜AI硬科技是一个时代机遇',
    summary: '…主题采访…',
    pubTimeLong: 1781513471394,
    pic: 'https://imgpai.thepaper.cn/image2.png',
    nodeInfo: { nodeId: 25438, name: '财经上下游' },
  },
  {
    contId: '33382562',
    name: '华润置地约6.57亿元拍下合肥苏宁广场',
    pubTimeLong: 1781513332035,
    nodeInfo: { nodeId: 25433, name: '地产界' },
  },
  { contId: '33382000', name: '' },
];

describe('parseNewsItems', () => {
  it('should parse PengpaiNewsItem[] into NewsArticle[]', () => {
    const articles = parseNewsItems(sampleItems);
    expect(articles).toHaveLength(4);
  });

  it('should set title from name field', () => {
    const articles = parseNewsItems(sampleItems);
    expect(articles[0].title).toContain('丽水莲都区');
    expect(articles[1].title).toContain('AI硬科技');
  });

  it('should strip HTML tags from title', () => {
    const items: PengpaiNewsItem[] = [
      { contId: '1', name: '澎湃<font color="#00a5eb">新闻</font>｜艺术评论' },
    ];
    expect(parseNewsItems(items)[0].title).toBe('澎湃新闻｜艺术评论');
  });

  it('should build URL from contId', () => {
    expect(parseNewsItems(sampleItems)[0].url).toBe(
      'https://www.thepaper.cn/newsDetail_forward_33382650',
    );
  });

  it('should set source to 澎湃新闻', () => {
    parseNewsItems(sampleItems).forEach((a) => expect(a.source).toBe('澎湃新闻'));
  });

  it('should extract snippet from summary and strip HTML', () => {
    const items: PengpaiNewsItem[] = [
      { contId: '1', name: 't', summary: '摘要<font color="red">重点</font>内容' },
    ];
    expect(parseNewsItems(items)[0].snippet).toBe('摘要重点内容');
  });

  it('should leave snippet undefined when no summary', () => {
    expect(parseNewsItems(sampleItems)[2].snippet).toBeUndefined();
  });

  it('should parse pubTimeLong to ISO string', () => {
    expect(parseNewsItems(sampleItems)[0].publishedAt).toBe('2026-06-15T08:53:41.719Z');
  });

  it('should leave publishedAt undefined when no pubTimeLong', () => {
    expect(parseNewsItems(sampleItems)[3].publishedAt).toBeUndefined();
  });

  it('should set category from nodeInfo.name', () => {
    expect(parseNewsItems(sampleItems)[0].category).toBe('澎湃浙江');
    expect(parseNewsItems(sampleItems)[3].category).toBeUndefined();
  });

  it('should set imageUrl from pic', () => {
    expect(parseNewsItems(sampleItems)[0].imageUrl).toBe('https://imgpai.thepaper.cn/image.png');
    expect(parseNewsItems(sampleItems)[2].imageUrl).toBeUndefined();
  });

  it('should generate unique IDs', () => {
    const ids = parseNewsItems(sampleItems).map((a) => a.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('should handle empty title gracefully', () => {
    expect(parseNewsItems(sampleItems)[3].title).toBe('Untitled');
  });

  it('should return empty array for empty input', () => {
    expect(parseNewsItems([])).toEqual([]);
  });

  it('should exclude articles by title keyword', () => {
    const items: PengpaiNewsItem[] = [
      { contId: '1', name: '正常新闻' },
      { contId: '2', name: '澎湃早晚报｜早餐湃·美伊达成和平协议', nodeInfo: { nodeId: 2, name: '舆论场' } },
      { contId: '3', name: '澎湃AI早新闻丨2026年6月15日', nodeInfo: { nodeId: 3, name: '澎湃早晚报早餐湃' } },
      { contId: '4', name: '正常2' },
    ];
    const articles = parseNewsItems(items);
    expect(articles).toHaveLength(2);
    expect(articles[0].title).toBe('正常新闻');
    expect(articles[1].title).toBe('正常2');
  });
});
