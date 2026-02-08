import type { ResolvedCertificates } from './certificate-manager';

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpClient {
  request(options: HttpRequestOptions): Promise<HttpResponse>;
}

export interface HttpClientConfig {
  certificates: ResolvedCertificates;
  timeout: number;
  debug: boolean;
}

function isBunRuntime(): boolean {
  return typeof globalThis !== 'undefined' && 'Bun' in globalThis;
}

export async function createHttpClient(config: HttpClientConfig): Promise<HttpClient> {
  if (isBunRuntime()) {
    const { BunHttpClient } = await import('./http-client-bun');
    return new BunHttpClient(config);
  }
  const { NodeHttpClient } = await import('./http-client-node');
  return new NodeHttpClient(config);
}
