import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient, HttpResponse } from '../../src/core/http-client';
import { SicrediValidationError } from '../../src/errors/validation-error';
import type { ResourceConfig } from '../../src/resources/base';
import { CobvResource } from '../../src/resources/cobv';

function createJsonResponse(body: unknown, status = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('CobvResource', () => {
  let mockHttpClient: { request: ReturnType<typeof vi.fn> } & HttpClient;
  let mockAuthManager: {
    getAccessToken: ReturnType<typeof vi.fn>;
    invalidateToken: ReturnType<typeof vi.fn>;
  };
  let cobvResource: CobvResource;

  const validTxid = 'txid12345678901234567890ab';
  const mockCobvResponse = {
    txid: validTxid,
    calendario: {
      criacao: '2023-01-01T00:00:00Z',
      dataDeVencimento: '2023-12-31',
      validadeAposVencimento: 30,
    },
    revisao: 0,
    status: 'ATIVA',
    devedor: { cpf: '12345678900', nome: 'Fulano de Tal' },
    valor: { original: '500.00' },
    chave: 'chave@example.com',
    recebedor: { nome: 'Empresa LTDA', cnpj: '12345678000100' },
    location: 'pix.example.com/qr/v2/cobv123',
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

    cobvResource = new CobvResource(config);
  });

  describe('create', () => {
    it('calls PUT /api/v2/cobv/{txid} with body and returns the response', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockCobvResponse));

      const requestData = {
        calendario: {
          dataDeVencimento: '2023-12-31',
          validadeAposVencimento: 30,
        },
        devedor: { cpf: '12345678900', nome: 'Fulano de Tal' },
        valor: { original: '500.00' },
        chave: 'chave@example.com',
      };

      const result = await cobvResource.create(validTxid, requestData);

      expect(result).toEqual(mockCobvResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PUT');
      expect(callArgs.url).toContain(`/api/v2/cobv/${validTxid}`);
      expect(callArgs.body).toBe(JSON.stringify(requestData));
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });

    it('throws SicrediValidationError for invalid txid', async () => {
      await expect(cobvResource.create('bad!', {} as never)).rejects.toThrow(
        SicrediValidationError,
      );
      expect(mockHttpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('calls GET /api/v2/cobv/{txid} and returns the response', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockCobvResponse));

      const result = await cobvResource.get(validTxid);

      expect(result).toEqual(mockCobvResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain(`/api/v2/cobv/${validTxid}`);
      expect(callArgs.headers?.Authorization).toBe('Bearer test-token');
      expect(callArgs.body).toBeUndefined();
    });

    it('passes revisao query param when provided', async () => {
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockCobvResponse));

      await cobvResource.get(validTxid, 3);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.url).toContain('revisao=3');
    });

    it('throws SicrediValidationError for invalid txid', async () => {
      await expect(cobvResource.get('x')).rejects.toThrow(SicrediValidationError);
      expect(mockHttpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('calls PATCH /api/v2/cobv/{txid} with body and returns the response', async () => {
      const updatedResponse = {
        ...mockCobvResponse,
        valor: { original: '750.00' },
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(updatedResponse));

      const updateData = { valor: { original: '750.00' } };
      const result = await cobvResource.update(validTxid, updateData);

      expect(result).toEqual(updatedResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PATCH');
      expect(callArgs.url).toContain(`/api/v2/cobv/${validTxid}`);
      expect(callArgs.body).toBe(JSON.stringify(updateData));
      expect(callArgs.headers?.['Content-Type']).toBe('application/json');
    });

    it('throws SicrediValidationError for invalid txid', async () => {
      await expect(cobvResource.update('', {} as never)).rejects.toThrow(SicrediValidationError);
      expect(mockHttpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('calls PATCH /api/v2/cobv/{txid} with REMOVIDA_PELO_USUARIO_RECEBEDOR status', async () => {
      const cancelledResponse = {
        ...mockCobvResponse,
        status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR',
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(cancelledResponse));

      const result = await cobvResource.cancel(validTxid);

      expect(result).toEqual(cancelledResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('PATCH');
      expect(callArgs.url).toContain(`/api/v2/cobv/${validTxid}`);
      expect(JSON.parse(callArgs.body as string)).toEqual({
        status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR',
      });
    });
  });

  describe('list', () => {
    it('calls GET /api/v2/cobv with required query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-06-30T23:59:59Z',
          paginacao: {
            paginaAtual: 0,
            itensPorPagina: 100,
            quantidadeDePaginas: 1,
            quantidadeTotalDeItens: 1,
          },
        },
        cobs: [mockCobvResponse],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      const result = await cobvResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-06-30T23:59:59Z',
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('/api/v2/cobv');
      expect(callArgs.url).toContain('inicio=2023-01-01T00');
      expect(callArgs.url).toContain('fim=2023-06-30T23');
      expect(callArgs.body).toBeUndefined();
    });

    it('calls GET /api/v2/cobv with all optional query params', async () => {
      const mockResponse = {
        parametros: {
          inicio: '2023-01-01T00:00:00Z',
          fim: '2023-06-30T23:59:59Z',
          paginacao: {
            paginaAtual: 0,
            itensPorPagina: 50,
            quantidadeDePaginas: 1,
            quantidadeTotalDeItens: 0,
          },
        },
        cobs: [],
      };
      mockHttpClient.request.mockResolvedValueOnce(createJsonResponse(mockResponse));

      await cobvResource.list({
        inicio: '2023-01-01T00:00:00Z',
        fim: '2023-06-30T23:59:59Z',
        cpf: '12345678900',
        cnpj: '12345678000100',
        locationPresente: false,
        status: 'ATIVA',
        loteCobVId: 42,
        paginacao: { paginaAtual: 0, itensPorPagina: 50 },
      });

      const callArgs = mockHttpClient.request.mock.calls[0]![0]!;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toContain('cpf=12345678900');
      expect(callArgs.url).toContain('cnpj=12345678000100');
      expect(callArgs.url).toContain('locationPresente=false');
      expect(callArgs.url).toContain('status=ATIVA');
      expect(callArgs.url).toContain('loteCobVId=42');
      expect(callArgs.url).toContain('paginacao.paginaAtual=0');
      expect(callArgs.url).toContain('paginacao.itensPorPagina=50');
    });
  });
});
