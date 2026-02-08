import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthManager } from '../../src/core/auth-manager';
import type { HttpClient, HttpResponse } from '../../src/core/http-client';
import { SicrediApiError } from '../../src/errors/api-error';
import { SicrediAuthError } from '../../src/errors/auth-error';

function createTokenResponse(accessToken = 'test-access-token', expiresIn = 3600): HttpResponse {
  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: 'cob.write cob.read',
    }),
  };
}

describe('AuthManager', () => {
  let mockHttpClient: { request: ReturnType<typeof vi.fn> } & HttpClient;
  let authManager: AuthManager;

  beforeEach(() => {
    mockHttpClient = {
      request: vi.fn(),
    } satisfies HttpClient;

    authManager = new AuthManager(
      'test-client-id',
      'test-client-secret',
      'https://api-pix.sicredi.com.br',
      mockHttpClient,
    );
  });

  it('fetches token on first call', async () => {
    mockHttpClient.request.mockResolvedValueOnce(createTokenResponse());

    const token = await authManager.getAccessToken();

    expect(token).toBe('test-access-token');
    expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

    const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
    expect(callArgs.method).toBe('POST');
    expect(callArgs.url).toContain('/oauth/token');
    expect(callArgs.url).toContain('grant_type=client_credentials');
    expect(callArgs.headers?.Authorization).toMatch(/^Basic /);
    expect(callArgs.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('returns cached token on second call', async () => {
    mockHttpClient.request.mockResolvedValueOnce(createTokenResponse());

    const token1 = await authManager.getAccessToken();
    const token2 = await authManager.getAccessToken();

    expect(token1).toBe('test-access-token');
    expect(token2).toBe('test-access-token');
    expect(mockHttpClient.request).toHaveBeenCalledTimes(1);
  });

  it('refreshes expired token', async () => {
    // First token expires in 1 second (but TOKEN_REFRESH_BUFFER_MS = 5 minutes)
    // So a token with expires_in=1 will already be "expiring soon"
    mockHttpClient.request
      .mockResolvedValueOnce(createTokenResponse('first-token', 1))
      .mockResolvedValueOnce(createTokenResponse('second-token', 3600));

    const token1 = await authManager.getAccessToken();
    expect(token1).toBe('first-token');

    // The token is already "expiring soon" because it expires in 1s but buffer is 5 minutes
    // So the next call should re-fetch
    const token2 = await authManager.getAccessToken();
    expect(token2).toBe('second-token');
    expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
  });

  it('invalidateToken forces re-fetch on next call', async () => {
    mockHttpClient.request
      .mockResolvedValueOnce(createTokenResponse('token-1'))
      .mockResolvedValueOnce(createTokenResponse('token-2'));

    const token1 = await authManager.getAccessToken();
    expect(token1).toBe('token-1');

    authManager.invalidateToken();

    const token2 = await authManager.getAccessToken();
    expect(token2).toBe('token-2');
    expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
  });

  it('throws SicrediAuthError on 401 response', async () => {
    mockHttpClient.request.mockResolvedValue({
      status: 401,
      headers: {},
      body: JSON.stringify({ error: 'invalid_client' }),
    });

    await expect(authManager.getAccessToken()).rejects.toThrow(SicrediAuthError);
    await expect(authManager.getAccessToken()).rejects.toThrow('Invalid credentials');
  });

  it('throws SicrediAuthError on 403 response', async () => {
    mockHttpClient.request.mockResolvedValueOnce({
      status: 403,
      headers: {},
      body: JSON.stringify({ error: 'forbidden' }),
    });

    await expect(authManager.getAccessToken()).rejects.toThrow(SicrediAuthError);
  });

  it('throws SicrediApiError on other error status codes', async () => {
    mockHttpClient.request.mockResolvedValueOnce({
      status: 500,
      headers: {},
      body: JSON.stringify({
        title: 'Internal Server Error',
        status: 500,
      }),
    });

    await expect(authManager.getAccessToken()).rejects.toThrow(SicrediApiError);
  });

  it('throws SicrediAuthError for invalid token response body', async () => {
    mockHttpClient.request.mockResolvedValue({
      status: 200,
      headers: {},
      body: 'not-json',
    });

    await expect(authManager.getAccessToken()).rejects.toThrow(SicrediAuthError);
    await expect(authManager.getAccessToken()).rejects.toThrow(
      'Invalid token response from server',
    );
  });

  it('encodes clientId:clientSecret as Base64 in Authorization header', async () => {
    mockHttpClient.request.mockResolvedValueOnce(createTokenResponse());

    await authManager.getAccessToken();

    const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
    const expectedBase64 = btoa('test-client-id:test-client-secret');
    expect(callArgs.headers?.Authorization).toBe(`Basic ${expectedBase64}`);
  });

  it('deduplicates concurrent token refresh requests', async () => {
    mockHttpClient.request.mockResolvedValueOnce(createTokenResponse());

    // Fire multiple concurrent requests
    const [token1, token2, token3] = await Promise.all([
      authManager.getAccessToken(),
      authManager.getAccessToken(),
      authManager.getAccessToken(),
    ]);

    expect(token1).toBe('test-access-token');
    expect(token2).toBe('test-access-token');
    expect(token3).toBe('test-access-token');
    // Only one HTTP request should have been made
    expect(mockHttpClient.request).toHaveBeenCalledTimes(1);
  });
});
