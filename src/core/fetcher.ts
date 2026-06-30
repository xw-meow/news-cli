import { NewsCliError } from './types.js';
import { sleep } from '../utils/index.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * 通用文本抓取：超时控制 + 重试 + UA 伪装
 * @param url - 请求地址
 * @param timeoutMs - 超时毫秒数
 * @returns 响应文本
 */
async function fetchText(url: string, timeoutMs: number, extraHeaders?: Record<string, string>): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, ...extraHeaders },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new NewsCliError(
          `HTTP ${response.status} when fetching ${url}`,
          'FETCH_FAILED',
        );
      }

      // 读取原始字节，自动检测编码（适配 GB2312 等非 UTF-8 页面）
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || '';
      const headerCharset = contentType.match(/charset=([^\s;]+)/i)?.[1];

      if (headerCharset && headerCharset.toLowerCase() !== 'utf-8') {
        return new TextDecoder(headerCharset).decode(buffer);
      }

      // 先用 UTF-8 解码，检查 <meta charset> 是否指定了其他编码
      const utf8Text = new TextDecoder('utf-8').decode(buffer);
      const metaCharset = utf8Text.slice(0, 2048).match(/<meta[^>]*charset=["']?([^"'\s>]+)/i)?.[1];
      if (metaCharset && metaCharset.toLowerCase() !== 'utf-8') {
        try {
          return new TextDecoder(metaCharset).decode(buffer);
        } catch {
          // 不支持的编码，回退 UTF-8
        }
      }

      return utf8Text;
    } catch (err: unknown) {
      // AbortError = timeout
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new NewsCliError(`Request timeout: ${url}`, 'FETCH_TIMEOUT');
      }

      // 已有 NewsCliError 直接抛出
      if (err instanceof NewsCliError) {
        throw err;
      }

      // 最后一次重试失败，抛出
      if (attempt === MAX_RETRIES) {
        throw new NewsCliError(
          `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${String(err)}`,
          'FETCH_FAILED',
        );
      }

      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new NewsCliError(`Unexpected: fetchText exhausted retries for ${url}`, 'FETCH_FAILED');
}

/**
 * 通用 RSS 抓取：超时控制 + 重试 + UA 伪装
 * @param url - RSS 地址
 * @param timeoutMs - 超时毫秒数
 * @returns RSS XML 字符串
 */
export async function fetchRSS(url: string, timeoutMs: number, extraHeaders?: Record<string, string>): Promise<string> {
  return fetchText(url, timeoutMs, extraHeaders);
}

/**
 * 通用 HTML 页面抓取：超时控制 + 重试 + UA 伪装。
 * 自动检测编码（meta charset），适配 GB2312 等非 UTF-8 页面。
 */
export async function fetchHTML(url: string, timeoutMs: number, extraHeaders?: Record<string, string>): Promise<string> {
  return fetchText(url, timeoutMs, extraHeaders);
}

/**
 * 通用 JSON API 抓取：超时控制 + 重试 + UA 伪装
 * @param url - API 地址
 * @param timeoutMs - 超时毫秒数
 * @param extraHeaders - 额外请求头
 * @param method - HTTP 方法，默认 GET
 * @param body - 请求体（JSON 字符串）
 * @returns 解析后的 JSON 对象
 */
export async function fetchJSON<T>(
  url: string,
  timeoutMs: number,
  extraHeaders?: Record<string, string>,
  method: string = 'GET',
  body?: string,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const init: RequestInit = {
        method,
        headers: { 'User-Agent': USER_AGENT, ...extraHeaders },
        signal: controller.signal,
      };
      if (body && method !== 'GET') {
        (init.headers as Record<string, string>)['Content-Type'] =
          (init.headers as Record<string, string>)['Content-Type'] || 'application/json';
        init.body = body;
      }

      const response = await fetch(url, init);

      clearTimeout(timer);

      if (!response.ok) {
        throw new NewsCliError(
          `HTTP ${response.status} when fetching ${url}`,
          'FETCH_FAILED',
        );
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      // AbortError = timeout
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new NewsCliError(`Request timeout: ${url}`, 'FETCH_TIMEOUT');
      }

      // 已有 NewsCliError 直接抛出
      if (err instanceof NewsCliError) {
        throw err;
      }

      // 最后一次重试失败，抛出
      if (attempt === MAX_RETRIES) {
        throw new NewsCliError(
          `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${String(err)}`,
          'FETCH_FAILED',
        );
      }

      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new NewsCliError(`Unexpected: fetchJSON exhausted retries for ${url}`, 'FETCH_FAILED');
}

/**
 * 通用二进制文件下载：超时控制 + 重试 + UA 伪装
 * @param url - 下载地址
 * @param timeoutMs - 超时毫秒数
 * @returns 文件二进制数据
 */
export async function fetchBinary(url: string, timeoutMs: number): Promise<Buffer> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new NewsCliError(
          `HTTP ${response.status} when fetching ${url}`,
          'FETCH_FAILED',
        );
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new NewsCliError(`Request timeout: ${url}`, 'FETCH_TIMEOUT');
      }
      if (err instanceof NewsCliError) {
        throw err;
      }
      if (attempt === MAX_RETRIES) {
        throw new NewsCliError(
          `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${String(err)}`,
          'FETCH_FAILED',
        );
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new NewsCliError(`Unexpected: fetchBinary exhausted retries for ${url}`, 'FETCH_FAILED');
}
