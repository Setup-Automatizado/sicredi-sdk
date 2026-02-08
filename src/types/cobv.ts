import type { PixPayment } from './cob';
import type {
  CalendarioVencimento,
  Devedor,
  InfoAdicional,
  Loc,
  Paginacao,
  PaginacaoParams,
  Recebedor,
} from './common';

/**
 * Status of a charge with due date (cobv / Boleto Hibrido).
 * - ATIVA: Charge is active and can be paid
 * - CONCLUIDA: Charge has been paid
 * - REMOVIDA_PELO_USUARIO_RECEBEDOR: Cancelled by the receiver
 * - REMOVIDA_PELO_PSP: Removed by the Payment Service Provider
 * - VENCIDA: Charge is past due date + validity period
 */
export type CobvStatus =
  | 'ATIVA'
  | 'CONCLUIDA'
  | 'REMOVIDA_PELO_USUARIO_RECEBEDOR'
  | 'REMOVIDA_PELO_PSP'
  | 'VENCIDA';

/** Date-specific discount entry for modalities 1 and 2 */
export interface DescontoDataFixa {
  /** @required Date in YYYY-MM-DD format when this discount applies */
  data: string;
  /** @required Fixed value or percentage for this date */
  valorPerc: string;
}

/** Discount configuration for charges with due date */
export interface Desconto {
  /**
   * @required Discount modality:
   * - 1 = Fixed value until specific dates
   * - 2 = Percentage until specific dates
   * - 3 = Fixed value per anticipation day
   * - 4 = Percentage per anticipation day
   * - 5 = Fixed value per anticipation day (up to a date)
   * - 6 = Percentage per anticipation day (up to a date)
   */
  modalidade: 1 | 2 | 3 | 4 | 5 | 6;
  /** @optional Date-specific discount entries (required for modalities 1-2) */
  descontoDataFixa?: DescontoDataFixa[];
  /** @optional Fixed value or percentage (required for modalities 3-6) */
  valorPerc?: string;
}

/** Interest configuration for overdue charges */
export interface Juros {
  /**
   * @required Interest modality:
   * - 1 = Fixed daily value
   * - 2 = Percentage per month (pro-rata per day)
   * - 3 = Percentage per year (365 days)
   * - 4 = Percentage per year (360 days)
   * - 5 = Percentage per business day (252 days/year)
   * - 6 = Percentage per business day (360 days/year)
   * - 7 = Fixed monthly value
   * - 8 = Exempt (no interest)
   */
  modalidade: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** @required Interest value or percentage as decimal string */
  valorPerc: string;
}

/** Penalty (multa) configuration for overdue charges */
export interface Multa {
  /** @required Penalty modality: 1 = Fixed value, 2 = Percentage */
  modalidade: 1 | 2;
  /** @required Penalty value or percentage as decimal string */
  valorPerc: string;
}

/** Rebate/reduction (abatimento) configuration */
export interface Abatimento {
  /** @required Rebate modality: 1 = Fixed value, 2 = Percentage */
  modalidade: 1 | 2;
  /** @required Rebate value or percentage as decimal string */
  valorPerc: string;
}

/** Value configuration for charges with due date, including financial components */
export interface ValorCobv {
  /** @required Original charge amount as decimal string (e.g. "150.00") */
  original: string;
  /** @optional Final calculated amount after applying interest, penalty, discounts, and rebates (set by server) */
  final?: string;
  /** @optional Penalty configuration applied after due date */
  multa?: Multa;
  /** @optional Interest configuration applied after due date */
  juros?: Juros;
  /** @optional Rebate/reduction applied to the charge */
  abatimento?: Abatimento;
  /** @optional Discount configuration for early payment */
  desconto?: Desconto;
}

/** Request body for creating a charge with due date (Boleto Hibrido) */
export interface CreateCobvRequest {
  /** @required Calendar with due date and validity settings */
  calendario: CalendarioVencimento;
  /** @required Debtor information (required for cobv, unlike cob) */
  devedor: Devedor;
  /** @required Charge amount with optional financial components */
  valor: ValorCobv;
  /** @required PIX key of the receiver */
  chave: string;
  /** @optional Free-text message requesting payment info from payer (max 140 chars) */
  solicitacaoPagador?: string;
  /** @optional Additional information fields displayed to the payer */
  infoAdicionais?: InfoAdicional[];
  /** @optional Link to an existing payload location by ID */
  loc?: { id: number };
}

/** Response from creating/querying a charge with due date */
export interface CobvResponse {
  /** @required Calendar with due date info */
  calendario: CalendarioVencimento;
  /** @required Transaction ID (26-35 alphanumeric chars) */
  txid: string;
  /** @required Revision number (increments on each update) */
  revisao: number;
  /** @optional Payload location details */
  loc?: Loc;
  /** @optional Payload location URL string */
  location?: string;
  /** @required Current status of the charge */
  status: CobvStatus;
  /** @required Debtor information */
  devedor: Devedor;
  /** @optional Receiver information (set by server) */
  recebedor?: Recebedor;
  /** @required Charge amount with financial components */
  valor: ValorCobv;
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
}

/** Request body for updating (PATCH) a charge with due date */
export interface UpdateCobvRequest {
  /** @optional Updated calendar/due date settings */
  calendario?: CalendarioVencimento;
  /** @optional Updated debtor information */
  devedor?: Devedor;
  /** @optional Updated charge amount */
  valor?: ValorCobv;
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

/** Parameters for listing charges with due date */
export interface ListCobvParams {
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
  status?: CobvStatus;
  /** @optional Filter by batch ID (loteCobVId) */
  loteCobVId?: number;
  /** @optional Pagination parameters */
  paginacao?: PaginacaoParams;
}

/** Response from listing charges with due date */
export interface ListCobvResponse {
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
  cobs: CobvResponse[];
}

// Re-export shared types used in cobv responses
export type { Devolucao, PixPayment } from './cob';
