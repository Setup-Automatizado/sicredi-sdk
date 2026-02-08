import { SicrediValidationError } from '../errors/validation-error';
import type {
  CobResponse,
  CreateCobRequest,
  ListCobParams,
  ListCobResponse,
  UpdateCobRequest,
} from '../types/cob';
import { API_VERSIONS } from '../utils/constants';
import { generateTxId, isValidTxId } from '../utils/txid';
import { BaseResource } from './base';

export class CobResource extends BaseResource {
  /**
   * Create a PIX immediate charge with a specific txid.
   * PUT /api/v2/cob/{txid}
   */
  async create(txid: string, data: CreateCobRequest): Promise<CobResponse> {
    if (!isValidTxId(txid)) {
      throw new SicrediValidationError('txid', 'Must be 26-35 alphanumeric characters');
    }
    return this.request<CobResponse>('PUT', `${API_VERSIONS.cob.create}/${txid}`, data);
  }

  /**
   * Create a PIX immediate charge with auto-generated txid.
   * POST /api/v2/cob
   */
  async createAuto(data: CreateCobRequest): Promise<CobResponse> {
    return this.request<CobResponse>('POST', API_VERSIONS.cob.create, data);
  }

  /**
   * Get a PIX immediate charge by txid.
   * GET /api/v3/cob/{txid} (note: v3!)
   */
  async get(txid: string, revisao?: number): Promise<CobResponse> {
    if (!isValidTxId(txid)) {
      throw new SicrediValidationError('txid', 'Must be 26-35 alphanumeric characters');
    }
    return this.request<CobResponse>('GET', `${API_VERSIONS.cob.get}/${txid}`, undefined, {
      revisao: revisao,
    });
  }

  /**
   * Update (patch) a PIX immediate charge.
   * PATCH /api/v2/cob/{txid}
   */
  async update(txid: string, data: UpdateCobRequest): Promise<CobResponse> {
    if (!isValidTxId(txid)) {
      throw new SicrediValidationError('txid', 'Must be 26-35 alphanumeric characters');
    }
    return this.request<CobResponse>('PATCH', `${API_VERSIONS.cob.update}/${txid}`, data);
  }

  /**
   * Cancel a PIX immediate charge by setting status to REMOVIDA_PELO_USUARIO_RECEBEDOR.
   * PATCH /api/v2/cob/{txid}
   */
  async cancel(txid: string): Promise<CobResponse> {
    return this.update(txid, { status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR' });
  }

  /**
   * List PIX immediate charges with filters.
   * GET /api/v2/cob
   */
  async list(params: ListCobParams): Promise<ListCobResponse> {
    const query: Record<string, string | number | boolean | undefined> = {
      inicio: params.inicio,
      fim: params.fim,
      cpf: params.cpf,
      cnpj: params.cnpj,
      locationPresente: params.locationPresente,
      status: params.status,
      'paginacao.paginaAtual': params.paginacao?.paginaAtual,
      'paginacao.itensPorPagina': params.paginacao?.itensPorPagina,
    };
    return this.request<ListCobResponse>('GET', API_VERSIONS.cob.list, undefined, query);
  }

  /**
   * Generate a txid (helper utility).
   */
  generateTxId(length?: number): string {
    return generateTxId(length);
  }
}
