import { SicrediError } from './base';

export class SicrediConnectionError extends SicrediError {
  override readonly cause?: Error;

  constructor(message: string, cause?: Error, hint?: string) {
    super(message, 'CONNECTION_ERROR', hint);
    this.name = 'SicrediConnectionError';
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static timeout(ms: number): SicrediConnectionError {
    return new SicrediConnectionError(`Request timed out after ${ms}ms`);
  }

  static refused(host: string): SicrediConnectionError {
    return new SicrediConnectionError(`Connection refused to host: ${host}`);
  }

  static tlsFailure(detail: string): SicrediConnectionError {
    return new SicrediConnectionError(
      `TLS/mTLS handshake failed: ${detail}`,
      undefined,
      'Verify that your mTLS certificates are valid, not expired, and correctly configured. Ensure the CA chain is complete.',
    );
  }
}
