import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient, HttpResponse } from '../../src/core/http-client';
import type { ResourceConfig } from '../../src/resources/base';
import { PixResource } from '../../src/resources/pix';

function createJsonResponse(body: unknown, status = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('PixResource', () => {
  let mockHttpClient: { request: ReturnType<typeof vi.fn> } & HttpClient;
  let mockAuthManager: {
    getAccessToken: ReturnType<typeof vi.fn>;
    invalidateToken: ReturnType<typeof vi.fn>;
  };
  let pixResource: PixResource;

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

    pixResource = new PixResource(config);
  });

  describe('get', () => {
    it('calls GET /api/v2/pix/{e2eid} and returns the response', async () => {
      const mockPix = {
        endToEndId: 'E01181521202301011234abcdef12345',
        valor: '100.00',
        chave: 'chave@example.com',
        horario: { solicitacao: '2023-01-01T00:00:00Z' },
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockPix));

      const result = await pixResource.get('E01181521202301011234abcdef12345');

      expect(result).toEqual(mockPix);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/pix/E01181521202301011234abcdef12345');
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe('list', () => {
    it('calls GET /api/v2/pix with required query params', async () => {
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
        pix: [
          {
            endToEndId: 'E123',
            valor: '50.00',
            chave: 'key',
            horario: { solicitacao: '2023-01-15T00:00:00Z' },
          },
        ],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      const result = await pixResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/pix');
      expect(callArgs.url).toContain('inicio=2023-01-01T00');
      expect(callArgs.url).toContain('fim=2023-01-31T23');
      expect(callArgs.body).toBeUndefined();
    });

    it('calls GET /api/v2/pix with all optional query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-01-31T23:59:59Z',
          paginacao: {
            paginaAtual: 0,
            itensPorPagina: 10,
            quantidadeDePaginas: 1,
            quantidadeTotalDeItens: 1,
          },
        },
        pix: [],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      await pixResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
        txid: 'abc123',
        txIdPresente: true,
        devolucaoPresente: false,
        cpf: '12345678900',
        cnpj: '12345678000100',
        paginacao: { paginaAtual: 0, itensPorPagina: 10 },
      });

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('txid=abc123');
      expect(callArgs.url).toContain('txIdPresente=true');
      expect(callArgs.url).toContain('devolucaoPresente=false');
      expect(callArgs.url).toContain('cpf=12345678900');
      expect(callArgs.url).toContain('cnpj=12345678000100');
      expect(callArgs.url).toContain('paginacao.paginaAtual=0');
      expect(callArgs.url).toContain('paginacao.itensPorPagina=10');
    });
  });

  describe('requestReturn', () => {
    it('calls PUT /api/v2/pix/{e2eid}/devolucao/{id} with body and returns the response', async () => {
      const mockDevolucao = {
        id: 'dev123',
        rtrId: 'D01181521202301011234',
        valor: '50.00',
        horario: { solicitacao: '2023-01-15T10:00:00Z' },
        status: 'EM_PROCESSAMENTO',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockDevolucao));

      const requestData = { valor: '50.00' };
      const result = await pixResource.requestReturn(
        'E01181521202301011234abcdef12345',
        'dev123',
        requestData,
      );

      expect(result).toEqual(mockDevolucao);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PUT');
      expect(callArgs.url).toContain(
        '/api/v2/pix/E01181521202301011234abcdef12345/devolucao/dev123',
      );
      expect(callArgs.body).toBe(JSON.stringify(requestData));
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('getReturn', () => {
    it('calls GET /api/v2/pix/{e2eid}/devolucao/{id} and returns the response', async () => {
      const mockDevolucao = {
        id: 'dev123',
        rtrId: 'D01181521202301011234',
        valor: '50.00',
        horario: { solicitacao: '2023-01-15T10:00:00Z' },
        status: 'DEVOLVIDO',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockDevolucao));

      const result = await pixResource.getReturn('E01181521202301011234abcdef12345', 'dev123');

      expect(result).toEqual(mockDevolucao);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain(
        '/api/v2/pix/E01181521202301011234abcdef12345/devolucao/dev123',
      );
      expect(callArgs.body).toBeUndefined();
    });
  });
});
