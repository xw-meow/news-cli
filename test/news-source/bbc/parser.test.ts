import { describe, it, expect } from 'vitest';
import { parseDataItems } from '../../../src/news-source/bbc/parser.js';
import type { BbcDataItem } from '../../../src/news-source/bbc/parser.js';

const mockItems: BbcDataItem[] = [
	{
		path: '/news/articles/cwy0dyn0rveo',
		id: 'urn:bbc:optimo:asset:cwy0dyn0rveo',
		type: 'article',
		subtype: 'news',
		title: 'Three banned from matches after Muratti disorder',
		summary: 'Three people are banned from FA matches in Guernsey and Jersey.',
		topics: ['UK'],
		indexImage: {
			model: {
				blocks: {
					src: 'https://ichef.bbci.co.uk/news/480/cpsprodpb/def5/live/74a14b10-6a0e-11f1-8e1d-bbbb1017d210.jpg',
					altText: 'A green sports pitch with goal nets.',
					width: 1020,
					height: 573,
				},
			},
		},
		firstPublishedAt: '2026-06-17T05:38:21.525Z',
		lastPublishedAt: '2026-06-17T05:38:21.525Z',
		state: 'published',
	},
	{
		path: '/news/articles/c3dy8djk0ppo',
		id: 'urn:bbc:optimo:asset:c3dy8djk0ppo',
		type: 'article',
		subtype: 'news',
		title: 'Your guide to the Isle of Wight Festival 2026',
		summary: 'Everything you need to know ahead of this year\'s festival.',
		topics: ['UK'],
		firstPublishedAt: '2026-06-17T05:00:54.009Z',
		lastPublishedAt: '2026-06-17T05:00:54.009Z',
		state: 'published',
	},
	{
		path: '/news/av-12345',
		id: 'urn:bbc:optimo:asset:video-12345',
		type: 'video',
		title: 'Some video title',
		summary: 'A video summary',
		state: 'published',
	},
	{
		// missing path — should be filtered
		type: 'article',
		title: 'No path article',
		summary: 'This should be filtered out',
	},
	{
		// missing title — should be filtered
		path: '/news/articles/no-title',
		id: 'urn:bbc:optimo:asset:no-title',
		type: 'article',
		summary: 'No title here',
		state: 'published',
	},
];

describe('parseDataItems', () => {
	it('should parse articles with all fields', () => {
		const articles = parseDataItems(mockItems);
		expect(articles).toHaveLength(2);

		const a1 = articles[0];
		expect(a1.title).toBe('Three banned from matches after Muratti disorder');
		expect(a1.url).toBe('https://www.bbc.com/news/articles/cwy0dyn0rveo');
		expect(a1.source).toBe('BBC News');
		expect(a1.snippet).toBe('Three people are banned from FA matches in Guernsey and Jersey.');
		expect(a1.imageUrl).toBe('https://ichef.bbci.co.uk/news/480/cpsprodpb/def5/live/74a14b10-6a0e-11f1-8e1d-bbbb1017d210.jpg');
		expect(a1.publishedAt).toBe('2026-06-17T05:38:21.525Z');
		expect(a1.category).toBe('UK');
		expect(a1.id).toHaveLength(12);
	});

	it('should filter out non-article types', () => {
		const articles = parseDataItems(mockItems);
		const titles = articles.map((a) => a.title);
		expect(titles).not.toContain('Some video title');
	});

	it('should filter items with no path', () => {
		const articles = parseDataItems(mockItems);
		const titles = articles.map((a) => a.title);
		expect(titles).not.toContain('No path article');
	});

	it('should filter items with no title', () => {
		const articles = parseDataItems(mockItems);
		expect(articles.every((a) => a.title.length > 0)).toBe(true);
	});

	it('should handle missing optional fields', () => {
		const items: BbcDataItem[] = [
			{
				path: '/news/articles/minimal',
				type: 'article',
				title: 'Minimal article',
			},
		];
		const articles = parseDataItems(items);
		expect(articles).toHaveLength(1);
		expect(articles[0].title).toBe('Minimal article');
		expect(articles[0].source).toBe('BBC News');
		expect(articles[0].snippet).toBeUndefined();
		expect(articles[0].publishedAt).toBeUndefined();
		expect(articles[0].imageUrl).toBeUndefined();
		expect(articles[0].category).toBeUndefined();
	});

	it('should handle empty array', () => {
		const articles = parseDataItems([]);
		expect(articles).toEqual([]);
	});

	it('should use first topic as category', () => {
		const items: BbcDataItem[] = [
			{
				path: '/news/articles/multi-topic',
				type: 'article',
				title: 'Multi topic article',
				topics: ['Technology', 'Business'],
			},
		];
		const articles = parseDataItems(items);
		expect(articles[0].category).toBe('Technology');
	});

	it('should handle missing indexImage gracefully', () => {
		const items: BbcDataItem[] = [
			{
				path: '/news/articles/no-image',
				type: 'article',
				title: 'No image article',
				indexImage: { model: { blocks: {} } },
			},
		];
		const articles = parseDataItems(items);
		expect(articles[0].imageUrl).toBeUndefined();
	});
});
