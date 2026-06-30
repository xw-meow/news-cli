import { describe, it, expect } from 'vitest';
import { parseArticles, parseChannelList } from '../../../src/news-source/huxiu/parser.js';
import type {
  HuxiuArticleItem,
  HuxiuChannelListResponse,
} from '../../../src/news-source/huxiu/parser.js';

const makeItem = (overrides: Partial<HuxiuArticleItem> = {}): HuxiuArticleItem => ({
  aid: 4867841,
  title: '程序员用代码写情书对方报了个SyntaxError',
  pic_path: 'https://img.huxiucdn.com/cover/001.jpg',
  url: 'https://www.huxiu.com/article/4867841.html',
  dateline: 1781612008,
  is_original: false,
  label: '',
  is_none_headpic: false,
  is_video_article: false,
  count_info: { favorite_num: 0, total_comment_num: 0 },
  user_info: {
    uid: 10001,
    username: '测试作者',
    avatar: 'https://img.huxiucdn.com/avatar/001.jpg',
    ip_url: '',
  },
  video_info: { duration: '' },
  ...overrides,
});

const mockChannelResponse: HuxiuChannelListResponse = {
  success: true,
  data: [
    { channel_id: 105, name: '前沿科技' },
    { channel_id: 21, name: '车与出行' },
    { channel_id: 103, name: '商业消费' },
  ],
};

describe('parseChannelList', () => {
  it('should return channel names', () => {
    const names = parseChannelList(mockChannelResponse);
    expect(names).toEqual(['前沿科技', '车与出行', '商业消费']);
  });

  it('should return empty array when not success', () => {
    expect(parseChannelList({ success: false, data: [] })).toEqual([]);
  });

  it('should return empty array when data is missing', () => {
    expect(
      parseChannelList({ success: true, data: null as unknown as never[] }),
    ).toEqual([]);
  });
});

describe('parseArticles', () => {
  it('should parse articles from datalist', () => {
    const items = [
      makeItem(),
      makeItem({ aid: 4867842, title: 'AI学会了摸鱼被老板当场抓包' }),
    ];
    const articles = parseArticles(items);
    expect(articles).toHaveLength(2);
  });

  it('should extract title', () => {
    const articles = parseArticles([makeItem()]);
    expect(articles[0].title).toBe('程序员用代码写情书对方报了个SyntaxError');
  });

  it('should generate URL when not provided', () => {
    const articles = parseArticles([
      makeItem({ aid: 12345, url: '' }),
    ]);
    expect(articles[0].url).toBe('https://www.huxiu.com/article/12345.html');
  });

  it('should set source to 虎嗅网', () => {
    const articles = parseArticles([makeItem()]);
    expect(articles[0].source).toBe('虎嗅网');
  });

  it('should convert dateline to ISO 8601', () => {
    const articles = parseArticles([makeItem({ dateline: 1781612008 })]);
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should leave publishedAt undefined for zero dateline', () => {
    const articles = parseArticles([makeItem({ dateline: 0 })]);
    expect(articles[0].publishedAt).toBeUndefined();
  });

  it('should use label as snippet', () => {
    const articles = parseArticles([makeItem({ label: '深度' })]);
    expect(articles[0].snippet).toBe('深度');
  });

  it('should leave snippet undefined for empty label', () => {
    const articles = parseArticles([makeItem({ label: '' })]);
    expect(articles[0].snippet).toBeUndefined();
  });

  it('should set category when provided', () => {
    const articles = parseArticles([makeItem()], '前沿科技');
    expect(articles[0].category).toBe('前沿科技');
  });

  it('should generate unique SHA-256 IDs', () => {
    const articles = parseArticles([
      makeItem(),
      makeItem({ aid: 99999, url: 'https://www.huxiu.com/article/99999.html' }),
    ]);
    expect(articles[0].id).toHaveLength(12);
    expect(articles[1].id).toHaveLength(12);
    expect(articles[0].id).not.toBe(articles[1].id);
  });

  it('should use pic_path as imageUrl', () => {
    const articles = parseArticles([makeItem()]);
    expect(articles[0].imageUrl).toBe('https://img.huxiucdn.com/cover/001.jpg');
  });
});
