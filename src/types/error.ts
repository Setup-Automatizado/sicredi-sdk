/** A single validation violation in a Bacen error response */
export interface Violacao {
  /** @required Reason for the validation failure */
  razao: string;
  /** @required Property/field that caused the violation (dot-notation path) */
  propriedade: string;
}

/**
 * Standard error response format from Bacen PIX API.
 * Returned by Sicredi for 4xx/5xx HTTP responses.
 */
export interface BacenErrorResponse {
  /** @optional Error type URI from Bacen taxonomy (e.g. "https://pix.bcb.gov.br/api/v2/error/CobOperacaoInvalida") */
  type?: string;
  /** @required Human-readable error title */
  title: string;
  /** @required HTTP status code */
  status: number;
  /** @optional Detailed error description */
  detail?: string;
  /** @optional URI identifying the specific occurrence of the problem (RFC 7807) */
  instance?: string;
  /** @optional List of field-level validation violations */
  violacoes?: Violacao[];
}
