import { describe, it, expect } from 'vitest';
import { parseArticles } from '../../../src/news-source/qbitai/parser.js';

// 标准文章（有图、摘要、作者、相对时间）
const standardArticle = `
<div class="picture_text">
  <div class="picture"><a href="https://www.qbitai.com/2026/07/451371.html" target="_blank"><img width="319" height="136" src="https://i.qbitai.com/wp-content/uploads/2026/07/c7e885c059fcf4fa929d4285c355a07f.jpeg" /></a></div>
  <div class="text_box">
    <h4><a href="https://www.qbitai.com/2026/07/451371.html" target="_blank">工业母机进入“计算化时刻”</a></h4>
    <p><p>摘要内容第一段</p></p>
    <div class="info">
      <span class="author"><a href="/?author=19">量子位</a></span>
      <span class="time">10分钟前</span>
      <div class="tags_s"><a href="https://www.qbitai.com/tag/example" rel="tag">示例标签</a></div>
    </div>
  </div>
</div>`;

// 无图文章
const noImageArticle = `
<div class="picture_text">
  <div class="picture"><a href="https://www.qbitai.com/2026/07/451379.html" target="_blank"></a></div>
  <div class="text_box">
    <h4><a href="https://www.qbitai.com/2026/07/451379.html" target="_blank">RLinf v0.3来了！</a></h4>
    <p></p>
    <div class="info">
      <span class="author"><a href="/?author=54">衡宇</a></span>
      <span class="time">1小时前 </span>
    </div>
  </div>
</div>`;

// 昨天具体时间
const yesterdayArticle = `
<div class="picture_text">
  <div class="picture"><a href="https://www.qbitai.com/2026/07/450831.html" target="_blank"><img src="https://i.qbitai.com/wp-content/uploads/2026/07/450831.png" /></a></div>
  <div class="text_box">
    <h4><a href="https://www.qbitai.com/2026/07/450831.html" target="_blank">WAIC 2026主论坛重磅揭晓！</a></h4>
    <p></p>
    <div class="info">
      <span class="author"><a href="/?author=19">量子位</a></span>
      <span class="time">昨天 17:18</span>
    </div>
  </div>
</div>`;

describe('parseArticles', () => {
  it('should return empty array for empty input', () => {
    expect(parseArticles('')).toEqual([]);
    expect(parseArticles('<div>no articles here</div>')).toEqual([]);
  });

  it('should parse a standard article', () => {
    const articles = parseArticles(standardArticle);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('工业母机进入“计算化时刻”');
    expect(articles[0].url).toBe('https://www.qbitai.com/2026/07/451371.html');
    expect(articles[0].source).toBe('量子位');
    expect(articles[0].snippet).toBe('摘要内容第一段');
    expect(articles[0].imageUrl).toContain('qbitai.com');
    expect(articles[0].publishedAt).toBeDefined();
  });

  it('should parse no-image article', () => {
    const articles = parseArticles(noImageArticle);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('RLinf v0.3来了！');
    expect(articles[0].imageUrl).toBeUndefined();
    expect(articles[0].publishedAt).toBeDefined();
  });

  it('should parse "昨天 HH:MM" time', () => {
    const articles = parseArticles(yesterdayArticle);
    expect(articles).toHaveLength(1);
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should leave snippet undefined when empty', () => {
    const articles = parseArticles(noImageArticle);
    expect(articles[0].snippet).toBeUndefined();
  });

  it('should not use title as snippet', () => {
    const html = `
      <div class="picture_text">
        <div class="text_box">
          <h4><a href="https://www.qbitai.com/2026/07/1.html">重复标题</a></h4>
          <p><p>重复标题</p></p>
          <div class="info"><span class="time">2小时前</span></div>
        </div>
      </div>`;
    const articles = parseArticles(html);
    expect(articles[0].snippet).toBeUndefined();
  });

  it('should generate unique SHA-256 IDs from URL', () => {
    const html = `
      <div class="picture_text">
        <div class="text_box">
          <h4><a href="https://www.qbitai.com/2026/07/001.html">文章一</a></h4>
          <div class="info"><span class="time">1小时前</span></div>
        </div>
      </div>
      <div class="picture_text">
        <div class="text_box">
          <h4><a href="https://www.qbitai.com/2026/07/002.html">文章二</a></h4>
          <div class="info"><span class="time">2小时前</span></div>
        </div>
      </div>`;
    const articles = parseArticles(html);
    expect(articles).toHaveLength(2);
    expect(articles[0].id).toHaveLength(12);
    expect(articles[1].id).toHaveLength(12);
    expect(articles[0].id).not.toBe(articles[1].id);
  });

  it('should deduplicate repeated URLs', () => {
    const html = `
      <div class="picture_text">
        <div class="text_box">
          <h4><a href="https://www.qbitai.com/2026/07/001.html">文章一</a></h4>
          <div class="info"><span class="time">1小时前</span></div>
        </div>
      </div>
      <div class="picture_text">
        <div class="text_box">
          <h4><a href="https://www.qbitai.com/2026/07/001.html">文章一重复</a></h4>
          <div class="info"><span class="time">1小时前</span></div>
        </div>
      </div>`;
    const articles = parseArticles(html);
    expect(articles).toHaveLength(1);
  });

  it('should set category when provided', () => {
    const articles = parseArticles(standardArticle, '资讯');
    expect(articles[0].category).toBe('资讯');
  });

  it('should skip blocks without article URL', () => {
    const html = `
      <div class="picture_text">
        <div class="text_box"><h4>无链接标题</h4></div>
      </div>
      ${standardArticle}`;
    const articles = parseArticles(html);
    expect(articles).toHaveLength(1);
  });

  it('should decode HTML entities in title', () => {
    const html = `
      <div class="picture_text">
        <div class="text_box">
          <h4><a href="https://www.qbitai.com/2026/07/001.html">标题 &amp; 测试 &#176;C</a></h4>
          <div class="info"><span class="time">1小时前</span></div>
        </div>
      </div>`;
    const articles = parseArticles(html);
    expect(articles[0].title).toBe('标题 & 测试 °C');
  });

  it('should parse multiple articles from mixed HTML', () => {
    const html = [standardArticle, noImageArticle, yesterdayArticle].join('\n');
    const articles = parseArticles(html);
    expect(articles).toHaveLength(3);
    expect(articles.map((a) => a.title)).toEqual([
      '工业母机进入“计算化时刻”',
      'RLinf v0.3来了！',
      'WAIC 2026主论坛重磅揭晓！',
    ]);
  });
});
