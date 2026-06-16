import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clsSource } from '../../../src/news-source/cls/index.js';
import type { ClsApiResponse } from '../../../src/news-source/cls/parser.js';

const mockHotList: ClsApiResponse = {
	errno: 0,
	data: [
		{
			id: '10001',
			title: 'A股三大指数集体收涨',
			brief: '沪指涨1.5%站上3400点',
			ctime: 1718500000,
			img: 'https://image.cls.cn/abc.jpg',
		},
		{
			id: '10002',
			title: '央行下调LPR利率',
			brief: '一年期LPR下调10个基点',
			ctime: 1718490000,
		},
	],
};

const mockDepthPage1: ClsApiResponse = {
	errno: 0,
	data: [
		{
			id: '20001',
			title: '头条：重要政策发布',
			brief: '国务院发布经济刺激计划',
			ctime: 1718500000,
			image: 'https://image.cls.cn/p1.jpg',
		},
		{
			id: '20002',
			title: '头条：市场分析',
			brief: '机构看好后市表现',
			ctime: 1718490000,
		},
	],
};

const mockDepthPage2: ClsApiResponse = {
	errno: 0,
	data: [
		{
			id: '20003',
			title: '头条：科技新闻',
			brief: 'AI领域最新进展',
			ctime: 1718480000,
		},
	],
};

describe('clsSource', () => {
	let depthCallCount = 0;

	beforeEach(() => {
		depthCallCount = 0;
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
			const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : '';

			if (urlStr.includes('/v2/article/hot/list')) {
				return new Response(JSON.stringify(mockHotList), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (urlStr.includes('/v3/depth/list')) {
				depthCallCount++;
				if (depthCallCount === 1) {
					return new Response(JSON.stringify(mockDepthPage1), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					});
				}
				if (depthCallCount === 2) {
					return new Response(JSON.stringify(mockDepthPage2), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					});
				}
				return new Response(JSON.stringify({ errno: 0, data: [] }), {
					status: 200,
				});
			}
			return new Response('{}', { status: 200 });
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should have name "cls"', () => {
		expect(clsSource.name).toBe('cls');
	});

	it('should have a description', () => {
		expect(clsSource.description).toBeTruthy();
	});

	describe('listCategories', () => {
		it('should return 2 categories', async () => {
			const cats = await clsSource.listCategories();
			expect(cats).toHaveLength(2);
			expect(cats).toContain('热点');
			expect(cats).toContain('头条');
		});
	});

	describe('fetch', () => {
		it('should default to 热点', async () => {
			const articles = await clsSource.fetch();
			expect(articles).toHaveLength(2);
			expect(articles[0].title).toContain('A股');
			expect(articles[0].category).toBe('热点');
		});

		it('should fetch 头条 with pagination', async () => {
			const articles = await clsSource.fetch({ category: '头条' });
			expect(articles).toHaveLength(3);
			expect(articles[0].title).toContain('头条');
			expect(articles[0].category).toBe('头条');
		});

		it('should fallback to 热点 for unknown category', async () => {
			const articles = await clsSource.fetch({ category: '未知' });
			expect(articles).toHaveLength(2);
			expect(articles[0].category).toBe('热点');
		});

		it('should support keyword filter', async () => {
			const articles = await clsSource.fetch({ keyword: 'A股' });
			expect(articles).toHaveLength(1);
			expect(articles[0].title).toContain('A股');
		});

		it('should support OR keyword', async () => {
			const articles = await clsSource.fetch({ keyword: 'A股,央行' });
			expect(articles).toHaveLength(2);
		});

		it('should respect limit', async () => {
			const articles = await clsSource.fetch({ limit: 1 });
			expect(articles).toHaveLength(1);
		});

		it('should return empty when API returns no data', async () => {
			vi.restoreAllMocks();
			vi.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ errno: 0, data: null }), {
					status: 200,
				}),
			);
			const articles = await clsSource.fetch();
			expect(articles).toEqual([]);
		});
	});
});
