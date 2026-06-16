import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tencentNewsSource } from '../../../src/news-source/tencent-news/index.js';
import type { TencentNewsApiResponse } from '../../../src/news-source/tencent-news/parser.js';

const mockResponse: TencentNewsApiResponse = {
	code: 0,
	data: [
		{
			id: '20260615V0500G00',
			title: '马斯克敲钟前激动讲话：SpaceX的使命',
			articletype: '4',
			publish_time: '2026-06-15 13:24:45',
			pic_info: {
				big_img: ['https://inews.gtimg.com/abc.jpg'],
			},
			link_info: {
				url: 'https://new.qq.com/rain/a/20260615V0500G00',
			},
			media_info: {
				chl_name: '硬核翻译局',
			},
			desc: 'SpaceX完成史上最大规模IPO',
		},
		{
			id: '20260615A0800L00',
			title: 'AI应用层的泡沫被戳破',
			articletype: '0',
			publish_time: '2026-06-15 18:02:53',
			link_info: {
				url: 'https://new.qq.com/rain/a/20260615A0800L00',
			},
			media_info: {
				chl_name: 'AI未来指北',
			},
			desc: '生成式AI爆发三年半后进入分歧点',
		},
		{
			id: '20260616V0300G00',
			title: '英伟达市值突破',
			publish_time: '2026-06-16 08:00:00',
			link_info: {
				url: 'https://new.qq.com/rain/a/20260616V0300G00',
			},
			media_info: {
				chl_name: '财经早餐',
			},
			desc: '英伟达市值突破6万亿美元',
		},
	],
};

describe('tencentNewsSource', () => {
	beforeEach(() => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should have name "tencent-news"', () => {
		expect(tencentNewsSource.name).toBe('tencent-news');
	});

	it('should have a description', () => {
		expect(tencentNewsSource.description).toBeTruthy();
	});

	describe('listCategories', () => {
		it('should return 5 categories', async () => {
			const cats = await tencentNewsSource.listCategories();
			expect(cats).toHaveLength(5);
			expect(cats).toContain('科技/AI');
			expect(cats).toContain('要闻');
			expect(cats).toContain('财经');
			expect(cats).toContain('体育');
			expect(cats).toContain('娱乐');
		});
	});

	describe('fetch', () => {
		it('should fetch articles defaulting to 科技/AI', async () => {
			const articles = await tencentNewsSource.fetch();
			expect(articles).toHaveLength(3);
			expect(articles[0].title).toContain('马斯克');
			expect(articles[0].category).toBe('科技/AI');
		});

		it('should support category selection', async () => {
			const articles = await tencentNewsSource.fetch({ category: '财经' });
			expect(articles[0].category).toBe('财经');
		});

		it('should support keyword filter', async () => {
			const articles = await tencentNewsSource.fetch({ keyword: '英伟达' });
			expect(articles).toHaveLength(1);
			expect(articles[0].title).toContain('英伟达');
		});

		it('should respect limit', async () => {
			const articles = await tencentNewsSource.fetch({ limit: 1 });
			expect(articles).toHaveLength(1);
		});

		it('should support OR keyword', async () => {
			const articles = await tencentNewsSource.fetch({ keyword: '马斯克,英伟达' });
			expect(articles).toHaveLength(2);
		});

		it('should fallback to default for unknown category', async () => {
			const articles = await tencentNewsSource.fetch({ category: '未知' });
			expect(articles[0].category).toBe('科技/AI');
		});

		it('should return empty when API returns no data', async () => {
			vi.restoreAllMocks();
			vi.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ code: 0, data: [] }), {
					status: 200,
				}),
			);
			const articles = await tencentNewsSource.fetch();
			expect(articles).toEqual([]);
		});

		it('should return empty when API returns null data', async () => {
			vi.restoreAllMocks();
			vi.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ code: 0, data: null }), {
					status: 200,
				}),
			);
			const articles = await tencentNewsSource.fetch();
			expect(articles).toEqual([]);
		});
	});
});
