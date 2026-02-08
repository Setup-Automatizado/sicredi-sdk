/** mTLS certificate configuration for Sicredi API authentication */
export interface CertificateOptions {
  /** @required PEM string or file path to client certificate (.cer/.crt/.pem) */
  cert: string;
  /** @required PEM string or file path to private key (.key/.pem) */
  key: string;
  /** @optional PEM string or file path to CA certificate chain (Sicredi root CA) */
  ca?: string;
  /** @optional Passphrase for the private key (if encrypted) */
  passphrase?: string;
}

/** Main SDK configuration */
export interface SicrediConfig {
  /** @required OAuth2 client ID (provided by Sicredi) */
  clientId: string;
  /** @required OAuth2 client secret (provided by Sicredi) */
  clientSecret: string;
  /** @optional Default PIX key for operations (can be overridden per-call) */
  pixKey?: string;
  /** @required mTLS certificate options (cert + key are mandatory) */
  certificate: CertificateOptions;
  /** @optional Environment: 'production' or 'sandbox' (default: 'production') */
  environment?: 'production' | 'sandbox';
  /** @optional Custom base URL (overrides environment selection) */
  baseUrl?: string;
  /** @optional Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** @optional Maximum retry attempts for failed requests (default: 3) */
  maxRetries?: number;
  /** @optional Enable debug logging to console (default: false) */
  debug?: boolean;
}
