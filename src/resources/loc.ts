import type { CreateLocRequest, ListLocParams, ListLocResponse, LocResponse } from '../types/loc';
import { API_VERSIONS } from '../utils/constants';
import { BaseResource } from './base';

export class LocResource extends BaseResource {
  /**
   * Create a payload location.
   * POST /api/v2/loc
   */
  async create(data: CreateLocRequest): Promise<LocResponse> {
    return this.request<LocResponse>('POST', API_VERSIONS.loc.base, data);
  }

  /**
   * Get a payload location by ID.
   * GET /api/v2/loc/{id}
   */
  async get(id: number): Promise<LocResponse> {
    return this.request<LocResponse>('GET', `${API_VERSIONS.loc.base}/${id}`);
  }

  /**
   * List payload locations.
   * GET /api/v2/loc
   */
  async list(params: ListLocParams): Promise<ListLocResponse> {
    const query: Record<string, string | number | boolean | undefined> = {
      inicio: params.inicio,
      fim: params.fim,
      tipoCob: params.tipoCob,
      txIdPresente: params.txIdPresente,
      'paginacao.paginaAtual': params.paginacao?.paginaAtual,
      'paginacao.itensPorPagina': params.paginacao?.itensPorPagina,
    };
    return this.request<ListLocResponse>('GET', API_VERSIONS.loc.base, undefined, query);
  }

  /**
   * Unlink a charge from a payload location.
   * DELETE /api/v2/loc/{id}/txid
   */
  async unlink(id: number): Promise<LocResponse> {
    return this.request<LocResponse>('DELETE', `${API_VERSIONS.loc.base}/${id}/txid`);
  }
}
