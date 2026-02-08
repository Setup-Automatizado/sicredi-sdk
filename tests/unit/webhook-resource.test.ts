import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient, HttpResponse } from '../../src/core/http-client';
import type { ResourceConfig } from '../../src/resources/base';
import { WebhookResource } from '../../src/resources/webhook';

function createJsonResponse(body: unknown, status = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function createEmptyResponse(status = 204): HttpResponse {
  return {
    status,
    headers: {},
    body: '',
  };
}

describe('WebhookResource', () => {
  let mockHttpClient: { request: ReturnType<typeof vi.fn> } & HttpClient;
  let mockAuthManager: {
    getAccessToken: ReturnType<typeof vi.fn>;
    invalidateToken: ReturnType<typeof vi.fn>;
  };
  let webhookResource: WebhookResource;

  const pixKey = 'chave@example.com';
  const webhookUrl = 'https://myapp.com/webhook';
  const mockWebhookResponse = {
    webhookUrl,
    chave: pixKey,
    criacao: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockHttpClient = {
      request: vi.fn(),
    } satisfies HttpClient;

    mockAuthManager = {
      getAccessToken: vi.fn().mockResolvedValue('test-token'),
      invalidateToken: vi.fn(),
    };

    const config = {
      baseUrl: 'https://api-pix.sicredi.com.br',
      httpClient: mockHttpClient,
      authManager: mockAuthManager,
      retryOptions: { maxRetries: 0 },
      debug: false,
    } as unknown as ResourceConfig;

    webhookResource = new WebhookResource(config);
  });

  describe('configure', () => {
    it('calls PUT /api/v2/webhook/{chave} with webhookUrl body', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createEmptyResponse());

      await webhookResource.configure(pixKey, webhookUrl);

      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PUT');
      expect(callArgs.url).toContain(`/api/v2/webhook/${pixKey}`);
      expect(JSON.parse(callArgs.body as string)).toEqual({ webhookUrl });
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });

    it('returns void (no response body)', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createEmptyResponse());

      const result = await webhookResource.configure(pixKey, webhookUrl);

      expect(result).toBeUndefined();
    });
  });

  describe('get', () => {
    it('calls GET /api/v2/webhook/{chave} and returns the response', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockWebhookResponse));

      const result = await webhookResource.get(pixKey);

      expect(result).toEqual(mockWebhookResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain(`/api/v2/webhook/${pixKey}`);
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('calls DELETE /api/v2/webhook/{chave}', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createEmptyResponse());

      await webhookResource.delete(pixKey);

      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('DELETE');
      expect(callArgs.url).toContain(`/api/v2/webhook/${pixKey}`);
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });

    it('returns void (no response body)', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createEmptyResponse());

      const result = await webhookResource.delete(pixKey);

      expect(result).toBeUndefined();
    });
  });

  describe('list', () => {
    it('calls GET /api/v2/webhook with required query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-12-31T23:59:59Z',
          paginacao: {
            paginaAtual: 0,
            itensPorPagina: 100,
            quantidadeDePaginas: 1,
            quantidadeTotalDeItens: 2,
          },
        },
        webhooks: [
          mockWebhookResponse,
          {
            webhookUrl: 'https://other.com/hook',
            chave: 'outra-chave',
            criacao: '2023-06-15T12:00:00Z',
          },
        ],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      const result = await webhookResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-12-31T23:59:59Z',
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/webhook');
      expect(callArgs.url).toContain('inicio=2023-01-01T00');
      expect(callArgs.url).toContain('fim=2023-12-31T23');
      expect(callArgs.body).toBeUndefined();
    });

    it('calls GET /api/v2/webhook with pagination query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-12-31T23:59:59Z',
          paginacao: {
            paginaAtual: 1,
            itensPorPagina: 20,
            quantidadeDePaginas: 3,
            quantidadeTotalDeItens: 60,
          },
        },
        webhooks: [],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      await webhookResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-12-31T23:59:59Z',
        paginacao: { paginaAtual: 1, itensPorPagina: 20 },
      });

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('paginacao.paginaAtual=1');
      expect(callArgs.url).toContain('paginacao.itensPorPagina=20');
    });
  });
});
