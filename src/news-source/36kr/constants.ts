export const API_URL = 'https://gateway.36kr.com/api/mis/nav/ifm/subNav/flow';
export const DEFAULT_TIMEOUT = 10_000;
export const DEFAULT_LIMIT = 20;

export const HEADERS: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: 'https://36kr.com',
    Referer: 'https://36kr.com/',
};

/** subnavNick → 显示名称（从 36kr 导航页提取） */
export const CHANNELS: Record<string, string> = {
    web_news: '最新',
    web_recommend: '推荐',
    contact: '创投',
    ccs: '财经',
    travel: '汽车',
    AI: 'AI',
    technology: '科技',
    aireport: '自助报道',
    shuzihua: '专精特新',
    innovate: '创新',
    enterpriseservice: '企服',
    happy_life: '消费',
    real_estate: '城市',
    web_zhichang: '职场',
    qiyehao: '企业号',
    sensation: '红人',
    other: '其他',
};
