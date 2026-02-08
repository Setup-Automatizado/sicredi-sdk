import type {
  ListLoteCobvParams,
  ListLoteCobvResponse,
  LoteCobvPatchRequest,
  LoteCobvRequest,
  LoteCobvResponse,
} from '../types/lotecobv';
import { API_VERSIONS } from '../utils/constants';
import { BaseResource } from './base';

export class LoteCobvResource extends BaseResource {
  /**
   * Create or replace a batch of cobv charges.
   * PUT /api/v2/lotecobv/{id}
   */
  async create(id: number, data: LoteCobvRequest): Promise<void> {
    await this.request<void>('PUT', `${API_VERSIONS.lotecobv.base}/${id}`, data);
  }

  /**
   * Revise specific charges within a batch.
   * PATCH /api/v2/lotecobv/{id}
   */
  async update(id: number, data: LoteCobvPatchRequest): Promise<void> {
    await this.request<void>('PATCH', `${API_VERSIONS.lotecobv.base}/${id}`, data);
  }

  /**
   * Query a specific batch of cobv charges.
   * GET /api/v2/lotecobv/{id}
   */
  async get(id: number): Promise<LoteCobvResponse> {
    return this.request<LoteCobvResponse>('GET', `${API_VERSIONS.lotecobv.base}/${id}`);
  }

  /**
   * List batches of cobv charges.
   * GET /api/v2/lotecobv
   */
  async list(params: ListLoteCobvParams): Promise<ListLoteCobvResponse> {
    const query: Record<string, string | number | undefined> = {
      inicio: params.inicio,
      fim: params.fim,
      'paginacao.paginaAtual': params.paginacao?.paginaAtual,
      'paginacao.itensPorPagina': params.paginacao?.itensPorPagina,
    };
    return this.request<ListLoteCobvResponse>('GET', API_VERSIONS.lotecobv.base, undefined, query);
  }
}
