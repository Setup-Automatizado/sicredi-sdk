import type {
  ComponentesValor,
  DevolucaoNatureza,
  DevolucaoStatus,
  Pagador,
  Paginacao,
  PaginacaoParams,
} from './common';

export interface WebhookConfigRequest {
  /** @required URL where Sicredi will send webhook notifications */
  webhookUrl: string;
}

export interface WebhookResponse {
  /** @required Configured webhook URL */
  webhookUrl: string;
  /** @required PIX key associated with this webhook */
  chave: string;
  /** @required ISO 8601 timestamp of webhook creation */
  criacao: string;
}

export interface ListWebhookParams {
  /** @optional Start date filter (ISO 8601). Unlike other list endpoints, this is optional for webhooks. */
  inicio?: string;
  /** @optional End date filter (ISO 8601). Unlike other list endpoints, this is optional for webhooks. */
  fim?: string;
  /** @optional Pagination parameters */
  paginacao?: PaginacaoParams;
}

export interface ListWebhookResponse {
  parametros: {
    /** @required Start date used in the query */
    inicio: string;
    /** @required End date used in the query */
    fim: string;
    /** @required Pagination metadata */
    paginacao: Paginacao;
  };
  /** @required List of webhook configurations */
  webhooks: WebhookResponse[];
}

/**
 * Refund/return entry within a webhook callback.
 * Matches the devolucao structure sent by Bacen/Sicredi in webhook notifications.
 */
export interface WebhookDevolucao {
  /** @required Refund ID assigned by PSP */
  id: string;
  /** @required Return Transaction Reference ID */
  rtrId: string;
  /** @required Refund amount as decimal string (e.g. "10.00") */
  valor: string;
  /** @optional Nature of the refund (defaults to ORIGINAL when absent) */
  natureza?: DevolucaoNatureza;
  /** @optional Description/reason for the refund */
  descricao?: string;
  /** @required Timestamps for the refund */
  horario: {
    /** @required ISO 8601 timestamp when refund was requested */
    solicitacao: string;
    /** @optional ISO 8601 timestamp when refund was settled */
    liquidacao?: string;
  };
  /** @required Current status of the refund */
  status: DevolucaoStatus;
}

/**
 * Single PIX payment entry within a webhook callback.
 *
 * NOTE: In webhook callbacks, `horario` is a plain ISO 8601 string,
 * unlike the GET /pix response where it's an object `{ solicitacao, liquidacao? }`.
 */
export interface WebhookPixEntry {
  /** @required End-to-end ID (unique payment identifier from Bacen) */
  endToEndId: string;
  /** @optional Transaction ID (present if charge was created via cob/cobv) */
  txid?: string;
  /** @required PIX key that received the payment */
  chave: string;
  /** @required Payment amount as decimal string (e.g. "100.00") */
  valor: string;
  /** @required ISO 8601 timestamp of the payment */
  horario: string;
  /** @optional Free-text information from the payer */
  infoPagador?: string;
  /** @optional Payer identification (CPF or CNPJ with name) */
  pagador?: Pagador;
  /** @optional Breakdown of payment value (original, saque, troco) */
  componentesValor?: ComponentesValor;
  /** @optional List of refunds/returns associated with this payment */
  devolucoes?: WebhookDevolucao[];
}

/**
 * Webhook callback payload sent by Sicredi/Bacen.
 *
 * IMPORTANT: Sicredi appends '/pix' to your configured webhook URL.
 * If you configure 'https://example.com/webhook', callbacks will be
 * sent to 'https://example.com/webhook/pix'.
 */
export interface WebhookCallbackPayload {
  /** @required Array of PIX payments received */
  pix: WebhookPixEntry[];
}
