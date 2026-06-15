/** 中国新闻网 RSS 根地址 */
export const RSS_BASE = 'https://www.chinanews.com.cn/rss';

/** 支持的分类及其 RSS 文件名 */
export const CATEGORIES: Record<string, string> = {
  '即时新闻': `${RSS_BASE}/scroll-news.xml`,
  '要闻导读': `${RSS_BASE}/importnews.xml`,
  '时政新闻': `${RSS_BASE}/china.xml`,
  '东西问': `${RSS_BASE}/dxw.xml`,
  '国际新闻': `${RSS_BASE}/world.xml`,
  '社会新闻': `${RSS_BASE}/society.xml`,
  '财经新闻': `${RSS_BASE}/finance.xml`,
  '生活': `${RSS_BASE}/life.xml`,
  '健康': `${RSS_BASE}/jk.xml`,
  '大湾区': `${RSS_BASE}/dwq.xml`,
  '华人': `${RSS_BASE}/chinese.xml`,
  '文娱新闻': `${RSS_BASE}/culture.xml`,
  '体育新闻': `${RSS_BASE}/sports.xml`,
  '视频': `${RSS_BASE}/sp.xml`,
  '图片': `${RSS_BASE}/photo.xml`,
  '创意': `${RSS_BASE}/chuangyi.xml`,
  '直播': `${RSS_BASE}/zhibo.xml`,
  '教育': `${RSS_BASE}/edu.xml`,
  '法治': `${RSS_BASE}/fz.xml`,
  '同心': `${RSS_BASE}/tx.xml`,
  '铸牢中华民族共同体意识': `${RSS_BASE}/mz.xml`,
  '一带一路': `${RSS_BASE}/ydyl.xml`,
  '理论': `${RSS_BASE}/theory.xml`,
  '中国—东盟商贸资讯平台': `${RSS_BASE}/aseaninfo.xml`,
};

/** 默认分类 */
export const DEFAULT_CATEGORY = '即时新闻';

/** 默认请求超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认返回条数 */
export const DEFAULT_LIMIT = 20;
