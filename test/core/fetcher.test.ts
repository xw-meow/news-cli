import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRSS } from '../../src/core/fetcher.js';

describe('fetchRSS', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and return text content on success', async () => {
    const mockResponse = '<rss><channel><item><title>Test</title></item></channel></rss>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(mockResponse, { status: 200, headers: { 'Content-Type': 'application/rss+xml' } }),
    );

    const result = await fetchRSS('https://example.com/rss', 5000);
    expect(result).toBe(mockResponse);
  });

  it('should throw NewsCliError with FETCH_FAILED on non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Server Error', { status: 503 }),
    );

    await expect(fetchRSS('https://example.com/rss', 5000)).rejects.toMatchObject({
      name: 'NewsCliError',
      code: 'FETCH_FAILED',
    });
  });

  it('should throw NewsCliError with FETCH_TIMEOUT on timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new DOMException('The operation was aborted', 'AbortError'),
    );

    await expect(fetchRSS('https://example.com/rss', 5000)).rejects.toMatchObject({
      name: 'NewsCliError',
      code: 'FETCH_TIMEOUT',
    });
  });

  it('should retry on network error and succeed on retry', async () => {
    const mockResponse = '<rss>ok</rss>';
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(new Response(mockResponse, { status: 200 }));

    const result = await fetchRSS('https://example.com/rss', 5000);
    expect(result).toBe(mockResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should give up after max retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(fetchRSS('https://example.com/rss', 5000)).rejects.toMatchObject({
      name: 'NewsCliError',
      code: 'FETCH_FAILED',
    });
  });
});
