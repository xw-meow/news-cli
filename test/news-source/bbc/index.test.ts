import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bbcSource } from '../../../src/news-source/bbc/index.js';
import type { BbcApiResponse } from '../../../src/news-source/bbc/parser.js';

const mockPage0: BbcApiResponse = {
	page: 0,
	pageSize: 20,
	total: 25,
	data: [
		{
			path: '/news/articles/tech-001',
			id: 'urn:bbc:optimo:asset:tech-001',
			type: 'article',
			subtype: 'news',
			title: 'AI breakthrough announced',
			summary: 'A major AI breakthrough was announced today.',
			topics: ['Technology'],
			firstPublishedAt: '2026-06-17T10:00:00.000Z',
			state: 'published',
		},
		{
			path: '/news/articles/tech-002',
			id: 'urn:bbc:optimo:asset:tech-002',
			type: 'article',
			subtype: 'news',
			title: 'New chip design unveiled',
			summary: 'A revolutionary chip design promises better performance.',
			topics: ['Technology'],
			firstPublishedAt: '2026-06-17T09:30:00.000Z',
			state: 'published',
		},
	],
};

const mockPage1: BbcApiResponse = {
	page: 1,
	pageSize: 20,
	total: 25,
	data: [
		{
			path: '/news/articles/tech-003',
			id: 'urn:bbc:optimo:asset:tech-003',
			type: 'article',
			subtype: 'news',
			title: 'Quantum computing milestone',
			summary: 'Researchers achieve new quantum milestone.',
			topics: ['Technology'],
			firstPublishedAt: '2026-06-16T18:00:00.000Z',
			state: 'published',
		},
	],
};

const mockEmpty: BbcApiResponse = {
	page: 0,
	pageSize: 20,
	total: 0,
	data: [],
};

describe('bbcSource', () => {
	beforeEach(() => {
		let callCount = 0;
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url) => {
			callCount++;

			if (callCount === 1) {
				return new Response(JSON.stringify(mockPage0), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (callCount === 2) {
				return new Response(JSON.stringify(mockPage1), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response(JSON.stringify(mockEmpty), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should have name "bbc"', () => {
		expect(bbcSource.name).toBe('bbc');
	});

	it('should have a description', () => {
		expect(bbcSource.description).toBeTruthy();
	});

	describe('listCategories', () => {
		it('should return all category keys', async () => {
			const cats = await bbcSource.listCategories();
			expect(cats).toContain('technology');
			expect(cats).toContain('business');
			expect(cats).toContain('business-more');
			expect(cats).toContain('health');
			expect(cats).toContain('culture');
			expect(cats).toContain('arts');
			expect(cats).toContain('travel');
			expect(cats).toHaveLength(7);
		});
	});

	describe('fetch', () => {
		it('should fetch articles with default (technology category)', async () => {
			const articles = await bbcSource.fetch();
			expect(articles.length).toBeGreaterThanOrEqual(1);
			expect(articles[0].title).toContain('AI breakthrough');
			expect(articles[0].source).toBe('BBC News');
		});

		it('should fetch articles for a specific category', async () => {
			const articles = await bbcSource.fetch({ category: 'technology' });
			expect(articles.length).toBeGreaterThanOrEqual(1);
			expect(articles[0].category).toBe('Technology');
		});

		it('should paginate to meet limit', async () => {
			const articles = await bbcSource.fetch({ limit: 3 });
			// page0 has 2 + page1 has 1 = 3
			expect(articles).toHaveLength(3);
			expect(articles[2].title).toContain('Quantum computing');
		});

		it('should respect limit', async () => {
			const articles = await bbcSource.fetch({ limit: 1 });
			expect(articles).toHaveLength(1);
		});

		it('should support keyword filter', async () => {
			const articles = await bbcSource.fetch({ keyword: 'chip' });
			expect(articles).toHaveLength(1);
			expect(articles[0].title).toContain('New chip');
		});

		it('should support OR keyword', async () => {
			const articles = await bbcSource.fetch({ keyword: 'AI,chip' });
			expect(articles).toHaveLength(2);
		});

		it('should return empty for unknown category', async () => {
			const articles = await bbcSource.fetch({ category: 'nonexistent' });
			expect(articles).toEqual([]);
		});

		it('should return empty when API returns no data', async () => {
			vi.restoreAllMocks();
			vi.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify(mockEmpty), {
					status: 200,
				}),
			);
			const articles = await bbcSource.fetch();
			expect(articles).toEqual([]);
		});

		it('should return empty when API returns null data', async () => {
			vi.restoreAllMocks();
			vi.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ page: 0, total: 0 }), {
					status: 200,
				}),
			);
			const articles = await bbcSource.fetch();
			expect(articles).toEqual([]);
		});
	});
});
