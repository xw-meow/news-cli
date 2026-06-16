import { NewsCliError } from './types.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

      return await response.text();
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
 * 通用 HTML 页面抓取：超时控制 + 重试 + UA 伪装
 * @param url - 页面地址
 * @param timeoutMs - 超时毫秒数
 * @returns HTML 字符串
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
