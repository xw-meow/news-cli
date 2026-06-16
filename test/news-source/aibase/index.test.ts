import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aibaseSource } from '../../../src/news-source/aibase/index.js';
import type { AibaseApiResponse } from '../../../src/news-source/aibase/parser.js';

const mockPage1: AibaseApiResponse = {
	code: 200,
	msg: '成功',
	data: {
		totalCount: 50,
		pageSize: 20,
		pageNo: 1,
		totalPage: 3,
		list: [
			{
				oid: 10001,
				title: '英伟达加入AI债务热潮',
				subtitle: '英伟达加入AI债务热潮',
				thumb: 'https://pic.chinaz.com/abc.jpg',
				sourceName: 'AIbase基地',
				description: '英伟达计划发行至少200亿美元债券',
				createTime: '2026-06-16 10:04:40',
				pv: 3934,
			},
			{
				oid: 10002,
				title: 'Kimi 2.7 Code 发布',
				subtitle: 'Kimi 2.7 Code 发布',
				sourceName: 'AIbase基地',
				description: '输出速度提升5-6倍',
				createTime: '2026-06-16 09:55:22',
				pv: 5925,
			},
		],
	},
};

const mockPage2: AibaseApiResponse = {
	code: 200,
	msg: '成功',
	data: {
		totalCount: 50,
		pageSize: 20,
		pageNo: 2,
		totalPage: 3,
		list: [
			{
				oid: 10003,
				title: '雨果奖作家新书争议',
				subtitle: '雨果奖作家新书争议',
				sourceName: 'AIbase基地',
				description: '主动承认AI写作比重竟占一半',
				createTime: '2026-06-15 20:00:00',
				pv: 8000,
			},
		],
	},
};

const mockPage3: AibaseApiResponse = {
	code: 200,
	msg: '成功',
	data: {
		totalCount: 50,
		pageSize: 20,
		pageNo: 3,
		totalPage: 3,
		list: [
			{
				oid: 10004,
				title: '最后一页新闻',
				subtitle: '最后一页新闻',
				sourceName: 'AIbase基地',
				description: '这是最后一页了',
				createTime: '2026-06-15 18:00:00',
				pv: 1000,
			},
		],
	},
};

describe('aibaseSource', () => {
	beforeEach(() => {
		let callCount = 0;
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url) => {
			callCount++;

			if (callCount === 1) {
				return new Response(JSON.stringify(mockPage1), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (callCount === 2) {
				return new Response(JSON.stringify(mockPage2), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response(JSON.stringify(mockPage3), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should have name "aibase"', () => {
		expect(aibaseSource.name).toBe('aibase');
	});

	it('should have a description', () => {
		expect(aibaseSource.description).toBeTruthy();
	});

	describe('listCategories', () => {
		it('should return empty array (no categories)', async () => {
			const cats = await aibaseSource.listCategories();
			expect(cats).toEqual([]);
		});
	});

	describe('fetch', () => {
		it('should fetch articles with default limit', async () => {
			const articles = await aibaseSource.fetch();
			expect(articles.length).toBeGreaterThanOrEqual(2);
			expect(articles[0].title).toContain('英伟达');
			expect(articles[0].source).toBe('AIbase基地');
		});

		it('should paginate to meet limit', async () => {
			const articles = await aibaseSource.fetch({ limit: 3 });
			// page1 has 2 + page2 has 1 = 3
			expect(articles).toHaveLength(3);
			expect(articles[2].title).toContain('雨果奖');
		});

		it('should support keyword filter', async () => {
			const articles = await aibaseSource.fetch({ keyword: 'Kimi' });
			expect(articles).toHaveLength(1);
			expect(articles[0].title).toContain('Kimi');
		});

		it('should respect limit', async () => {
			const articles = await aibaseSource.fetch({ limit: 1 });
			expect(articles).toHaveLength(1);
		});

		it('should support OR keyword', async () => {
			const articles = await aibaseSource.fetch({ keyword: '英伟达,Kimi' });
			expect(articles).toHaveLength(2);
		});

		it('should return empty when API returns no data', async () => {
			vi.restoreAllMocks();
			vi.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ code: 200, data: { list: [] } }), {
					status: 200,
				}),
			);
			const articles = await aibaseSource.fetch();
			expect(articles).toEqual([]);
		});

		it('should return empty when API returns null data', async () => {
			vi.restoreAllMocks();
			vi.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ code: 200, data: null }), {
					status: 200,
				}),
			);
			const articles = await aibaseSource.fetch();
			expect(articles).toEqual([]);
		});
	});
});
