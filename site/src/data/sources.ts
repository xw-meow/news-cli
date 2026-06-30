export interface SourceData {
  name: string;
  description: string;
  descriptionEn: string;
  type: 'RSS' | 'JSON' | 'HTML';
  categories: string[];
}

export const sources: SourceData[] = [
  {
    name: 'google-news',
    description: 'Google News 全球版（英文），8 个分类',
    descriptionEn: 'Google News global (English), 8 categories',
    type: 'RSS',
    categories: ['headlines', 'world', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'],
  },
  {
    name: 'google-news-cn',
    description: 'Google News 中国版（中文），8 个分类',
    descriptionEn: 'Google News China (Chinese), 8 categories',
    type: 'RSS',
    categories: ['headlines', 'world', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'],
  },
  {
    name: 'weibo',
    description: '微博热搜榜，实时动态热门话题',
    descriptionEn: 'Weibo hot search, real-time trending topics',
    type: 'JSON',
    categories: ['热搜', '民生新闻', '时事', '财经', '科技', '体育', '娱乐', '教育'],
  },
  {
    name: 'pengpai',
    description: '澎湃新闻，22 个频道 + 搜索，自动分页',
    descriptionEn: 'The Paper, 22 channels + search, auto-paginated',
    type: 'JSON',
    categories: ['要闻', '深度', '直播', '视频', '时事', '国际', '财经', '视听', '科技', '暖闻', '澎湃号', '智库', '思想', '生活', '上海', '奔流', '健康', '体育', '评论', 'ESG', '文旅', '短剧'],
  },
  {
    name: 'chinanews',
    description: '中国新闻网 — RSS，24 个分类频道',
    descriptionEn: 'China News Service — RSS, 24 categories',
    type: 'RSS',
    categories: ['即时新闻', '要闻导读', '时政新闻', '东西问', '国际新闻', '社会新闻', '财经新闻', '生活', '健康', '大湾区', '华人', '文娱新闻', '体育新闻', '视频', '图片', '创意', '直播', '教育', '法治', '同心', '铸牢中华民族共同体意识', '一带一路', '理论', '中国—东盟商贸资讯平台'],
  },
  {
    name: 'sspai',
    description: '少数派 — 派早报/派晚报精选，关键词过滤',
    descriptionEn: 'sspai editor picks with keyword filtering',
    type: 'JSON',
    categories: [],
  },
  {
    name: 'ithome',
    description: 'IT之家 — 前沿科技新闻，20 个分类',
    descriptionEn: 'IT之家 frontier tech news, 20 categories',
    type: 'HTML',
    categories: ['业界', '手机', '电脑', '测评', '视频', 'AI', '苹果', 'iPhone', '鸿蒙', '软件', '智车', '数码', '学院', '游戏', '直播', '5G', '微软', 'Win10', 'Win11', '专题'],
  },
  {
    name: 'cls',
    description: '财联社 — 专业财经资讯，热点和头条',
    descriptionEn: 'CLS professional finance news, hot and headline',
    type: 'JSON',
    categories: ['热点', '头条'],
  },
  {
    name: 'aibase',
    description: 'AIbase — AI 领域最新资讯，分页抓取',
    descriptionEn: 'AIbase latest AI news, paginated',
    type: 'JSON',
    categories: [],
  },
  {
    name: 'tencent-news',
    description: '腾讯新闻 — POST API，5 个频道',
    descriptionEn: 'Tencent News POST API, 5 channels',
    type: 'JSON',
    categories: ['科技/AI', '要闻', '财经', '体育', '娱乐'],
  },
  {
    name: '36kr',
    description: '36氪 — 商业科技资讯，17 个频道支持翻页',
    descriptionEn: '36Kr business and tech news, 17 paginated channels',
    type: 'JSON',
    categories: ['最新', '推荐', '创投', '财经', '汽车', 'AI', '科技', '自助报道', '专精特新', '创新', '企服', '消费', '城市', '职场', '企业号', '红人', '其他'],
  },
  {
    name: 'people-cn',
    description: '人民网 — 每日要闻回顾，HTML 解析 + 日期回溯',
    descriptionEn: "People's Daily daily highlights, HTML parsing + date backtracking",
    type: 'HTML',
    categories: [],
  },
  {
    name: 'huxiu',
    description: '虎嗅网 — 商业科技资讯，15 个频道游标翻页',
    descriptionEn: 'Huxiu business and tech news, 15 cursor-paginated channels',
    type: 'JSON',
    categories: ['全部', '前沿科技', '车与出行', '商业消费', '社会文化', '金融财经', '出海', '国际热点', '游戏娱乐', '健康', '书影音', '医疗', '3C数码', '观点', '其他'],
  },
  {
    name: 'yicai',
    description: '第一财经 — 首页 script JSON 解析，头条+最新',
    descriptionEn: 'Yicai homepage script JSON parsing, headlines + latest',
    type: 'HTML',
    categories: ['头条', '最新'],
  },
  {
    name: 'autohome',
    description: '汽车之家 — HTML 解析 + 逐页分页，11 个分类',
    descriptionEn: 'Autohome HTML parsing + page-by-page pagination, 11 categories',
    type: 'HTML',
    categories: ['最新', '车闻', '导购', '试驾评测', '用车', '文化', '游记', '技术', '改装赛事', '新能源', '行业'],
  },
  {
    name: 'bbc',
    description: 'BBC News — Content Collection API 翻页，7 个分类',
    descriptionEn: 'BBC News Content Collection API, 7 categories',
    type: 'JSON',
    categories: ['technology', 'business', 'business-more', 'health', 'culture', 'arts', 'travel'],
  },
  {
    name: 'hackernews',
    description: 'Hacker News — hnrss.org 镜像，科技新闻聚合与讨论',
    descriptionEn: 'Hacker News via hnrss.org mirror, tech news and discussions',
    type: 'RSS',
    categories: ['top', 'new', 'ask', 'show', 'jobs'],
  },
];
