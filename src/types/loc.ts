import type { LocCompleta, Paginacao, PaginacaoParams } from './common';

/** Request body for creating a payload location */
export interface CreateLocRequest {
  /** @required Type of charge: 'cob' (immediate) or 'cobv' (with due date) */
  tipoCob: 'cob' | 'cobv';
}

/** Response from creating/querying a payload location */
export type LocResponse = LocCompleta;

/** Parameters for listing payload locations */
export interface ListLocParams {
  /** @required Start date filter (ISO 8601) */
  inicio: string;
  /** @required End date filter (ISO 8601) */
  fim: string;
  /** @optional Filter by charge type: 'cob' or 'cobv' */
  tipoCob?: 'cob' | 'cobv';
  /** @optional Filter by whether a txid is linked to the location */
  txIdPresente?: boolean;
  /** @optional Pagination parameters */
  paginacao?: PaginacaoParams;
}

/** Response from listing payload locations */
export interface ListLocResponse {
  /** @required Query parameters and pagination metadata */
  parametros: {
    /** @required Start date used in the query */
    inicio: string;
    /** @required End date used in the query */
    fim: string;
    /** @required Pagination metadata */
    paginacao: Paginacao;
  };
  /** @required List of payload locations */
  loc: LocResponse[];
}
