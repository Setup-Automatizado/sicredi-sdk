export function isValidCpf(cpf: string): boolean {
  const stripped = cpf.replace(/\D/g, '');

  if (stripped.length !== 11) {
    return false;
  }

  // Reject all-same-digit CPFs
  if (/^(\d)\1{10}$/.test(stripped)) {
    return false;
  }

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(stripped[i]!, 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number.parseInt(stripped[9]!, 10)) {
    return false;
  }

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(stripped[i]!, 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number.parseInt(stripped[10]!, 10)) {
    return false;
  }

  return true;
}

export function isValidCnpj(cnpj: string): boolean {
  const stripped = cnpj.replace(/\D/g, '');

  if (stripped.length !== 14) {
    return false;
  }

  // Reject all-same-digit CNPJs
  if (/^(\d)\1{13}$/.test(stripped)) {
    return false;
  }

  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(stripped[i]!, 10) * weights1[i]!;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== Number.parseInt(stripped[12]!, 10)) {
    return false;
  }

  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number.parseInt(stripped[i]!, 10) * weights2[i]!;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== Number.parseInt(stripped[13]!, 10)) {
    return false;
  }

  return true;
}

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp';

const EVP_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^\+55\d{10,11}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function detectPixKeyType(key: string): PixKeyType | null {
  const digitsOnly = key.replace(/\D/g, '');

  // EVP (UUID v4 format)
  if (EVP_PATTERN.test(key)) {
    return 'evp';
  }

  // Phone: starts with +55, total 13-14 chars (+55 + 10 or 11 digits)
  if (PHONE_PATTERN.test(key)) {
    return 'phone';
  }

  // Email: contains @
  if (EMAIL_PATTERN.test(key)) {
    return 'email';
  }

  // CPF: exactly 11 digits (only digits) with valid check digits
  if (digitsOnly.length === 11 && digitsOnly === key && isValidCpf(key)) {
    return 'cpf';
  }

  // CNPJ: exactly 14 digits (only digits) with valid check digits
  if (digitsOnly.length === 14 && digitsOnly === key && isValidCnpj(key)) {
    return 'cnpj';
  }

  return null;
}

export function isValidPixKey(key: string): boolean {
  return detectPixKeyType(key) !== null;
}

export function isValidMonetaryValue(value: string): boolean {
  return /^\d+\.\d{2}$/.test(value);
}
