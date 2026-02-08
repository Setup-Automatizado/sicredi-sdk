import type { CobvResponse, CreateCobvRequest } from './cobv';
import type { Paginacao, PaginacaoParams } from './common';

/**
 * Status of an individual charge within a batch.
 * - EM_PROCESSAMENTO: Charge is being processed
 * - CRIADA: Charge was successfully created
 */
export type LoteCobvItemStatus = 'EM_PROCESSAMENTO' | 'CRIADA';

/** A single cobv charge request within a batch, requiring a txid */
export interface LoteCobvCobSolicitado extends CreateCobvRequest {
  /** @required Transaction ID for this charge (26-35 alphanumeric chars) */
  txid: string;
}

/** Request body for creating a batch of cobv charges (PUT /lotecobv/{id}) */
export interface LoteCobvRequest {
  /** @optional Description for the batch */
  descricao?: string;
  /** @required Array of cobv charges to create */
  cobsv: LoteCobvCobSolicitado[];
}

/** Request body for updating specific charges within a batch (PATCH /lotecobv/{id}) */
export interface LoteCobvPatchRequest {
  /** @required Array of partial updates, each identified by txid */
  cobsv: Array<
    Partial<CreateCobvRequest> & {
      /** @required Transaction ID of the charge to update */
      txid: string;
    }
  >;
}

/** Response from querying a batch of cobv charges */
export interface LoteCobvResponse {
  /** @required Batch ID */
  id: number;
  /** @optional Description for the batch */
  descricao?: string;
  /** @required ISO 8601 timestamp of batch creation */
  criacao: string;
  /** @required Array of cobv charge items with batch-specific status */
  cobsv: Array<{
    /** @required Transaction ID for this charge */
    txid: string;
    /** @required Batch processing status for this charge */
    status: LoteCobvItemStatus;
    /** @optional Full charge details (present when status is CRIADA) */
    criacao?: CobvResponse;
    /** @optional Processing error for this specific charge */
    problema?: {
      /** @required Error type URI (Bacen error taxonomy) */
      type: string;
      /** @required Human-readable error title */
      title: string;
      /** @required HTTP status code */
      status: number;
      /** @optional Detailed error description */
      detail?: string;
    };
  }>;
}

/** Parameters for listing batches of cobv charges */
export interface ListLoteCobvParams {
  /** @required Start date filter (ISO 8601) */
  inicio: string;
  /** @required End date filter (ISO 8601) */
  fim: string;
  /** @optional Pagination parameters */
  paginacao?: PaginacaoParams;
}

/** Response from listing batches of cobv charges */
export interface ListLoteCobvResponse {
  /** @required Query parameters and pagination metadata */
  parametros: {
    /** @required Start date used in the query */
    inicio: string;
    /** @required End date used in the query */
    fim: string;
    /** @required Pagination metadata */
    paginacao: Paginacao;
  };
  /** @required List of batch responses */
  lotes: LoteCobvResponse[];
}
