import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { kr36Source } from '../../../src/news-source/36kr/index.js';
import type { KrApiResponse } from '../../../src/news-source/36kr/parser.js';

const mockResponse: KrApiResponse = {
    code: 0,
    data: {
        itemList: [
            {
                itemId: 1001,
                templateMaterial: {
                    widgetTitle: '马斯克敲钟前激动讲话：SpaceX的使命',
                    widgetUrl: 'https://36kr.com/p/123456',
                    widgetImage: 'https://img.36kr.com/abc.jpg',
                    publishTime: 1718548800000,
                    snippet: 'SpaceX完成史上最大规模IPO',
                },
            },
            {
                itemId: 1002,
                templateMaterial: {
                    widgetTitle: 'AI应用层的泡沫被戳破',
                    widgetUrl: 'https://36kr.com/p/789012',
                    publishTime: 1718559600000,
                    snippet: '生成式AI爆发三年半后进入分歧点',
                },
            },
            {
                itemId: 1003,
                templateMaterial: {
                    widgetTitle: '英伟达市值突破',
                    widgetUrl: 'https://36kr.com/p/345678',
                    publishTime: 1718563200000,
                    snippet: '英伟达市值突破6万亿美元',
                },
            },
        ],
    },
};

describe('kr36Source', () => {
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

    it('should have name "36kr"', () => {
        expect(kr36Source.name).toBe('36kr');
    });

    it('should have a description', () => {
        expect(kr36Source.description).toBeTruthy();
    });

    describe('listCategories', () => {
        it('should return 6 categories', async () => {
            const cats = await kr36Source.listCategories();
            expect(cats).toHaveLength(6);
            expect(cats).toContain('资讯');
            expect(cats).toContain('推荐');
            expect(cats).toContain('企服');
            expect(cats).toContain('科技');
            expect(cats).toContain('金融');
            expect(cats).toContain('创业');
        });
    });

    describe('fetch', () => {
        it('should fetch articles defaulting to 资讯', async () => {
            const articles = await kr36Source.fetch();
            expect(articles).toHaveLength(3);
            expect(articles[0].title).toContain('马斯克');
            expect(articles[0].category).toBe('资讯');
            expect(articles[0].source).toBe('36氪');
        });

        it('should support category selection by display name', async () => {
            const articles = await kr36Source.fetch({ category: '科技' });
            expect(articles[0].category).toBe('科技');
        });

        it('should support category selection by subnavNick', async () => {
            const articles = await kr36Source.fetch({ category: 'web_tech' });
            expect(articles[0].category).toBe('科技');
        });

        it('should support keyword filter', async () => {
            const articles = await kr36Source.fetch({ keyword: '英伟达' });
            expect(articles).toHaveLength(1);
            expect(articles[0].title).toContain('英伟达');
        });

        it('should respect limit', async () => {
            const articles = await kr36Source.fetch({ limit: 1 });
            expect(articles).toHaveLength(1);
        });

        it('should support OR keyword', async () => {
            const articles = await kr36Source.fetch({ keyword: '马斯克,英伟达' });
            expect(articles).toHaveLength(2);
        });

        it('should fallback to default for unknown category', async () => {
            const articles = await kr36Source.fetch({ category: '未知' });
            expect(articles[0].category).toBe('资讯');
        });

        it('should return empty when API returns no data', async () => {
            vi.restoreAllMocks();
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ code: 0, data: { itemList: [] } }), {
                    status: 200,
                }),
            );
            const articles = await kr36Source.fetch();
            expect(articles).toEqual([]);
        });

        it('should return empty when API returns null data', async () => {
            vi.restoreAllMocks();
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ code: 0, data: null }), {
                    status: 200,
                }),
            );
            const articles = await kr36Source.fetch();
            expect(articles).toEqual([]);
        });
    });
});
