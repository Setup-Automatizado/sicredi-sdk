import { randomBytes } from 'node:crypto';

const TXID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const TXID_MIN_LENGTH = 26;
const TXID_MAX_LENGTH = 35;
const TXID_PATTERN = /^[a-zA-Z0-9]{26,35}$/;

export function generateTxId(length = 35): string {
  if (length < TXID_MIN_LENGTH || length > TXID_MAX_LENGTH) {
    throw new Error(`txid length must be between ${TXID_MIN_LENGTH} and ${TXID_MAX_LENGTH}`);
  }

  const bytes = randomBytes(length);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += TXID_CHARS[bytes[i]! % TXID_CHARS.length];
  }

  return result;
}

export function isValidTxId(txid: string): boolean {
  return TXID_PATTERN.test(txid);
}
