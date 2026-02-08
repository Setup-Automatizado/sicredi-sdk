import { SicrediApiError } from '../errors/api-error';
import { SicrediAuthError } from '../errors/auth-error';
import type { CachedToken, TokenResponse } from '../types/auth';
import { OAUTH_SCOPES, TOKEN_ENDPOINT, TOKEN_REFRESH_BUFFER_MS } from '../utils/constants';
import type { HttpClient } from './http-client';

export class AuthManager {
  private cachedToken: CachedToken | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly baseUrl: string,
    private readonly httpClient: HttpClient,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && !this.isTokenExpiringSoon()) {
      return this.cachedToken.accessToken;
    }

    // Dedup concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  invalidateToken(): void {
    this.cachedToken = null;
  }

  private isTokenExpiringSoon(): boolean {
    if (!this.cachedToken) return true;
    return Date.now() >= this.cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS;
  }

  private async refreshToken(): Promise<string> {
    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
    const scopes = encodeURIComponent(OAUTH_SCOPES);
    const url = `${this.baseUrl}${TOKEN_ENDPOINT}?grant_type=client_credentials&scope=${scopes}`;

    const response = await this.httpClient.request({
      method: 'POST',
      url,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.status !== 200) {
      let body: unknown;
      try {
        body = JSON.parse(response.body);
      } catch {
        // ignore parse error
      }

      if (response.status === 401 || response.status === 403) {
        throw SicrediAuthError.invalidCredentials();
      }

      throw SicrediApiError.fromResponse(response.status, body);
    }

    let tokenData: TokenResponse;
    try {
      tokenData = JSON.parse(response.body) as TokenResponse;
    } catch {
      throw new SicrediAuthError('Invalid token response from server');
    }

    this.cachedToken = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      scope: tokenData.scope,
    };

    return this.cachedToken.accessToken;
  }
}
