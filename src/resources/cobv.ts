import { SicrediValidationError } from '../errors/validation-error';
import type {
  CobvResponse,
  CreateCobvRequest,
  ListCobvParams,
  ListCobvResponse,
  UpdateCobvRequest,
} from '../types/cobv';
import { API_VERSIONS } from '../utils/constants';
import { isValidTxId } from '../utils/txid';
import { BaseResource } from './base';

export class CobvResource extends BaseResource {
  /**
   * Create a Boleto Hibrido (PIX with due date) charge.
   * PUT /api/v2/cobv/{txid}
   */
  async create(txid: string, data: CreateCobvRequest): Promise<CobvResponse> {
    if (!isValidTxId(txid)) {
      throw new SicrediValidationError('txid', 'Must be 26-35 alphanumeric characters');
    }
    return this.request<CobvResponse>('PUT', `${API_VERSIONS.cobv.create}/${txid}`, data);
  }

  /**
   * Get a Boleto Hibrido charge by txid.
   * GET /api/v2/cobv/{txid}
   */
  async get(txid: string, revisao?: number): Promise<CobvResponse> {
    if (!isValidTxId(txid)) {
      throw new SicrediValidationError('txid', 'Must be 26-35 alphanumeric characters');
    }
    return this.request<CobvResponse>('GET', `${API_VERSIONS.cobv.get}/${txid}`, undefined, {
      revisao: revisao,
    });
  }

  /**
   * Update (patch) a Boleto Hibrido charge.
   * PATCH /api/v2/cobv/{txid}
   */
  async update(txid: string, data: UpdateCobvRequest): Promise<CobvResponse> {
    if (!isValidTxId(txid)) {
      throw new SicrediValidationError('txid', 'Must be 26-35 alphanumeric characters');
    }
    return this.request<CobvResponse>('PATCH', `${API_VERSIONS.cobv.update}/${txid}`, data);
  }

  /**
   * Cancel a Boleto Hibrido charge.
   * PATCH /api/v2/cobv/{txid}
   */
  async cancel(txid: string): Promise<CobvResponse> {
    return this.update(txid, { status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR' });
  }

  /**
   * List Boleto Hibrido charges with filters.
   * GET /api/v2/cobv
   */
  async list(params: ListCobvParams): Promise<ListCobvResponse> {
    const query: Record<string, string | number | boolean | undefined> = {
      inicio: params.inicio,
      fim: params.fim,
      cpf: params.cpf,
      cnpj: params.cnpj,
      locationPresente: params.locationPresente,
      status: params.status,
      loteCobVId: params.loteCobVId,
      'paginacao.paginaAtual': params.paginacao?.paginaAtual,
      'paginacao.itensPorPagina': params.paginacao?.itensPorPagina,
    };
    return this.request<ListCobvResponse>('GET', API_VERSIONS.cobv.list, undefined, query);
  }
}
