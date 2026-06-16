import { describe, it, expect } from 'vitest';
import { parseArticles } from '../../../src/news-source/people-cn/parser.js';

const HTML_TODAY = `
<table id="ta_1" style="display:block;">
  <tr>
    <td class="p6">
      <li><a href="http://politics.people.com.cn/n1/2026/0616/c1001-00001.html" target="_blank">科学家发现猫其实会微积分但懒得用</a> [2026年06月16日16:46]</li>
      <li><a href="http://society.people.com.cn/n1/2026/0616/c1008-00002.html" target="_blank">男子把冰箱当空调吹了一周才发现没插电</a> [2026年06月16日16:12]</li>
      <li><a href="http://finance.people.com.cn/n1/2026/0616/c1004-00003.html" target="_blank">小区保安用脸解锁手机结果邻居全都刷开了</a> [2026年06月16日15:02]</li>
    </td>
  </tr>
</table>`;

const HTML_SIMPLE_TIME = `
<table id="ta_1" style="display:block;">
  <tr>
    <td class="p6">
      <li><a href="http://xz.people.com.cn/n2/2026/0616/c138901-00004.html" target="_blank">小学生发明自动写作业机被同学联名举报</a> [06月16日18:07]</li>
    </td>
  </tr>
</table>`;

const HTML_MULTI_LINK = `
<table id="ta_1" style="display:block;">
  <tr>
    <td class="p6">
      <li><a href="http://finance.people.com.cn/GB/8215/461663/462286/index.html" target="_blank">深度调研丨</a><a href="http://finance.people.com.cn/n1/2026/0616/c1004-00005.html" target="_blank">为什么程序员总觉得自己写的代码是屎山</a> [2026年06月16日12:02]</li>
    </td>
  </tr>
</table>`;

const HTML_NO_TIME = `
<table id="ta_1" style="display:block;">
  <tr>
    <td class="p6">
      <li><a href="http://society.people.com.cn/n1/2026/0616/c1008-00006.html" target="_blank">一只猫连续三年担任小区居委会主任</a></li>
    </td>
  </tr>
</table>`;

const HTML_STYLED_TITLE = `
<table id="ta_1" style="display:block;">
  <tr>
    <td class="p6">
      <li><a href="http://finance.people.com.cn/n1/2026/0616/c1004-00007.html" target="_blank">奶茶店推出<font color="red">香菜折耳根</font>口味遭到全网抵制</a> [2026年06月16日12:02]</li>
    </td>
  </tr>
</table>`;

describe('parseArticles', () => {
  it('should return empty array for empty input', () => {
    expect(parseArticles('', '2026-06-16')).toEqual([]);
    expect(parseArticles('<div>no list here</div>', '2026-06-16')).toEqual([]);
  });

  it('should parse articles from full-date HTML', () => {
    const articles = parseArticles(HTML_TODAY, '2026-06-16');
    expect(articles).toHaveLength(3);
  });

  it('should extract title correctly', () => {
    const articles = parseArticles(HTML_TODAY, '2026-06-16');
    expect(articles[0].title).toBe('科学家发现猫其实会微积分但懒得用');
    expect(articles[1].title).toBe('男子把冰箱当空调吹了一周才发现没插电');
    expect(articles[2].title).toBe('小区保安用脸解锁手机结果邻居全都刷开了');
  });

  it('should extract URL correctly', () => {
    const articles = parseArticles(HTML_TODAY, '2026-06-16');
    expect(articles[0].url).toBe(
      'http://politics.people.com.cn/n1/2026/0616/c1001-00001.html',
    );
  });

  it('should set source to 人民网', () => {
    const articles = parseArticles(HTML_TODAY, '2026-06-16');
    expect(articles[0].source).toBe('人民网');
  });

  it('should parse full timestamp format (YYYY年MM月DD日HH:MM)', () => {
    const articles = parseArticles(HTML_TODAY, '2026-06-16');
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
    expect(articles[2].publishedAt).toBeDefined();
    expect(articles[2].publishedAt).toContain('T');
  });

  it('should parse simple timestamp format (MM月DD日HH:MM) with dateStr fallback', () => {
    const articles = parseArticles(HTML_SIMPLE_TIME, '2026-06-16');
    expect(articles).toHaveLength(1);
    expect(articles[0].publishedAt).toBeDefined();
    expect(articles[0].publishedAt).toContain('T');
  });

  it('should leave publishedAt undefined when no timestamp', () => {
    const articles = parseArticles(HTML_NO_TIME, '2026-06-16');
    expect(articles).toHaveLength(1);
    expect(articles[0].publishedAt).toBeUndefined();
  });

  it('should generate unique SHA-256 IDs from URL', () => {
    const articles = parseArticles(HTML_TODAY, '2026-06-16');
    expect(articles[0].id).toHaveLength(12);
    expect(articles[1].id).toHaveLength(12);
    expect(articles[0].id).not.toBe(articles[1].id);
  });

  it('should strip HTML tags from title', () => {
    const articles = parseArticles(HTML_STYLED_TITLE, '2026-06-16');
    expect(articles[0].title).toBe('奶茶店推出香菜折耳根口味遭到全网抵制');
  });

  it('should handle multi-link li (use first link)', () => {
    const articles = parseArticles(HTML_MULTI_LINK, '2026-06-16');
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('深度调研丨');
    expect(articles[0].url).toBe(
      'http://finance.people.com.cn/GB/8215/461663/462286/index.html',
    );
  });
});
