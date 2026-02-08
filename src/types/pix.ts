import type { Devolucao } from './cob';
import type {
  ComponentesValor,
  DevolucaoNatureza,
  DevolucaoSolicitadaNatureza,
  DevolucaoStatus,
  Pagador,
  Paginacao,
  PaginacaoParams,
  Recebedor,
} from './common';

/** A received PIX payment (from GET /pix endpoints) */
export interface PixRecebido {
  /** @required End-to-end ID (unique payment identifier from Bacen) */
  endToEndId: string;
  /** @optional Transaction ID (present if payment is linked to a charge) */
  txid?: string;
  /** @required Payment amount as decimal string (e.g. "100.00") */
  valor: string;
  /** @required PIX key that received the payment */
  chave: string;
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
  /** @optional Receiver information */
  recebedor?: Recebedor;
  /** @optional Breakdown of payment value (original, saque, troco, juros, multa, desconto, abatimento) */
  componentesValor?: ComponentesValor;
  /** @optional List of refunds/returns associated with this payment */
  devolucoes?: Devolucao[];
}

/** Request body for creating a refund/return */
export interface DevolucaoRequest {
  /** @required Refund amount as decimal string (e.g. "10.00", must be <= original payment) */
  valor: string;
  /** @optional Nature of the refund: ORIGINAL (default, MD06) or RETIRADA (SL02, for Saque/Troco) */
  natureza?: DevolucaoSolicitadaNatureza;
  /** @optional Description/reason for the refund (max 140 chars, shown in pacs.004 RemittanceInformation) */
  descricao?: string;
}

/** Response from creating/querying a refund/return */
export interface DevolucaoResponse {
  /** @required Refund ID assigned by PSP */
  id: string;
  /** @required Return Transaction Reference ID */
  rtrId: string;
  /** @required Refund amount as decimal string */
  valor: string;
  /** @optional Nature of the refund */
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
  /** @optional Reason/description of the status (e.g. explains NAO_REALIZADO reason) */
  motivo?: string;
}

/** Parameters for listing received PIX payments */
export interface ListPixParams {
  /** @required Start date filter (ISO 8601) */
  inicio: string;
  /** @required End date filter (ISO 8601) */
  fim: string;
  /** @optional Filter by specific transaction ID */
  txid?: string;
  /** @optional Filter by whether a txid is present */
  txIdPresente?: boolean;
  /** @optional Filter by whether refunds/returns are present */
  devolucaoPresente?: boolean;
  /** @optional Filter by payer CPF (11 digits) */
  cpf?: string;
  /** @optional Filter by payer CNPJ (14 digits) */
  cnpj?: string;
  /** @optional Pagination parameters */
  paginacao?: PaginacaoParams;
}

/** Response from listing received PIX payments */
export interface ListPixResponse {
  /** @required Query parameters and pagination metadata */
  parametros: {
    /** @required Start date used in the query */
    inicio: string;
    /** @required End date used in the query */
    fim: string;
    /** @required Pagination metadata */
    paginacao: Paginacao;
  };
  /** @required List of received PIX payments */
  pix: PixRecebido[];
}
