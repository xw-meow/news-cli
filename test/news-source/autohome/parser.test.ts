import { describe, it, expect } from 'vitest';
import { parseArticles } from '../../../src/news-source/autohome/parser.js';

// 标准文章（有 h3 + 时间 + 摘要）
const standardArticle = `
<li>
  <a href="//www.autohome.com.cn/news/202506/1315069.html#pvareaid=102624">
    <img src="//img3.autoimg.cn/chejiahaodfs/g30/M00/XX/XX/400x300_0_autohomecar__abc123.png">
    <h3>某品牌发布新款车型 售价XX万元起</h3>
    <div class="meta">
      <span>3小时前</span>
    </div>
    <p>[汽车之家 新车上市] 近日，某品牌正式发布了旗下全新车型</p>
  </a>
</li>`;

// 置顶文章（有 h3 + 描述，无时间戳）
const featuredArticle = `
<li>
  <a href="//www.autohome.com.cn/advice/202506/1315070.html#pvareaid=102623">
    <h3>购车指南：XX万预算买什么车</h3>
    <p>面对市场上琳琅满目的车型，消费者往往难以抉择</p>
    <img src="//img3.autoimg.cn/chejiahaodfs/g30/M00/XX/XX/400x300_0_autohomecar__def456.png">
  </a>
</li>`;

// 快讯（无 h3，用 p 作标题）
const fastNewsArticle = `
<li>
  <a href="//www.autohome.com.cn/202506/1315071.html#pvareaid=6849221">
    <img src="//img3.autoimg.cn/chejiahaodfs/g30/M00/XX/XX/400x300_0_autohomecar__ghi789.png">
    <p>某品牌AD Max系统迎来重大更新 VLA模型上车</p>
    <div class="meta">
      <span>1天前</span>
    </div>
  </a>
</li>`;

// 侧边栏热点（有 h4，应被过滤）
const sidebarArticle = `
<li>
  <a href="//www.autohome.com.cn/news/202506/1315072.html#pvareaid=102625">
    <h4>热点新闻标题</h4>
    <img src="//img3.autoimg.cn/chejiahaodfs/g30/M00/XX/XX/120x90_0_autohomecar__jkl012.png" width="120" height="90">
    <p>[汽车之家 行业] 热点新闻摘要内容</p>
  </a>
</li>`;

// 导航类 li（无文章链接，应被过滤）
const navItem = `
<li class="nav-item">
  <a href="//www.autohome.com.cn/all/">全部</a>
</li>`;

