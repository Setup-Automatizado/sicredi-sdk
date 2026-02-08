import { Agent, request as httpsRequest } from 'node:https';
import { SicrediConnectionError } from '../errors/connection-error';
import type { HttpClient, HttpClientConfig, HttpRequestOptions, HttpResponse } from './http-client';

export class NodeHttpClient implements HttpClient {
  private readonly agent: Agent;
  private readonly defaultTimeout: number;
  private readonly debug: boolean;

  constructor(config: HttpClientConfig) {
    this.defaultTimeout = config.timeout;
    this.debug = config.debug;

    this.agent = new Agent({
      cert: config.certificates.cert,
      key: config.certificates.key,
      ca: config.certificates.ca,
      passphrase: config.certificates.passphrase,
      keepAlive: true,
      maxSockets: 10,
    });
  }

  request(options: HttpRequestOptions): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(options.url);
      const timeout = options.timeout ?? this.defaultTimeout;

      if (this.debug) {
        console.debug(`[sicredi-sdk] ${options.method} ${url.pathname}`);
      }

      const req = httpsRequest(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: options.method,
          headers: options.headers,
          agent: this.agent,
          timeout,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            const headers: Record<string, string> = {};
            for (const [key, value] of Object.entries(res.headers)) {
              if (typeof value === 'string') {
                headers[key] = value;
              } else if (Array.isArray(value)) {
                headers[key] = value.join(', ');
              }
            }
            resolve({
              status: res.statusCode ?? 0,
              headers,
              body,
            });
          });
          res.on('error', (err) => {
            reject(new SicrediConnectionError(err.message, err));
          });
        },
      );

      req.on('timeout', () => {
        req.destroy();
        reject(SicrediConnectionError.timeout(timeout));
      });

      req.on('error', (err) => {
        const msg = err.message.toLowerCase();
        if (msg.includes('econnrefused')) {
          reject(SicrediConnectionError.refused(url.hostname));
        } else if (msg.includes('ssl') || msg.includes('tls') || msg.includes('certificate')) {
          reject(SicrediConnectionError.tlsFailure(err.message));
        } else {
          reject(new SicrediConnectionError(err.message, err));
        }
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }
}
