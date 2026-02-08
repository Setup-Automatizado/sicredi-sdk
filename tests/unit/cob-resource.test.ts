import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient, HttpResponse } from '../../src/core/http-client';
import { SicrediValidationError } from '../../src/errors/validation-error';
import type { ResourceConfig } from '../../src/resources/base';
import { CobResource } from '../../src/resources/cob';

function createJsonResponse(body: unknown, status = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('CobResource', () => {
  let mockHttpClient: { request: ReturnType<typeof vi.fn> } & HttpClient;
  let mockAuthManager: {
    getAccessToken: ReturnType<typeof vi.fn>;
    invalidateToken: ReturnType<typeof vi.fn>;
  };
  let cobResource: CobResource;

  const validTxid = 'txid12345678901234567890ab';
  const mockCobResponse = {
    txid: validTxid,
    calendario: { criacao: '2023-01-01T00:00:00Z', expiracao: 86400 },
    revisao: 0,
    status: 'ATIVA',
    valor: { original: '100.00' },
    chave: 'chave@example.com',
    location: 'pix.example.com/qr/v2/abc123',
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

    cobResource = new CobResource(config);
  });

  describe('create', () => {
    it('calls PUT /api/v2/cob/{txid} with body and returns the response', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockCobResponse));

      const requestData = {
        calendario: { expiracao: 86400 },
        valor: { original: '100.00' },
        chave: 'chave@example.com',
      };

      const result = await cobResource.create(validTxid, requestData);

      expect(result).toEqual(mockCobResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PUT');
      expect(callArgs.url).toContain(`/api/v2/cob/${validTxid}`);
      expect(callArgs.body).toBe(JSON.stringify(requestData));
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });

    it('throws SicrediValidationError for invalid txid', async () => {
      await expect(cobResource.create('bad!', {} as never)).rejects.toThrow(SicrediValidationError);
      expect(mockHttpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('createAuto', () => {
    it('calls POST /api/v2/cob without txid and returns the response', async () => {
      const autoResponse = {
        ...mockCobResponse,
        txid: 'auto_generated_txid_123456789',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(autoResponse));

      const requestData = {
        calendario: { expiracao: 3600 },
        valor: { original: '50.00' },
        chave: 'chave@example.com',
      };

      const result = await cobResource.createAuto(requestData);

      expect(result).toEqual(autoResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('POST');
      expect(new URL(callArgs.url).pathname).toBe('/api/v2/cob');
      expect(callArgs.body).toBe(JSON.stringify(requestData));
    });
  });

  describe('get', () => {
    it('calls GET /api/v3/cob/{txid} (v3!) and returns the response', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockCobResponse));

      const result = await cobResource.get(validTxid);

      expect(result).toEqual(mockCobResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain(`/api/v3/cob/${validTxid}`);
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });

    it('passes revisao query param when provided', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockCobResponse));

      await cobResource.get(validTxid, 2);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.url).toContain('revisao=2');
    });

    it('throws SicrediValidationError for invalid txid', async () => {
      await expect(cobResource.get('x')).rejects.toThrow(SicrediValidationError);
      expect(mockHttpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('calls PATCH /api/v2/cob/{txid} with body and returns the response', async () => {
      const updatedResponse = {
        ...mockCobResponse,
        valor: { original: '200.00' },
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(updatedResponse));

      const updateData = { valor: { original: '200.00' } };
      const result = await cobResource.update(validTxid, updateData);

      expect(result).toEqual(updatedResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PATCH');
      expect(callArgs.url).toContain(`/api/v2/cob/${validTxid}`);
      expect(callArgs.body).toBe(JSON.stringify(updateData));
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });

    it('throws SicrediValidationError for invalid txid', async () => {
      await expect(cobResource.update('', {} as never)).rejects.toThrow(SicrediValidationError);
      expect(mockHttpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('calls PATCH /api/v2/cob/{txid} with REMOVIDA_PELO_USUARIO_RECEBEDOR status', async () => {
      const cancelledResponse = {
        ...mockCobResponse,
        status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(cancelledResponse));

      const result = await cobResource.cancel(validTxid);

      expect(result).toEqual(cancelledResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PATCH');
      expect(callArgs.url).toContain(`/api/v2/cob/${validTxid}`);
      expect(JSON.parse(callArgs.body as string)).toEqual({
        status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR',
      });
    });
  });

  describe('list', () => {
    it('calls GET /api/v2/cob with required query params', async () => {
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
        cobs: [mockCobResponse],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      const result = await cobResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/cob');
      expect(callArgs.url).toContain('inicio=2023-01-01T00');
      expect(callArgs.url).toContain('fim=2023-01-31T23');
      expect(callArgs.body).toBeUndefined();
    });

    it('calls GET /api/v2/cob with all optional query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-01-31T23:59:59Z',
          paginacao: {
            paginaAtual: 1,
            itensPorPagina: 10,
            quantidadeDePaginas: 5,
            quantidadeTotalDeItens: 50,
          },
        },
        cobs: [],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      await cobResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-01-31T23:59:59Z',
        cpf: '12345678900',
        cnpj: '12345678000100',
        locationPresente: true,
        status: 'ATIVA',
        paginacao: { paginaAtual: 1, itensPorPagina: 10 },
      });

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('cpf=12345678900');
      expect(callArgs.url).toContain('cnpj=12345678000100');
      expect(callArgs.url).toContain('locationPresente=true');
      expect(callArgs.url).toContain('status=ATIVA');
      expect(callArgs.url).toContain('paginacao.paginaAtual=1');
      expect(callArgs.url).toContain('paginacao.itensPorPagina=10');
    });
  });

  describe('generateTxId', () => {
    it('generates a valid txid with default length', () => {
      const txid = cobResource.generateTxId();
      expect(txid).toMatch(/^[a-zA-Z0-9]{26,35}$/);
    });

    it('generates a valid txid with custom length', () => {
      const txid = cobResource.generateTxId(35);
      expect(txid).toHaveLength(35);
      expect(txid).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });
});
