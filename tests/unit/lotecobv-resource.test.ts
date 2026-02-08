import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient, HttpResponse } from '../../src/core/http-client';
import type { ResourceConfig } from '../../src/resources/base';
import { LoteCobvResource } from '../../src/resources/lotecobv';

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

describe('LoteCobvResource', () => {
  let mockHttpClient: { request: ReturnType<typeof vi.fn> } & HttpClient;
  let mockAuthManager: {
    getAccessToken: ReturnType<typeof vi.fn>;
    invalidateToken: ReturnType<typeof vi.fn>;
  };
  let loteCobvResource: LoteCobvResource;

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

    loteCobvResource = new LoteCobvResource(config);
  });

  describe('create', () => {
    it('calls PUT /api/v2/lotecobv/{id} with body', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createEmptyResponse());

      const requestData = {
        descricao: 'Lote de teste',
        cobsv: [
          {
            txid: 'txid-001',
            calendario: { dataDeVencimento: '2023-12-31' },
            devedor: { cpf: '12345678900', nome: 'Fulano' },
            valor: { original: '100.00' },
            chave: 'chave@example.com',
          },
        ],
      };

      await loteCobvResource.create(1, requestData);

      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PUT');
      expect(callArgs.url).toContain('/api/v2/lotecobv/1');
      expect(callArgs.body).toBe(JSON.stringify(requestData));
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('update', () => {
    it('calls PATCH /api/v2/lotecobv/{id} with body', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createEmptyResponse());

      const patchData = {
        cobsv: [
          {
            txid: 'txid-001',
            valor: { original: '150.00' },
          },
        ],
      };

      await loteCobvResource.update(1, patchData);

      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PATCH');
      expect(callArgs.url).toContain('/api/v2/lotecobv/1');
      expect(callArgs.body).toBe(JSON.stringify(patchData));
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('get', () => {
    it('calls GET /api/v2/lotecobv/{id} and returns the response', async () => {
      const mockLote = {
        id: 1,
        descricao: 'Lote de teste',
        criacao: '2023-01-01T00:00:00Z',
        cobsv: [
          {
            txid: 'txid-001',
            calendario: { dataDeVencimento: '2023-12-31' },
            devedor: { cpf: '12345678900', nome: 'Fulano' },
            valor: { original: '100.00' },
            chave: 'chave@example.com',
            status: 'ATIVA',
          },
        ],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockLote));

      const result = await loteCobvResource.get(1);

      expect(result).toEqual(mockLote);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/lotecobv/1');
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe('list', () => {
    it('calls GET /api/v2/lotecobv with required query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-01-31T23:59:59Z',
          paginacao: {
            paginaAtual: 0,
            itensPorPagina: 100,
            quantidadeDePaginas: 1,
            quantidadeTotalDeItens: 1,
          },
        },
        lotes: [
          {
            id: 1,
            descricao: 'Lote 1',
            criacao: '2023-01-01T00:00:00Z',
            cobsv: [],
          },
        ],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      const result = await loteCobvResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/lotecobv');
      expect(callArgs.url).toContain('inicio=2023-01-01T00');
      expect(callArgs.url).toContain('fim=2023-01-31T23');
      expect(callArgs.body).toBeUndefined();
    });

    it('calls GET /api/v2/lotecobv with pagination query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-01-31T23:59:59Z',
          paginacao: {
            paginaAtual: 2,
            itensPorPagina: 10,
            quantidadeDePaginas: 5,
            quantidadeTotalDeItens: 50,
          },
        },
        lotes: [],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      await loteCobvResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
        paginacao: { paginaAtual: 2, itensPorPagina: 10 },
      });

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('paginacao.paginaAtual=2');
      expect(callArgs.url).toContain('paginacao.itensPorPagina=10');
    });
  });
});