describe('parseArticles', () => {
  it('should return empty array for empty input', () => {
    expect(parseArticles('')).toEqual([]);
    expect(parseArticles('<div>no list here</div>')).toEqual([]);
  });

  it('should parse a standard article with h3 title', () => {
    const articles = parseArticles(standardArticle);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('某品牌发布新款车型 售价XX万元起');
    expect(articles[0].url).toBe('https://www.autohome.com.cn/news/202506/1315069.html');
    expect(articles[0].source).toBe('汽车之家');
  });

  it('should parse a featured article without timestamp', () => {
    const articles = parseArticles(featuredArticle);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('购车指南：XX万预算买什么车');
    expect(articles[0].publishedAt).toBeUndefined();
  });

  it('should parse fast-news article with p as title', () => {
    const articles = parseArticles(fastNewsArticle);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('某品牌AD Max系统迎来重大更新 VLA模型上车');
  });

  it('should skip sidebar items with h4', () => {
    const articles = parseArticles(sidebarArticle);
    expect(articles).toHaveLength(0);
  });

  it('should skip navigation items without article URL', () => {
    const articles = parseArticles(navItem);
    expect(articles).toHaveLength(0);
  });

  it('should strip #pvareaid fragment from URL', () => {
    const articles = parseArticles(standardArticle);
    expect(articles[0].url).not.toContain('#pvareaid');
    expect(articles[0].url).toBe('https://www.autohome.com.cn/news/202506/1315069.html');
  });

  it('should prepend https: to protocol-relative URLs', () => {
    const articles = parseArticles(standardArticle);
    expect(articles[0].url).toMatch(/^https:\/\//);
    expect(articles[0].imageUrl).toMatch(/^https:\/\//);
  });

  it('should extract image URL', () => {
    const articles = parseArticles(standardArticle);
    expect(articles[0].imageUrl).toBe(
      'https://img3.autoimg.cn/chejiahaodfs/g30/M00/XX/XX/400x300_0_autohomecar__abc123.png',
    );
  });

  it('should leave imageUrl undefined when no image', () => {
    const html = `
      <li>
        <a href="//www.autohome.com.cn/news/202506/1315069.html#pvareaid=102624">
          <h3>无图新闻标题</h3>
          <div class="meta"><span>5小时前</span></div>
        </a>
      </li>`;
    const articles = parseArticles(html);
    expect(articles[0].imageUrl).toBeUndefined();
  });

  it('should parse relative time "X小时前"', () => {
    const articles = parseArticles(standardArticle);
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should parse relative time "X天前"', () => {
    const articles = parseArticles(fastNewsArticle);
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should parse relative time "X分钟前"', () => {
    const html = `
      <li>
        <a href="//www.autohome.com.cn/news/202506/1315069.html#pvareaid=102624">
          <h3>刚刚发布的新闻</h3>
          <div class="meta"><span>30分钟前</span></div>
        </a>
      </li>`;
    const articles = parseArticles(html);
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should extract snippet and strip [来源] prefix', () => {
    const articles = parseArticles(standardArticle);
    expect(articles[0].snippet).toBe('近日，某品牌正式发布了旗下全新车型');
  });

  it('should leave snippet undefined when no description p', () => {
    const html = `
      <li>
        <a href="//www.autohome.com.cn/news/202506/1315069.html#pvareaid=102624">
          <h3>纯标题新闻</h3>
          <div class="meta"><span>2小时前</span></div>
        </a>
      </li>`;
    const articles = parseArticles(html);
    expect(articles[0].snippet).toBeUndefined();
  });

  it('should not use title text as snippet', () => {
    const html = `
      <li>
        <a href="//www.autohome.com.cn/202506/1315071.html#pvareaid=6849221">
          <p>快讯标题就是正文</p>
          <div class="meta"><span>1天前</span></div>
        </a>
      </li>`;
    const articles = parseArticles(html);
    // 标题是 p 内容，没有额外的 snippet
    expect(articles[0].title).toBe('快讯标题就是正文');
    expect(articles[0].snippet).toBeUndefined();
  });

  it('should generate unique SHA-256 IDs from URL', () => {
    const html = `
      <li>
        <a href="//www.autohome.com.cn/news/202506/001.html#pvareaid=102624">
          <h3>文章一</h3>
          <div class="meta"><span>1小时前</span></div>
        </a>
      </li>
      <li>
        <a href="//www.autohome.com.cn/news/202506/002.html#pvareaid=102624">
          <h3>文章二</h3>
          <div class="meta"><span>2小时前</span></div>
        </a>
      </li>`;
    const articles = parseArticles(html);
    expect(articles).toHaveLength(2);
    expect(articles[0].id).toHaveLength(12);
    expect(articles[1].id).toHaveLength(12);
    expect(articles[0].id).not.toBe(articles[1].id);
  });

  it('should set category when provided', () => {
    const articles = parseArticles(standardArticle, '车闻');
    expect(articles[0].category).toBe('车闻');
  });

  it('should leave category undefined when not provided', () => {
    const articles = parseArticles(standardArticle);
    expect(articles[0].category).toBeUndefined();
  });

  it('should skip li blocks without article URL', () => {
    const html = `
      <li><div>no link here</div></li>
      ${standardArticle}`;
    const articles = parseArticles(html);
    expect(articles).toHaveLength(1);
  });

  it('should decode HTML entities in title', () => {
    const html = `
      <li>
        <a href="//www.autohome.com.cn/news/202506/001.html#pvareaid=102624">
          <h3>标题 &amp; 特殊字符 &#176;C 测试</h3>
          <div class="meta"><span>1小时前</span></div>
        </a>
      </li>`;
    const articles = parseArticles(html);
    expect(articles[0].title).toBe('标题 & 特殊字符 °C 测试');
  });

  it('should strip HTML tags from title', () => {
    const html = `
      <li>
        <a href="//www.autohome.com.cn/news/202506/001.html#pvareaid=102624">
          <h3>标题<font color="red">红色</font>结束</h3>
          <div class="meta"><span>1小时前</span></div>
        </a>
      </li>`;
    const articles = parseArticles(html);
    expect(articles[0].title).toBe('标题红色结束');
  });

  it('should parse multiple articles from mixed HTML', () => {
    const html = [
      navItem,
      standardArticle,
      featuredArticle,
      fastNewsArticle,
      sidebarArticle,
    ].join('\n');
    const articles = parseArticles(html);
    // 导航和侧边栏被过滤，标准+置顶+快讯 = 3
    expect(articles).toHaveLength(3);
  });
});
