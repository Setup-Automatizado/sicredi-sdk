import type {
  DevolucaoRequest,
  DevolucaoResponse,
  ListPixParams,
  ListPixResponse,
  PixRecebido,
} from '../types/pix';
import { API_VERSIONS } from '../utils/constants';
import { BaseResource } from './base';

export class PixResource extends BaseResource {
  /**
   * Query a received PIX payment by its end-to-end ID.
   * GET /api/v2/pix/{e2eid}
   */
  async get(e2eid: string): Promise<PixRecebido> {
    return this.request<PixRecebido>('GET', `${API_VERSIONS.pix.base}/${e2eid}`);
  }

  /**
   * List received PIX payments with filters.
   * GET /api/v2/pix
   */
  async list(params: ListPixParams): Promise<ListPixResponse> {
    const query: Record<string, string | number | boolean | undefined> = {
      inicio: params.inicio,
      fim: params.fim,
      txid: params.txid,
      txIdPresente: params.txIdPresente,
      devolucaoPresente: params.devolucaoPresente,
      cpf: params.cpf,
      cnpj: params.cnpj,
      'paginacao.paginaAtual': params.paginacao?.paginaAtual,
      'paginacao.itensPorPagina': params.paginacao?.itensPorPagina,
    };
    return this.request<ListPixResponse>('GET', API_VERSIONS.pix.base, undefined, query);
  }

  /**
   * Request a refund/return for a received PIX payment.
   * PUT /api/v2/pix/{e2eid}/devolucao/{id}
   */
  async requestReturn(
    e2eid: string,
    id: string,
    data: DevolucaoRequest,
  ): Promise<DevolucaoResponse> {
    return this.request<DevolucaoResponse>(
      'PUT',
      `${API_VERSIONS.pix.base}/${e2eid}/devolucao/${id}`,
      data,
    );
  }

  /**
   * Query the status of a refund/return.
   * GET /api/v2/pix/{e2eid}/devolucao/{id}
   */
  async getReturn(e2eid: string, id: string): Promise<DevolucaoResponse> {
    return this.request<DevolucaoResponse>(
      'GET',
      `${API_VERSIONS.pix.base}/${e2eid}/devolucao/${id}`,
    );
  }
}
