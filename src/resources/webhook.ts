import type {
  ListWebhookParams,
  ListWebhookResponse,
  WebhookConfigRequest,
  WebhookResponse,
} from '../types/webhook';
import { API_VERSIONS } from '../utils/constants';
import { BaseResource } from './base';

export class WebhookResource extends BaseResource {
  /**
   * Configure a webhook for a PIX key.
   * PUT /api/v2/webhook/{chave}
   */
  async configure(chave: string, webhookUrl: string): Promise<void> {
    const body: WebhookConfigRequest = { webhookUrl };
    await this.request<void>('PUT', `${API_VERSIONS.webhook.base}/${chave}`, body);
  }

  /**
   * Get webhook configuration for a PIX key.
   * GET /api/v2/webhook/{chave}
   */
  async get(chave: string): Promise<WebhookResponse> {
    return this.request<WebhookResponse>('GET', `${API_VERSIONS.webhook.base}/${chave}`);
  }

  /**
   * Delete webhook configuration for a PIX key.
   * DELETE /api/v2/webhook/{chave}
   */
  async delete(chave: string): Promise<void> {
    await this.request<void>('DELETE', `${API_VERSIONS.webhook.base}/${chave}`);
  }

  /**
   * List all webhook configurations.
   * GET /api/v2/webhook
   */
  async list(params: ListWebhookParams): Promise<ListWebhookResponse> {
    const query: Record<string, string | number | undefined> = {
      inicio: params.inicio,
      fim: params.fim,
      'paginacao.paginaAtual': params.paginacao?.paginaAtual,
      'paginacao.itensPorPagina': params.paginacao?.itensPorPagina,
    };
    return this.request<ListWebhookResponse>('GET', API_VERSIONS.webhook.base, undefined, query);
  }
}
