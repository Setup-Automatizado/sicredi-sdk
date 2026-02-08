import { describe, expect, it, vi } from 'vitest';
import { isRetryableError, isRetryableStatusCode, withRetry } from '../../src/core/retry';
import { SicrediConnectionError } from '../../src/errors/connection-error';

describe('isRetryableStatusCode', () => {
  it('returns true for retryable status codes', () => {
    expect(isRetryableStatusCode(408)).toBe(true);
    expect(isRetryableStatusCode(429)).toBe(true);
    expect(isRetryableStatusCode(500)).toBe(true);
    expect(isRetryableStatusCode(502)).toBe(true);
    expect(isRetryableStatusCode(503)).toBe(true);
    expect(isRetryableStatusCode(504)).toBe(true);
  });

  it('returns false for non-retryable status codes', () => {
    expect(isRetryableStatusCode(400)).toBe(false);
    expect(isRetryableStatusCode(401)).toBe(false);
    expect(isRetryableStatusCode(403)).toBe(false);
    expect(isRetryableStatusCode(404)).toBe(false);
    expect(isRetryableStatusCode(422)).toBe(false);
    expect(isRetryableStatusCode(200)).toBe(false);
  });
});

describe('isRetryableError', () => {
  it('returns true for SicrediConnectionError', () => {
    const error = new SicrediConnectionError('Connection failed');
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for SicrediConnectionError from static helpers', () => {
    expect(isRetryableError(SicrediConnectionError.timeout(5000))).toBe(true);
    expect(isRetryableError(SicrediConnectionError.refused('host'))).toBe(true);
    expect(isRetryableError(SicrediConnectionError.tlsFailure('err'))).toBe(true);
  });

  it('returns true for errors with retryable messages', () => {
    expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
    expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
    expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
    expect(isRetryableError(new Error('socket hang up'))).toBe(true);
    expect(isRetryableError(new Error('network error'))).toBe(true);
  });

  it('returns false for random Error', () => {
    expect(isRetryableError(new Error('some random error'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isRetryableError('string')).toBe(false);
    expect(isRetryableError(42)).toBe(false);
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
  });
});

describe('withRetry', () => {
  it('succeeds on first try without retrying', async () => {
    const fn = vi.fn().mockResolvedValueOnce('success');

    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 10,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable error and succeeds on second try', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new SicrediConnectionError('Connection lost'))
      .mockResolvedValueOnce('recovered');

    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 10,
    });

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxRetries', async () => {
    const connectionError = new SicrediConnectionError('always fails');
    const fn = vi.fn().mockRejectedValue(connectionError);

    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 })).rejects.toThrow(
      'always fails',
    );

    // 1 initial attempt + 2 retries = 3 calls
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable errors', async () => {
    const error = new Error('validation error');
    const fn = vi.fn().mockRejectedValueOnce(error);

    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10 })).rejects.toThrow(
      'validation error',
    );

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries multiple times before succeeding', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new SicrediConnectionError('fail 1'))
      .mockRejectedValueOnce(new SicrediConnectionError('fail 2'))
      .mockResolvedValueOnce('finally');

    const result = await withRetry(fn, {
      maxRetries: 5,
      baseDelayMs: 1,
      maxDelayMs: 10,
    });

    expect(result).toBe('finally');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
