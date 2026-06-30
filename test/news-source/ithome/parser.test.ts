import { describe, it, expect } from 'vitest';
import { parseArticles, getLastDataOt } from '../../../src/news-source/ithome/parser.js';

// 含 HTML 实体的 AJAX 分页片段
const ajaxFragment = `
<li>
  <a href="https://www.ithome.com/0/964/100.htm" target="_blank" class="img"><img class="lazy" alt="分页新闻" data-original="https://img.ithome.com/newsuploadfiles/thumbnail/2026/6/964100_240.jpg" /></a>
  <div class="c" data-ot="2026-06-14T10:00:00.0000000+08:00">
    <h2 class="">
      <a title="分页新闻标题" target="_blank" href="https://www.ithome.com/0/964/100.htm" class="title">分页新闻标题</a>
    </h2>
    <div class="m">AJAX分页加载的新闻摘要</div>
    <div class="o">
      <div class="d"><span class="state">06-14 10:00</span></div>
    </div>
  </div>
</li>
`;

describe('parseArticles', () => {
  it('should return empty array for empty input', () => {
    expect(parseArticles('')).toEqual([]);
    expect(parseArticles('<div>no list here</div>')).toEqual([]);
  });

  it('should parse articles from HTML with data-ot markers', () => {
    // 内联构建简单 HTML，避免文件读取
    const html = `
      <ul class="bl">
        <li>
          <a href="https://www.ithome.com/0/964/001.htm" target="_blank" class="img">
            <img class="lazy" data-original="https://img.ithome.com/thumb/001.jpg" />
          </a>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2>
              <a title="测试标题一" href="https://www.ithome.com/0/964/001.htm" class="title">测试标题一</a>
            </h2>
            <div class="m">测试摘要一</div>
          </div>
        </li>
        <li>
          <div class="c" data-ot="2026-06-15T10:00:00.0000000+08:00">
            <h2>
              <a title="测试标题二" href="https://www.ithome.com/0/964/002.htm" class="title">测试标题二</a>
            </h2>
            <div class="m">测试摘要 &amp; 特殊字符 &#176; 测试</div>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles).toHaveLength(2);
  });

  it('should extract title from class="title" link', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2>
              <a title="ALT TEXT" target="_blank" href="https://www.ithome.com/0/964/001.htm" class="title">新闻标题内容</a>
            </h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].title).toBe('新闻标题内容');
  });

  it('should decode HTML entities in title and snippet', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2>
              <a href="https://www.ithome.com/0/964/001.htm" class="title">标题 &amp; 内容 &#176;C</a>
            </h2>
            <div class="m">摘要 &lt;测试&gt; &quot;内容&quot;</div>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].title).toBe('标题 & 内容 °C');
    expect(articles[0].snippet).toBe('摘要 <测试> "内容"');
  });

  it('should extract URL from title link', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2>
              <a href="https://www.ithome.com/0/964/572.htm" class="title">新闻标题</a>
            </h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].url).toBe('https://www.ithome.com/0/964/572.htm');
  });

  it('should set source to IT之家', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].source).toBe('IT之家');
  });

  it('should extract snippet', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
            <div class="m">这是一段新闻摘要内容</div>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].snippet).toBe('这是一段新闻摘要内容');
  });

  it('should leave snippet undefined when no div.m', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].snippet).toBeUndefined();
  });

  it('should extract imageUrl from data-original', () => {
    const html = `
      <ul class="bl">
        <li>
          <a href="https://www.ithome.com/0/964/001.htm" class="img">
            <img class="lazy" data-original="https://img.ithome.com/thumb/001.jpg" />
          </a>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].imageUrl).toBe('https://img.ithome.com/thumb/001.jpg');
  });

  it('should leave imageUrl undefined when no image', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].imageUrl).toBeUndefined();
  });

  it('should parse ISO timestamp to ISO 8601', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T20:47:10.7930000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should parse slash timestamp format (专题页)', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026/6/10 13:16:22">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should leave publishedAt undefined for unrecognized timestamp', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="invalid">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].publishedAt).toBeUndefined();
  });

  it('should generate unique SHA-256 IDs from URL', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题一</a></h2>
          </div>
        </li>
        <li>
          <div class="c" data-ot="2026-06-15T10:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/002.htm" class="title">标题二</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].id).toHaveLength(12);
    expect(articles[1].id).toHaveLength(12);
    expect(articles[0].id).not.toBe(articles[1].id);
  });

  it('should set category when provided', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html, '业界');
    expect(articles[0].category).toBe('业界');
  });

  it('should leave category undefined when not provided', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].category).toBeUndefined();
  });

  it('should skip li blocks without data-ot', () => {
    const html = `
      <ul class="bl">
        <li><div>no data-ot here</div></li>
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2><a href="https://www.ithome.com/0/964/001.htm" class="title">有效标题</a></h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('有效标题');
  });

  it('should skip li blocks without title link', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2>无链接标题</h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles).toHaveLength(0);
  });

  it('should handle title with class="title" before href', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2>
              <a class="title" target="_blank" href="https://www.ithome.com/0/964/001.htm">属性顺序不同的标题</a>
            </h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles).toHaveLength(1);
    expect(articles[0].url).toBe('https://www.ithome.com/0/964/001.htm');
    expect(articles[0].title).toBe('属性顺序不同的标题');
  });

  it('should parse AJAX pagination fragment', () => {
    const articles = parseArticles(ajaxFragment);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('分页新闻标题');
    expect(articles[0].url).toBe('https://www.ithome.com/0/964/100.htm');
    expect(articles[0].snippet).toBe('AJAX分页加载的新闻摘要');
    expect(articles[0].imageUrl).toBe('https://img.ithome.com/newsuploadfiles/thumbnail/2026/6/964100_240.jpg');
  });

  it('should strip HTML tags from title', () => {
    const html = `
      <ul class="bl">
        <li>
          <div class="c" data-ot="2026-06-15T12:00:00.0000000+08:00">
            <h2>
              <a href="https://www.ithome.com/0/964/001.htm" class="title">标题<font color="red">红色部分</font>结束</a>
            </h2>
          </div>
        </li>
      </ul>`;

    const articles = parseArticles(html);
    expect(articles[0].title).toBe('标题红色部分结束');
  });
});

describe('getLastDataOt', () => {
  it('should return last data-ot value from HTML', () => {
    const html = `
      <div class="c" data-ot="2026-06-15T20:47:10+08:00">...</div>
      <div class="c" data-ot="2026-06-15T17:48:45+08:00">...</div>
      <div class="c" data-ot="2026-06-15T16:30:00+08:00">...</div>`;

    expect(getLastDataOt(html)).toBe('2026-06-15T16:30:00+08:00');
  });

  it('should return undefined for HTML without data-ot', () => {
    expect(getLastDataOt('<div>no data</div>')).toBeUndefined();
  });

  it('should return the only data-ot when single match', () => {
    expect(getLastDataOt('<div class="c" data-ot="2026-06-15T12:00:00+08:00">')).toBe(
      '2026-06-15T12:00:00+08:00',
    );
  });
});
