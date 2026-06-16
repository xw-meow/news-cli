/** 默认超时 (ms) */
export const DEFAULT_TIMEOUT = 10_000;

/** 默认条数 */
export const DEFAULT_LIMIT = 20;

/** AJAX 分页 POST 地址 */
export const DOMAINPAGE_URL = 'https://www.ithome.com/category/domainpage';

/** 分类名 → { 页面 URL, domain 码 } */
export const CATEGORIES: Record<string, { url: string; domain: string }> = {
  '业界':   { url: 'https://it.ithome.com/',          domain: 'it' },
  '手机':   { url: 'https://mobile.ithome.com/',       domain: 'mobile' },
  '电脑':   { url: 'https://www.ithome.com/pc/',       domain: 'pc' },
  '测评':   { url: 'https://www.ithome.com/labs/',     domain: 'labs' },
  '视频':   { url: 'https://www.ithome.com/video/',     domain: 'video' },
  'AI':     { url: 'https://next.ithome.com/',         domain: 'next' },
  '苹果':   { url: 'https://www.ithome.com/apple/',    domain: 'apple' },
  'iPhone': { url: 'https://iphone.ithome.com/',       domain: 'iphone' },
  '鸿蒙':   { url: 'https://hmos.ithome.com/',         domain: 'hmos' },
  '软件':   { url: 'https://soft.ithome.com/',         domain: 'soft' },
  '智车':   { url: 'https://auto.ithome.com/',         domain: 'auto' },
  '数码':   { url: 'https://digi.ithome.com/',         domain: 'digi' },
  '学院':   { url: 'https://www.ithome.com/college/',  domain: 'college' },
  '游戏':   { url: 'https://game.ithome.com/',         domain: 'game' },
  '直播':   { url: 'https://www.ithome.com/live/',     domain: 'live' },
  '5G':     { url: 'https://www.ithome.com/5g/',       domain: '5g' },
  '微软':   { url: 'https://www.ithome.com/microsoft/', domain: 'microsoft' },
  'Win10':  { url: 'https://win10.ithome.com/',        domain: 'win10' },
  'Win11':  { url: 'https://win11.ithome.com/',        domain: 'win11' },
  '专题':   { url: 'https://www.ithome.com/zt/',       domain: 'zt' },
};
