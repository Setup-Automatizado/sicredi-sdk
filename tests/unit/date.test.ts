import { describe, expect, it } from 'vitest';
import { createDateRange, formatDateOnly, parseDate, toISOString } from '../../src/utils/date';

describe('toISOString', () => {
  it('returns an ISO 8601 string', () => {
    const date = new Date('2024-06-15T10:30:00.000Z');
    expect(toISOString(date)).toBe('2024-06-15T10:30:00.000Z');
  });

  it('returns a string ending with Z', () => {
    const date = new Date();
    const result = toISOString(date);
    expect(result).toMatch(/Z$/);
  });
});

describe('createDateRange', () => {
  it('returns an object with inicio and fim as ISO strings', () => {
    const range = createDateRange();
    expect(range).toHaveProperty('inicio');
    expect(range).toHaveProperty('fim');
    expect(typeof range.inicio).toBe('string');
    expect(typeof range.fim).toBe('string');
  });

  it('creates a range of 30 days by default', () => {
    const range = createDateRange();
    const inicio = new Date(range.inicio);
    const fim = new Date(range.fim);
    const diffMs = fim.getTime() - inicio.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('creates a range of the specified number of days', () => {
    const range = createDateRange(7);
    const inicio = new Date(range.inicio);
    const fim = new Date(range.fim);
    const diffMs = fim.getTime() - inicio.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('fim is close to now', () => {
    const before = Date.now();
    const range = createDateRange();
    const after = Date.now();
    const fimTime = new Date(range.fim).getTime();
    expect(fimTime).toBeGreaterThanOrEqual(before);
    expect(fimTime).toBeLessThanOrEqual(after);
  });
});

describe('parseDate', () => {
  it('parses a valid ISO date string', () => {
    const date = parseDate('2024-06-15T10:30:00.000Z');
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(5); // June is month 5 (0-indexed)
    expect(date.getDate()).toBe(15);
  });

  it('throws on an invalid date string', () => {
    expect(() => parseDate('not-a-date')).toThrow('Invalid date string: not-a-date');
  });

  it('throws on an empty string', () => {
    expect(() => parseDate('')).toThrow('Invalid date string: ');
  });
});

describe('formatDateOnly', () => {
  it('returns YYYY-MM-DD format', () => {
    const date = new Date('2024-06-15T10:30:00.000Z');
    expect(formatDateOnly(date)).toBe('2024-06-15');
  });

  it('pads month and day with leading zeros', () => {
    const date = new Date('2024-01-05T00:00:00.000Z');
    expect(formatDateOnly(date)).toBe('2024-01-05');
  });

  it('returns only the date portion without time', () => {
    const date = new Date('2024-12-31T23:59:59.999Z');
    const result = formatDateOnly(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).not.toContain('T');
  });
});
