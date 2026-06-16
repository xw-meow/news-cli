export const API_URL = 'https://gateway.36kr.com/api/mis/nav/ifm/subNav/flow';
export const DEFAULT_TIMEOUT = 10_000;
export const DEFAULT_LIMIT = 20;

export const HEADERS: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: 'https://36kr.com',
    Referer: 'https://36kr.com/',
};

/** subnavNick → 显示名称 */
export const CHANNELS: Record<string, string> = {
    web_news: '资讯',
    web_recommend: '推荐',
    web_enterprise: '企服',
    web_tech: '科技',
    web_finance: '金融',
    web_startup: '创业',
};
