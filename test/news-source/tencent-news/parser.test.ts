import { describe, it, expect } from 'vitest';
import { parseArticles } from '../../../src/news-source/tencent-news/parser.js';
import type { TencentNewsItem } from '../../../src/news-source/tencent-news/parser.js';

const mockItems: TencentNewsItem[] = [
	{
		id: '20260615V0500G00',
		title: '马斯克敲钟前激动讲话',
		articletype: '4',
		publish_time: '2026-06-15 13:24:45',
		pic_info: {
			big_img: ['https://inews.gtimg.com/om_ls/abc.jpg'],
			small_img: ['https://inews.gtimg.com/om_ls/small.jpg'],
		},
		link_info: {
			share_url: 'https://view.inews.qq.com/a/20260615V0500G00',
			url: 'https://new.qq.com/rain/a/20260615V0500G00',
		},
		media_info: {
			chl_id: '20242581',
			chl_name: '硬核翻译局',
		},
		desc: 'SpaceX完成史上最大规模IPO',
	},
	{
		id: '20260615A0800L00',
		title: 'AI应用层的泡沫被戳破',
		publish_time: '2026-06-15 18:02:53',
		pic_info: {
			small_img: ['https://inews.gtimg.com/small.jpg'],
		},
		link_info: {
			share_url: 'https://view.inews.qq.com/a/20260615A0800L00',
		},
		media_info: {
			chl_name: 'AI未来指北',
		},
		desc: '生成式AI爆发三年半后进入分歧点',
	},
	{
		id: '',
		title: 'No ID article',
	},
];

describe('parseArticles', () => {
	it('should parse articles with all fields', () => {
		const articles = parseArticles(mockItems, '科技/AI');
		expect(articles).toHaveLength(2);

		const a1 = articles[0];
		expect(a1.title).toBe('马斯克敲钟前激动讲话');
		expect(a1.source).toBe('硬核翻译局');
		expect(a1.snippet).toBe('SpaceX完成史上最大规模IPO');
		expect(a1.imageUrl).toBe('https://inews.gtimg.com/om_ls/abc.jpg');
		expect(a1.url).toBe('https://new.qq.com/rain/a/20260615V0500G00');
		expect(a1.category).toBe('科技/AI');
		expect(a1.publishedAt).toBeDefined();
		expect(a1.id).toHaveLength(12);
	});

	it('should parse publish_time to ISO', () => {
		const articles = parseArticles(mockItems, '科技/AI');
		expect(articles[0].publishedAt).toContain('2026-06-15');
	});

	it('should fall back to small_img when big_img missing', () => {
		const articles = parseArticles(mockItems, '科技/AI');
		expect(articles[1].imageUrl).toBe('https://inews.gtimg.com/small.jpg');
	});

	it('should fall back to share_url when url missing', () => {
		const articles = parseArticles(mockItems, '科技/AI');
		expect(articles[1].url).toBe('https://view.inews.qq.com/a/20260615A0800L00');
	});

	it('should filter items without id', () => {
		const articles = parseArticles(mockItems, '科技/AI');
		expect(articles).toHaveLength(2);
	});

	it('should handle empty array', () => {
		const articles = parseArticles([], '科技/AI');
		expect(articles).toEqual([]);
	});

	it('should handle missing optional fields', () => {
		const items: TencentNewsItem[] = [
			{ id: '1', title: 'Minimal' },
		];
		const articles = parseArticles(items, '科技/AI');
		expect(articles).toHaveLength(1);
		expect(articles[0].title).toBe('Minimal');
		expect(articles[0].source).toBe('腾讯新闻');
		expect(articles[0].snippet).toBeUndefined();
		expect(articles[0].publishedAt).toBeUndefined();
		expect(articles[0].imageUrl).toBeUndefined();
	});

	it('should handle invalid publish_time', () => {
		const items: TencentNewsItem[] = [
			{ id: '1', title: 'Test', publish_time: 'invalid' },
		];
		const articles = parseArticles(items, '科技/AI');
		expect(articles[0].publishedAt).toBeUndefined();
	});
});
