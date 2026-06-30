import { describe, it, expect } from 'vitest';
import { parseArticles } from '../../../src/news-source/cls/parser.js';
import type { ClsArticleItem } from '../../../src/news-source/cls/parser.js';

const mockItems: ClsArticleItem[] = [
	{
		id: '12345',
		title: 'A股三大指数集体收涨',
		brief: '沪指涨1.5%站上3400点',
		ctime: 1718500000,
		img: 'https://image.cls.cn/abc.jpg',
	},
	{
		id: '12346',
		title: '央行下调LPR利率',
		content: '一年期LPR下调10个基点至3.45%',
		ctime: 1718490000,
		image: 'https://image.cls.cn/def.jpg',
	},
	{
		id: '12347',
		title: '',
		brief: '',
		content: '',
	},
];

describe('parseArticles', () => {
	it('should parse articles with all fields', () => {
		const articles = parseArticles(mockItems, '热点');
		expect(articles).toHaveLength(2); // 第3条无内容被过滤

		const a1 = articles[0];
		expect(a1.title).toBe('A股三大指数集体收涨');
		expect(a1.source).toBe('财联社');
		expect(a1.snippet).toBe('沪指涨1.5%站上3400点');
		expect(a1.category).toBe('热点');
		expect(a1.imageUrl).toBe('https://image.cls.cn/abc.jpg');
		expect(a1.url).toBe('https://www.cls.cn/detail/12345');
		expect(a1.publishedAt).toBeDefined();
		expect(a1.id).toHaveLength(12);
	});

	it('should use image when img is not set (depth API)', () => {
		const articles = parseArticles(mockItems, '头条');
		const a2 = articles[1];
		expect(a2.imageUrl).toBe('https://image.cls.cn/def.jpg');
	});

	it('should filter out items with no title/brief/content', () => {
		const items: ClsArticleItem[] = [
			{ id: '1', title: '', brief: '', content: '' },
			{ id: '2', title: 'Valid', brief: '', content: '' },
		];
		const articles = parseArticles(items, '热点');
		expect(articles).toHaveLength(1);
		expect(articles[0].title).toBe('Valid');
	});

	it('should handle empty array', () => {
		const articles = parseArticles([], '热点');
		expect(articles).toEqual([]);
	});

	it('should use ctime in seconds as timestamp', () => {
		const items: ClsArticleItem[] = [
			{ id: '1', title: 'Test', ctime: 1718500000 },
		];
		const articles = parseArticles(items, '热点');
		// 1718500000 seconds → 1718500000000 ms → 2024-06
		expect(articles[0].publishedAt).toContain('2024-06');
	});

	it('should use content as snippet when brief is missing', () => {
		const items: ClsArticleItem[] = [
			{ id: '1', title: 'Test', content: 'Full content here' },
		];
		const articles = parseArticles(items, '热点');
		expect(articles[0].snippet).toBe('Full content here');
	});

	it('should handle missing optional fields', () => {
		const items: ClsArticleItem[] = [
			{ title: 'Minimal article' },
		];
		const articles = parseArticles(items, '热点');
		expect(articles).toHaveLength(1);
		expect(articles[0].title).toBe('Minimal article');
		expect(articles[0].url).toBe('https://www.cls.cn/');
		expect(articles[0].snippet).toBeUndefined();
		expect(articles[0].publishedAt).toBeUndefined();
		expect(articles[0].imageUrl).toBeUndefined();
	});
});
