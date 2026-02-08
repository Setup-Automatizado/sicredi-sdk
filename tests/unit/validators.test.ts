import { describe, expect, it } from 'vitest';
import {
  detectPixKeyType,
  isValidCnpj,
  isValidCpf,
  isValidMonetaryValue,
  isValidPixKey,
} from '../../src/utils/validators';

describe('isValidCpf', () => {
  it('returns true for valid CPFs', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('11144477735')).toBe(true);
  });

  it('returns false for all-same-digit CPFs', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCpf('99999999999')).toBe(false);
  });

  it('returns false for CPFs with wrong check digits', () => {
    expect(isValidCpf('52998224726')).toBe(false); // last digit wrong
    expect(isValidCpf('52998224715')).toBe(false); // second-to-last digit wrong
  });

  it('returns false for CPFs with wrong length', () => {
    expect(isValidCpf('1234567890')).toBe(false); // 10 digits
    expect(isValidCpf('123456789012')).toBe(false); // 12 digits
    expect(isValidCpf('')).toBe(false);
  });

  it('strips non-digit characters before validating', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });
});

describe('isValidCnpj', () => {
  it('returns true for valid CNPJs', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11444777000161')).toBe(true);
  });

  it('returns false for all-same-digit CNPJs', () => {
    expect(isValidCnpj('11111111111111')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });

  it('returns false for CNPJs with wrong check digits', () => {
    expect(isValidCnpj('11222333000182')).toBe(false);
    expect(isValidCnpj('11222333000191')).toBe(false);
  });

  it('returns false for CNPJs with wrong length', () => {
    expect(isValidCnpj('1122233300018')).toBe(false); // 13 digits
    expect(isValidCnpj('112223330001811')).toBe(false); // 15 digits
    expect(isValidCnpj('')).toBe(false);
  });

  it('strips non-digit characters before validating', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
  });
});

describe('detectPixKeyType', () => {
  it('detects CPF keys (11 digits only)', () => {
    expect(detectPixKeyType('52998224725')).toBe('cpf');
    expect(detectPixKeyType('11144477735')).toBe('cpf');
  });

  it('detects CNPJ keys (14 digits only)', () => {
    expect(detectPixKeyType('11222333000181')).toBe('cnpj');
  });

  it('detects email keys', () => {
    expect(detectPixKeyType('user@example.com')).toBe('email');
    expect(detectPixKeyType('test@domain.com.br')).toBe('email');
  });

  it('detects phone keys (+55 prefix)', () => {
    expect(detectPixKeyType('+5511999999999')).toBe('phone');
    expect(detectPixKeyType('+5521987654321')).toBe('phone');
  });

  it('detects EVP keys (UUID format)', () => {
    expect(detectPixKeyType('123e4567-e89b-12d3-a456-426614174000')).toBe('evp');
    expect(detectPixKeyType('550e8400-e29b-41d4-a716-446655440000')).toBe('evp');
  });

  it('returns null for invalid keys', () => {
    expect(detectPixKeyType('invalid')).toBeNull();
    expect(detectPixKeyType('12345')).toBeNull();
    expect(detectPixKeyType('')).toBeNull();
    expect(detectPixKeyType('not-a-uuid-format-value-at-all')).toBeNull();
  });
});

describe('isValidPixKey', () => {
  it('returns true for all valid key types', () => {
    expect(isValidPixKey('52998224725')).toBe(true); // cpf
    expect(isValidPixKey('11222333000181')).toBe(true); // cnpj
    expect(isValidPixKey('user@example.com')).toBe(true); // email
    expect(isValidPixKey('+5511999999999')).toBe(true); // phone
    expect(isValidPixKey('123e4567-e89b-12d3-a456-426614174000')).toBe(true); // evp
  });

  it('returns false for invalid keys', () => {
    expect(isValidPixKey('invalid')).toBe(false);
    expect(isValidPixKey('')).toBe(false);
  });
});

describe('isValidMonetaryValue', () => {
  it('accepts values with exactly two decimal places', () => {
    expect(isValidMonetaryValue('100.00')).toBe(true);
    expect(isValidMonetaryValue('0.01')).toBe(true);
    expect(isValidMonetaryValue('999999.99')).toBe(true);
    expect(isValidMonetaryValue('1.50')).toBe(true);
  });

  it('rejects values without two decimal places', () => {
    expect(isValidMonetaryValue('100')).toBe(false);
    expect(isValidMonetaryValue('100.0')).toBe(false);
    expect(isValidMonetaryValue('100.000')).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(isValidMonetaryValue('abc')).toBe(false);
    expect(isValidMonetaryValue('')).toBe(false);
    expect(isValidMonetaryValue('12.3a')).toBe(false);
  });
});
