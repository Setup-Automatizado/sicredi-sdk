import { describe, expect, it } from 'vitest';
import { generateTxId, isValidTxId } from '../../src/utils/txid';

describe('generateTxId', () => {
  it('returns a string of default length 35', () => {
    const txid = generateTxId();
    expect(txid).toHaveLength(35);
  });

  it('returns a string of length 26 when passed 26', () => {
    const txid = generateTxId(26);
    expect(txid).toHaveLength(26);
  });

  it('returns a string of length 35 when passed 35', () => {
    const txid = generateTxId(35);
    expect(txid).toHaveLength(35);
  });

  it('returns only alphanumeric characters', () => {
    const txid = generateTxId();
    expect(txid).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('throws when length is less than 26', () => {
    expect(() => generateTxId(25)).toThrow('txid length must be between 26 and 35');
  });

  it('throws when length is greater than 35', () => {
    expect(() => generateTxId(36)).toThrow('txid length must be between 26 and 35');
  });

  it('returns unique txids on multiple calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateTxId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('isValidTxId', () => {
  it('validates correct txids', () => {
    expect(isValidTxId(generateTxId())).toBe(true);
    expect(isValidTxId(generateTxId(26))).toBe(true);
    expect(isValidTxId(generateTxId(30))).toBe(true);
    expect(isValidTxId('abcdefghijklmnopqrstuvwxyz')).toBe(true); // 26 chars
    expect(isValidTxId('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')).toBe(false); // 36 chars -> too long
    expect(isValidTxId('ABCDEFGHIJKLMNOPQRSTUVWXYZ012345678')).toBe(true); // 35 chars
  });

  it('rejects txids that are too short', () => {
    expect(isValidTxId('abc')).toBe(false);
    expect(isValidTxId('a'.repeat(25))).toBe(false);
  });

  it('rejects txids that are too long', () => {
    expect(isValidTxId('a'.repeat(36))).toBe(false);
  });

  it('rejects txids with special characters', () => {
    expect(isValidTxId('abcdefghijklmnopqrstuvwxyz!')).toBe(false);
    expect(isValidTxId('abcdefghijklmnopqrst uvwxyz')).toBe(false);
    expect(isValidTxId('abcdefghijklmnopqrstuvwxyz-')).toBe(false);
    expect(isValidTxId('abcdefghijklmnopqrstuvwxy_z')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidTxId('')).toBe(false);
  });
});
