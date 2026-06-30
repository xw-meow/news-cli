/** 单条新闻 */
export interface NewsArticle {
  /** URL hash 作为唯一标识 */
  id: string;
  /** 新闻标题 */
  title: string;
  /** 新闻链接 */
  url: string;
  /** 来源名称，如 "Google News" */
  source: string;
  /** 摘要/简介 */
  snippet?: string;
  /** 发布时间 */
  publishedAt?: string;
  /** 分类/板块 */
  category?: string;
  /** 封面图 URL */
  imageUrl?: string;
}

/** 所有新闻源必须实现的统一接口 */
export interface NewsSource {
  /** 源标识，对应 CLI 子命令名，如 "google-news" */
  readonly name: string;
  /** 源描述，用于 help 输出 */
  readonly description: string;
  /** 返回该源支持的分类列表，无分类返回空数组 */
  listCategories(): Promise<string[]>;
  /** 抓取新闻 */
  fetch(options?: FetchOptions): Promise<NewsArticle[]>;
}

/** 抓取参数 */
export interface FetchOptions {
  /** 分类过滤 */
  category?: string;
  /** 返回条数上限，默认 20 */
  limit?: number;
  /** 搜索关键词，逗号分隔 = OR 关系 */
  keyword?: string;
}

/** 错误码 */
export type ErrorCode =
  | 'SOURCE_NOT_FOUND'
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'PARSE_FAILED'
  | 'INVALID_OPTION'
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_ALREADY_INSTALLED'
  | 'PLUGIN_LOAD_FAILED'
  | 'PLUGIN_INSTALL_FAILED';

/** 统一错误类型 */
export class NewsCliError extends Error {
  public readonly code: ErrorCode;
  public readonly exitCode: number;

  constructor(message: string, code: ErrorCode, exitCode: number = 1) {
    super(message);
    this.name = 'NewsCliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}
