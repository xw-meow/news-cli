import { describe, it, expect } from 'vitest';
import { parseArticles } from '../../../src/news-source/aibase/parser.js';
import type { AibaseArticleItem } from '../../../src/news-source/aibase/parser.js';

const mockItems: AibaseArticleItem[] = [
	{
		oid: 28943,
		title: '英伟达加入AI债务热潮',
		subtitle: '英伟达加入AI债务热潮',
		thumb: 'https://pic.chinaz.com/picmap/abc.jpg',
		sourceName: 'AIbase基地',
		author: '',
		description: '英伟达计划发行至少200亿美元债券',
		createTime: '2026-06-16 10:04:40',
		pv: 3934,
	},
	{
		oid: 28942,
		title: 'Kimi 2.7 Code 高速版发布',
		subtitle: 'Kimi 2.7 Code 高速版发布',
		thumb: '',
		sourceName: 'AIbase基地',
		description: '输出速度提升5-6倍',
		createTime: '2026-06-16 09:55:22',
		pv: 5925,
	},
	{
		oid: 0,
		title: '空标题',
		subtitle: '',
		description: '',
	},
];

describe('parseArticles', () => {
	it('should parse articles with all fields', () => {
		const articles = parseArticles(mockItems);
		expect(articles).toHaveLength(2); // 第3条无内容（oid=0 + no content）被过滤

		const a1 = articles[0];
		expect(a1.title).toBe('英伟达加入AI债务热潮');
		expect(a1.source).toBe('AIbase基地');
		expect(a1.snippet).toBe('英伟达计划发行至少200亿美元债券');
		expect(a1.imageUrl).toBe('https://pic.chinaz.com/picmap/abc.jpg');
		expect(a1.url).toBe('https://news.aibase.com/zh/news/28943');
		expect(a1.publishedAt).toBeDefined();
		expect(a1.id).toHaveLength(12);
	});

	it('should parse createTime to ISO string', () => {
		const articles = parseArticles(mockItems);
		const a1 = articles[0];
		// "2026-06-16 10:04:40" in local time → ISO
		expect(a1.publishedAt).toBeTruthy();
		expect(a1.publishedAt).toContain('2026-06-16');
	});

	it('should fallback to subtitle when title is missing', () => {
		const items: AibaseArticleItem[] = [
			{
				oid: 1,
				subtitle: 'Subtitle as fallback',
				description: 'desc',
			},
		];
		const articles = parseArticles(items);
		expect(articles[0].title).toBe('Subtitle as fallback');
	});

	it('should use empty thumb as no image', () => {
		const articles = parseArticles(mockItems);
		const a2 = articles[1];
		expect(a2.imageUrl).toBeUndefined();
	});

	it('should handle empty array', () => {
		const articles = parseArticles([]);
		expect(articles).toEqual([]);
	});

	it('should filter items with no oid', () => {
		const items: AibaseArticleItem[] = [
			{ oid: 0, title: 'Has title', description: 'Has desc' },
			{ oid: 1, title: 'Valid', description: 'Valid desc' },
		];
		const articles = parseArticles(items);
		expect(articles).toHaveLength(1);
		expect(articles[0].title).toBe('Valid');
	});

	it('should handle missing optional fields', () => {
		const items: AibaseArticleItem[] = [
			{ oid: 1, title: 'Minimal article' },
		];
		const articles = parseArticles(items);
		expect(articles).toHaveLength(1);
		expect(articles[0].title).toBe('Minimal article');
		expect(articles[0].source).toBe('AIbase');
		expect(articles[0].snippet).toBeUndefined();
		expect(articles[0].publishedAt).toBeUndefined();
		expect(articles[0].imageUrl).toBeUndefined();
	});

	it('should handle invalid createTime', () => {
		const items: AibaseArticleItem[] = [
			{ oid: 1, title: 'Test', createTime: 'invalid-date' },
		];
		const articles = parseArticles(items);
		expect(articles[0].publishedAt).toBeUndefined();
	});
});
