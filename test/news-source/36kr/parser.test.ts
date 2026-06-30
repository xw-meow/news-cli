import { describe, it, expect } from 'vitest';
import { parseArticles } from '../../../src/news-source/36kr/parser.js';
import type { KrNewsItem } from '../../../src/news-source/36kr/parser.js';

const mockItems: KrNewsItem[] = [
    {
        itemId: 1001,
        route: 'detail_article?itemId=123456',
        templateMaterial: {
            widgetTitle: 'SpaceX完成史上最大规模IPO',
            widgetImage: 'https://img.36kr.com/abc.jpg',
            publishTime: 1718548800000,
            summary: '马斯克敲钟前激动讲话',
        },
    },
    {
        itemId: 1002,
        route: 'detail_article?itemId=789012',
        templateMaterial: {
            widgetTitle: 'AI应用层的泡沫被戳破',
            publishTime: 1718559600000,
            summary: '生成式AI爆发三年半后进入分歧点',
        },
    },
    {
        itemId: 1003,
        route: 'detail_article?itemId=empty-title',
        templateMaterial: {
            widgetTitle: '',
        },
    },
    {
        itemId: 1004,
        templateMaterial: {
            widgetTitle: 'No route item',
        },
    },
];

describe('parseArticles', () => {
    it('should parse articles with all fields', () => {
        const articles = parseArticles(mockItems, '最新');
        expect(articles).toHaveLength(2);

        const a1 = articles[0];
        expect(a1.title).toBe('SpaceX完成史上最大规模IPO');
        expect(a1.url).toBe('https://36kr.com/p/123456');
        expect(a1.source).toBe('36氪');
        expect(a1.snippet).toBe('马斯克敲钟前激动讲话');
        expect(a1.imageUrl).toBe('https://img.36kr.com/abc.jpg');
        expect(a1.category).toBe('最新');
        expect(a1.publishedAt).toBeDefined();
        expect(a1.id).toHaveLength(12);
    });

    it('should parse publishTime ms to ISO', () => {
        const articles = parseArticles(mockItems, '最新');
        expect(articles[0].publishedAt).toContain('2024-06-16');
    });

    it('should handle items without imageUrl', () => {
        const articles = parseArticles(mockItems, '最新');
        expect(articles[1].imageUrl).toBeUndefined();
    });

    it('should filter items without title', () => {
        const articles = parseArticles(mockItems, '最新');
        expect(articles.find((a) => a.title === '')).toBeUndefined();
    });

    it('should filter items without route', () => {
        const articles = parseArticles(mockItems, '最新');
        expect(articles.find((a) => a.title === 'No route item')).toBeUndefined();
    });

    it('should handle empty array', () => {
        const articles = parseArticles([], '最新');
        expect(articles).toEqual([]);
    });

    it('should handle missing optional fields', () => {
        const items: KrNewsItem[] = [
            {
                itemId: 1,
                route: 'detail_article?itemId=min',
                templateMaterial: {
                    widgetTitle: 'Minimal',
                },
            },
        ];
        const articles = parseArticles(items, '最新');
        expect(articles).toHaveLength(1);
        expect(articles[0].title).toBe('Minimal');
        expect(articles[0].source).toBe('36氪');
        expect(articles[0].snippet).toBeUndefined();
        expect(articles[0].publishedAt).toBeUndefined();
        expect(articles[0].imageUrl).toBeUndefined();
    });

    it('should handle invalid publishTime (0)', () => {
        const items: KrNewsItem[] = [
            {
                itemId: 1,
                route: 'detail_article?itemId=test',
                templateMaterial: {
                    widgetTitle: 'Test',
                    publishTime: 0,
                },
            },
        ];
        const articles = parseArticles(items, '最新');
        expect(articles[0].publishedAt).toBeUndefined();
    });

    it('should handle missing templateMaterial', () => {
        const items: KrNewsItem[] = [
            { itemId: 1 },
        ];
        const articles = parseArticles(items, '最新');
        expect(articles).toEqual([]);
    });

    it('should build url from route without itemId param', () => {
        const items: KrNewsItem[] = [
            {
                itemId: 9999,
                route: 'detail_article',
                templateMaterial: {
                    widgetTitle: 'Fallback itemId',
                },
            },
        ];
        const articles = parseArticles(items, '最新');
        expect(articles).toHaveLength(1);
        expect(articles[0].url).toBe('https://36kr.com/p/9999');
    });
});
