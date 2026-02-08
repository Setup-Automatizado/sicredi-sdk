import { SicrediConnectionError } from '../errors/connection-error';
import type { HttpClient, HttpClientConfig, HttpRequestOptions, HttpResponse } from './http-client';

export class BunHttpClient implements HttpClient {
  private readonly tlsOptions: {
    cert: string | Buffer;
    key: string | Buffer;
    ca?: string | Buffer;
    passphrase?: string;
  };
  private readonly defaultTimeout: number;
  private readonly debug: boolean;

  constructor(config: HttpClientConfig) {
    this.defaultTimeout = config.timeout;
    this.debug = config.debug;
    this.tlsOptions = {
      cert: config.certificates.cert,
      key: config.certificates.key,
      ca: config.certificates.ca,
      passphrase: config.certificates.passphrase,
    };
  }

  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    const timeout = options.timeout ?? this.defaultTimeout;

    if (this.debug) {
      const url = new URL(options.url);
      console.debug(`[sicredi-sdk] ${options.method} ${url.pathname}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
        // @ts-expect-error Bun-specific TLS options
        tls: this.tlsOptions,
      });

      const body = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        status: response.status,
        headers,
        body,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw SicrediConnectionError.timeout(timeout);
      }
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('econnrefused')) {
          throw SicrediConnectionError.refused(new URL(options.url).hostname);
        }
        if (msg.includes('tls') || msg.includes('ssl') || msg.includes('certificate')) {
          throw SicrediConnectionError.tlsFailure(error.message);
        }
        throw new SicrediConnectionError(error.message, error);
      }
      throw new SicrediConnectionError('Unknown connection error');
    } finally {
      clearTimeout(timer);
    }
  }
}
