import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient, HttpResponse } from '../../src/core/http-client';
import type { ResourceConfig } from '../../src/resources/base';
import { LocResource } from '../../src/resources/loc';

function createJsonResponse(body: unknown, status = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('LocResource', () => {
  let mockHttpClient: { request: ReturnType<typeof vi.fn> } & HttpClient;
  let mockAuthManager: {
    getAccessToken: ReturnType<typeof vi.fn>;
    invalidateToken: ReturnType<typeof vi.fn>;
  };
  let locResource: LocResource;

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

    locResource = new LocResource(config);
  });

  describe('create', () => {
    it('calls POST /api/v2/loc with body and returns the response', async () => {
      const mockLoc = {
        id: 1,
        location: 'pix.example.com/qr/v2/abc123',
        tipoCob: 'cob',
        criacao: '2023-01-01T00:00:00Z',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockLoc));

      const requestData = { tipoCob: 'cob' as const };
      const result = await locResource.create(requestData);

      expect(result).toEqual(mockLoc);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('POST');
      expect(callArgs.url).toContain('/api/v2/loc');
      // Ensure it does not include an ID in the path (POST to base URL)
      expect(new URL(callArgs.url).pathname).toBe('/api/v2/loc');
      expect(callArgs.body).toBe(JSON.stringify(requestData));
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('get', () => {
    it('calls GET /api/v2/loc/{id} and returns the response', async () => {
      const mockLoc = {
        id: 42,
        location: 'pix.example.com/qr/v2/def456',
        tipoCob: 'cobv',
        criacao: '2023-02-15T12:00:00Z',
        txid: 'txid-abc',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockLoc));

      const result = await locResource.get(42);

      expect(result).toEqual(mockLoc);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/loc/42');
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe('list', () => {
    it('calls GET /api/v2/loc with required query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-01-31T23:59:59Z',
          paginacao: {
            paginaAtual: 0,
            itensPorPagina: 100,
            quantidadeDePaginas: 1,
            quantidadeTotalDeItens: 2,
          },
        },
        loc: [
          {
            id: 1,
            location: 'pix.example.com/qr/v2/abc',
            tipoCob: 'cob',
            criacao: '2023-01-10T00:00:00Z',
          },
          {
            id: 2,
            location: 'pix.example.com/qr/v2/def',
            tipoCob: 'cobv',
            criacao: '2023-01-20T00:00:00Z',
          },
        ],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      const result = await locResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/loc');
      expect(callArgs.url).toContain('inicio=2023-01-01T00');
      expect(callArgs.url).toContain('fim=2023-01-31T23');
      expect(callArgs.body).toBeUndefined();
    });

    it('calls GET /api/v2/loc with all optional query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-01-31T23:59:59Z',
          paginacao: {
            paginaAtual: 1,
            itensPorPagina: 20,
            quantidadeDePaginas: 3,
            quantidadeTotalDeItens: 50,
          },
        },
        loc: [],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      await locResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
        tipoCob: 'cobv',
        paginacao: { paginaAtual: 1, itensPorPagina: 20 },
      });

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('tipoCob=cobv');
      expect(callArgs.url).toContain('paginacao.paginaAtual=1');
      expect(callArgs.url).toContain('paginacao.itensPorPagina=20');
    });
  });

  describe('unlink', () => {
    it('calls DELETE /api/v2/loc/{id}/txid and returns the response', async () => {
      const mockLoc = {
        id: 10,
        location: 'pix.example.com/qr/v2/xyz789',
        tipoCob: 'cob',
        criacao: '2023-01-05T08:00:00Z',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockLoc));

      const result = await locResource.unlink(10);

      expect(result).toEqual(mockLoc);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('DELETE');
      expect(callArgs.url).toContain('/api/v2/loc/10/txid');
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });
  });
});
