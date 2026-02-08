import { existsSync, readFileSync } from 'node:fs';
import { SicrediCertificateError } from '../errors/certificate-error';
import type { CertificateOptions } from '../types/config';

export interface ResolvedCertificates {
  cert: string | Buffer;
  key: string | Buffer;
  ca?: string | Buffer;
  passphrase?: string;
}

const PEM_HEADER_PATTERN = /-----BEGIN [A-Z\s]+-----/;
const DER_SIGNATURE = [0x30, 0x82]; // ASN.1 SEQUENCE tag

function isPemContent(content: string): boolean {
  return PEM_HEADER_PATTERN.test(content);
}

function isDerContent(buffer: Buffer): boolean {
  return buffer.length > 2 && buffer[0] === DER_SIGNATURE[0] && buffer[1] === DER_SIGNATURE[1];
}

function loadCertificateContent(input: string, label: string): string | Buffer {
  if (isPemContent(input)) {
    return input;
  }

  if (!existsSync(input)) {
    throw SicrediCertificateError.notFound(input);
  }

  const raw = readFileSync(input);
  const text = raw.toString('utf-8');

  if (isPemContent(text)) {
    return text;
  }

  if (isDerContent(raw)) {
    throw SicrediCertificateError.invalidFormat(
      `${label} at "${input}" appears to be in DER format`,
    );
  }

  return raw;
}

export class CertificateManager {
  private resolved: ResolvedCertificates | null = null;

  constructor(private readonly options: CertificateOptions) {}

  resolve(): ResolvedCertificates {
    if (this.resolved) {
      return this.resolved;
    }

    const cert = loadCertificateContent(this.options.cert, 'Certificate');
    const key = loadCertificateContent(this.options.key, 'Private key');
    const ca = this.options.ca
      ? loadCertificateContent(this.options.ca, 'CA certificate')
      : undefined;

    this.resolved = {
      cert,
      key,
      ca,
      passphrase: this.options.passphrase,
    };

    return this.resolved;
  }

  clear(): void {
    this.resolved = null;
  }
}
