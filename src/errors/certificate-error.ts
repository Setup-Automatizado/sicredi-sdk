import { SicrediError } from './base';

export class SicrediCertificateError extends SicrediError {
  constructor(message: string, hint?: string) {
    super(message, 'CERTIFICATE_ERROR', hint);
    this.name = 'SicrediCertificateError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static notFound(path: string): SicrediCertificateError {
    return new SicrediCertificateError(
      `Certificate file not found: ${path}`,
      'Verify that the file exists at the specified path and that the process has read permissions.',
    );
  }

  static invalidFormat(detail: string): SicrediCertificateError {
    return new SicrediCertificateError(
      `Invalid certificate format: ${detail}`,
      'Certificate appears to be in DER format. Convert to PEM using: openssl x509 -inform der -in cert.cer -out cert.pem',
    );
  }

  static keyMismatch(): SicrediCertificateError {
    return new SicrediCertificateError(
      'Private key does not match the certificate',
      'Ensure the private key corresponds to the public key in the certificate. Verify with: openssl x509 -noout -modulus -in cert.pem | openssl md5 && openssl rsa -noout -modulus -in key.pem | openssl md5',
    );
  }

  static expired(): SicrediCertificateError {
    return new SicrediCertificateError(
      'Certificate has expired',
      'Request a new certificate from Sicredi and update your configuration.',
    );
  }
}
