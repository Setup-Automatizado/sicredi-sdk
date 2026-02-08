import type {
  Calendario,
  ComponentesValor,
  Devedor,
  DevolucaoNatureza,
  DevolucaoStatus,
  InfoAdicional,
  Loc,
  Pagador,
  Paginacao,
  PaginacaoParams,
  SaqueTroco,
  Valor,
} from './common';

/**
 * Status of an immediate PIX charge (cob).
 * - ATIVA: Charge is active and can be paid
 * - CONCLUIDA: Charge has been paid
 * - REMOVIDA_PELO_USUARIO_RECEBEDOR: Cancelled by the receiver
 * - REMOVIDA_PELO_PSP: Removed by the Payment Service Provider
 */
export type CobStatus =
  | 'ATIVA'
  | 'CONCLUIDA'
  | 'REMOVIDA_PELO_USUARIO_RECEBEDOR'
  | 'REMOVIDA_PELO_PSP';

/** Refund/return attached to a PIX payment */
export interface Devolucao {
  /** @required Refund ID assigned by PSP */
  id: string;
  /** @required Return Transaction Reference ID (32 alphanumeric chars, e.g. "D12345678202009091000abcde123456") */
  rtrId: string;
  /** @required Refund amount as decimal string (e.g. "10.00") */
  valor: string;
  /** @optional Nature of the refund (defaults to ORIGINAL when absent) */
  natureza?: DevolucaoNatureza;
  /** @optional Description/reason for the refund (max 140 chars) */
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
  /** @optional Reason/description of the status (e.g. explains NAO_REALIZADO reason) */
  motivo?: string;
}

/** PIX payment received against a charge */
export interface PixPayment {
  /** @required End-to-end ID (unique payment identifier from Bacen) */
  endToEndId: string;
  /** @optional Transaction ID (present if payment is linked to a charge) */
  txid?: string;
  /** @required Payment amount as decimal string */
  valor: string;
  /** @optional PIX key that received the payment */
  chave?: string;
  /** @optional Payer identification (CPF or CNPJ with name) */
  pagador?: Pagador;
  /** @required Payment timestamps */
  horario: {
    /** @required ISO 8601 timestamp when payment was requested */
    solicitacao: string;
    /** @optional ISO 8601 timestamp when payment was settled */
    liquidacao?: string;
  };
  /** @optional Free-text information from the payer */
  infoPagador?: string;
  /** @optional Breakdown of payment value (original, saque, troco) */
  componentesValor?: ComponentesValor;
  /** @optional List of refunds/returns associated with this payment */
  devolucoes?: Devolucao[];
}

/** Request body for creating an immediate PIX charge */
export interface CreateCobRequest {
  /** @required Calendar with expiration settings */
  calendario: {
    /** @required Expiration in seconds from creation */
    expiracao: number;
  };
  /** @optional Debtor information (person or company) */
  devedor?: Devedor;
  /** @required Charge amount */
  valor: Valor;
  /** @required PIX key of the receiver */
  chave: string;
  /** @optional Free-text message requesting payment info from payer (max 140 chars) */
  solicitacaoPagador?: string;
  /** @optional Additional information fields displayed to the payer */
  infoAdicionais?: InfoAdicional[];
  /** @optional Link to an existing payload location by ID */
  loc?: { id: number };
  /** @optional Withdrawal (Saque) configuration - PIX Saque */
  saque?: SaqueTroco;
  /** @optional Change (Troco) configuration - PIX Troco */
  troco?: SaqueTroco;
}

/** Response from creating/querying an immediate PIX charge */
export interface CobResponse {
  /** @required Calendar with creation and expiration info */
  calendario: Calendario;
  /** @required Transaction ID (26-35 alphanumeric chars) */
  txid: string;
  /** @required Revision number (increments on each update) */
  revisao: number;
  /** @optional Payload location details */
  loc?: Loc;
  /** @optional Payload location URL string */
  location?: string;
  /** @required Current status of the charge */
  status: CobStatus;
  /** @optional Debtor information */
  devedor?: Devedor;
  /** @required Charge amount */
  valor: Valor;
  /** @required PIX key of the receiver */
  chave: string;
  /** @optional Free-text message requesting payment info from payer */
  solicitacaoPagador?: string;
  /** @optional Additional information fields */
  infoAdicionais?: InfoAdicional[];
  /** @optional PIX Copia e Cola string (BR Code payload for copy-paste) */
  pixCopiaECola?: string;
  /** @optional BR Code string (raw QR code content) */
  brcode?: string;
  /** @optional List of PIX payments received for this charge */
  pix?: PixPayment[];
  /** @optional Withdrawal (Saque) configuration */
  saque?: SaqueTroco;
  /** @optional Change (Troco) configuration */
  troco?: SaqueTroco;
}

/** Request body for updating (PATCH) an immediate PIX charge */
export interface UpdateCobRequest {
  /** @optional Updated calendar/expiration settings */
  calendario?: {
    /** @required Expiration in seconds */
    expiracao: number;
  };
  /** @optional Updated debtor information */
  devedor?: Devedor;
  /** @optional Updated charge amount */
  valor?: Valor;
  /** @optional Updated PIX key */
  chave?: string;
  /** @optional Updated payment request message */
  solicitacaoPagador?: string;
  /** @optional Updated additional information fields */
  infoAdicionais?: InfoAdicional[];
  /** @optional Link to an existing payload location by ID */
  loc?: { id: number };
  /** @optional Set to 'REMOVIDA_PELO_USUARIO_RECEBEDOR' to cancel the charge */
  status?: 'REMOVIDA_PELO_USUARIO_RECEBEDOR';
}

/** Parameters for listing immediate PIX charges */
export interface ListCobParams {
  /** @required Start date filter (ISO 8601, e.g. "2024-01-01T00:00:00Z") */
  inicio: string;
  /** @required End date filter (ISO 8601) */
  fim: string;
  /** @optional Filter by debtor CPF (11 digits) */
  cpf?: string;
  /** @optional Filter by debtor CNPJ (14 digits) */
  cnpj?: string;
  /** @optional Filter by whether a payload location is present */
  locationPresente?: boolean;
  /** @optional Filter by charge status */
  status?: CobStatus;
  /** @optional Pagination parameters */
  paginacao?: PaginacaoParams;
}

/** Response from listing immediate PIX charges */
export interface ListCobResponse {
  /** @required Query parameters and pagination metadata */
  parametros: {
    /** @required Start date used in the query */
    inicio: string;
    /** @required End date used in the query */
    fim: string;
    /** @required Pagination metadata */
    paginacao: Paginacao;
  };
  /** @required List of charges matching the filters */
  cobs: CobResponse[];
}
