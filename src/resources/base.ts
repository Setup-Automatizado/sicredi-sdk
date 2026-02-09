import type { AuthManager } from '../core/auth-manager';
import type { HttpClient } from '../core/http-client';
import { isRetryableStatusCode, type RetryOptions, withRetry } from '../core/retry';
import { SicrediApiError } from '../errors/api-error';
import { SicrediAuthError } from '../errors/auth-error';

export interface ResourceConfig {
  baseUrl: string;
  httpClient: HttpClient;
  authManager: AuthManager;
  retryOptions: RetryOptions;
  debug: boolean;
}

export abstract class BaseResource {
  protected readonly baseUrl: string;
  protected readonly httpClient: HttpClient;
  protected readonly authManager: AuthManager;
  protected readonly retryOptions: RetryOptions;
  protected readonly debug: boolean;

  constructor(config: ResourceConfig) {
    this.baseUrl = config.baseUrl;
    this.httpClient = config.httpClient;
    this.authManager = config.authManager;
    this.retryOptions = config.retryOptions;
    this.debug = config.debug;
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return withRetry(async () => {
      const token = await this.authManager.getAccessToken();
      const url = this.buildUrl(path, query);

      const response = await this.httpClient.request({
        method,
        url,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401 || response.status === 403) {
        this.authManager.invalidateToken();
        throw response.status === 401
          ? SicrediAuthError.tokenExpired()
          : SicrediAuthError.insufficientScope('required scope');
      }

      if (response.status >= 400) {
        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(response.body);
        } catch {
          parsedBody = {
            title: 'Unknown error',
            status: response.status,
            detail: response.body,
          };
        }

        const error = SicrediApiError.fromResponse(response.status, parsedBody);

        if (isRetryableStatusCode(response.status)) {
          throw error;
        }

        throw error;
      }

      if (response.status === 204 || !response.body) {
        return undefined as T;
      }

      try {
        return JSON.parse(response.body) as T;
      } catch {
        return response.body as T;
      }
    }, this.retryOptions);
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
}
