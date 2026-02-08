export interface DevedorCpf {
  /** @required CPF of the debtor (11 digits) */
  cpf: string;
  /** @required Full name of the debtor */
  nome: string;
  /** @optional Street address (required for cobv with boleto) */
  logradouro?: string;
  /** @optional City name (required for cobv with boleto) */
  cidade?: string;
  /** @optional State abbreviation (2 chars, e.g. "SP") */
  uf?: string;
  /** @optional Postal code (8 digits) */
  cep?: string;
}

export interface DevedorCnpj {
  /** @required CNPJ of the debtor (14 digits) */
  cnpj: string;
  /** @required Company name of the debtor */
  nome: string;
  /** @optional Street address (required for cobv with boleto) */
  logradouro?: string;
  /** @optional City name (required for cobv with boleto) */
  cidade?: string;
  /** @optional State abbreviation (2 chars, e.g. "SP") */
  uf?: string;
  /** @optional Postal code (8 digits) */
  cep?: string;
}

/** Debtor: either a person (CPF) or company (CNPJ) */
export type Devedor = DevedorCpf | DevedorCnpj;

export interface PagadorCpf {
  /** @required CPF of the payer (11 digits) */
  cpf: string;
  /** @required Full name of the payer */
  nome: string;
}

export interface PagadorCnpj {
  /** @required CNPJ of the payer (14 digits) */
  cnpj: string;
  /** @required Company name of the payer */
  nome: string;
}

/** Payer: either a person (CPF) or company (CNPJ) */
export type Pagador = PagadorCpf | PagadorCnpj;

/** Receiver/payee information */
export interface Recebedor {
  /** @optional CPF of the receiver (mutually exclusive with cnpj) */
  cpf?: string;
  /** @optional CNPJ of the receiver (mutually exclusive with cpf) */
  cnpj?: string;
  /** @required Full name or company name of the receiver */
  nome: string;
  /** @optional Trading name / brand name */
  nomeFantasia?: string;
  /** @optional Street address */
  logradouro?: string;
  /** @optional City name */
  cidade?: string;
  /** @optional State abbreviation (2 chars) */
  uf?: string;
  /** @optional Postal code (8 digits) */
  cep?: string;
  /** @optional Bank account number */
  conta?: string;
  /** @optional Bank branch number */
  agencia?: string;
}

export interface Valor {
  /** @required Decimal value as string, e.g. "100.00" (max 2 decimal places) */
  original: string;
}

export interface ValorComDesconto extends Valor {
  /** @optional Modality for discount/interest/penalty calculation */
  modalidade?: number;
  /** @optional Discount configuration */
  desconto?: {
    /** @required Discount modality (1-6) */
    modalidade: number;
    /** @optional Fixed value or percentage (depending on modality) */
    valorPerc?: string;
    /** @optional Date-specific discount entries (for modalities 1-2) */
    descontoDataFixa?: Array<{ data: string; valorPerc: string }>;
  };
  /** @optional Interest configuration */
  juros?: {
    /** @required Interest modality (1-8) */
    modalidade: number;
    /** @required Interest value or percentage */
    valorPerc: string;
  };
  /** @optional Penalty configuration */
  multa?: {
    /** @required Penalty modality: 1 = Fixed, 2 = Percentage */
    modalidade: number;
    /** @required Penalty value or percentage */
    valorPerc: string;
  };
  /** @optional Rebate/reduction configuration */
  abatimento?: {
    /** @required Rebate modality: 1 = Fixed, 2 = Percentage */
    modalidade: number;
    /** @required Rebate value or percentage */
    valorPerc: string;
  };
}

/** Calendar for immediate charges (cob) */
export interface Calendario {
  /** @optional ISO 8601 timestamp of creation (set by server) */
  criacao?: string;
  /** @optional ISO 8601 timestamp when the charge was presented to the payer */
  apresentacao?: string;
  /** @optional Expiration in seconds from creation (default: 86400 = 24h) */
  expiracao?: number;
}

/** Calendar for charges with due date (cobv) */
export interface CalendarioVencimento {
  /** @optional ISO 8601 timestamp of creation (set by server) */
  criacao?: string;
  /** @required Due date in YYYY-MM-DD format */
  dataDeVencimento: string;
  /** @optional Validity in days after due date (default: 30) */
  validadeAposVencimento?: number;
}

/** Additional information key-value pair displayed to the payer */
export interface InfoAdicional {
  /** @required Field name (max 50 chars) */
  nome: string;
  /** @required Field value (max 200 chars) */
  valor: string;
}

/** Pagination metadata returned by list endpoints */
export interface Paginacao {
  /** @required Current page number (0-indexed) */
  paginaAtual: number;
  /** @required Number of items per page */
  itensPorPagina: number;
  /** @required Total number of pages */
  quantidadeDePaginas: number;
  /** @required Total number of items across all pages */
  quantidadeTotalDeItens: number;
}

/** Pagination parameters for list requests */
export interface PaginacaoParams {
  /** @optional Page number to retrieve (0-indexed, default: 0) */
  paginaAtual?: number;
  /** @optional Items per page (default: 100) */
  itensPorPagina?: number;
}

/** Payload location (loc) - used to generate PIX QR codes */
export interface Loc {
  /** @required Unique identifier of the payload location */
  id: number;
  /** @required URL of the payload location */
  location: string;
  /** @required Type of charge: 'cob' (immediate) or 'cobv' (with due date) */
  tipoCob: 'cob' | 'cobv';
  /** @optional ISO 8601 timestamp of creation */
  criacao?: string;
  /** @optional Transaction ID linked to this location */
  txid?: string;
}

/** Extended location with activation/deactivation timestamps */
export interface LocCompleta extends Loc {
  /** @optional ISO 8601 timestamp when the location was activated */
  ativacao?: string;
  /** @optional ISO 8601 timestamp when the location was deactivated */
  inativacao?: string;
}

/**
 * Breakdown of payment value into components.
 * Present in received PIX payments. For cobv payments, may include juros, multa, desconto, abatimento.
 *
 * Formula: valor = (original + saque + troco) + multa + juros - abatimento - desconto
 * (only present fields are included in the calculation)
 */
export interface ComponentesValor {
  /** @optional Original payment amount (may be omitted for pure Pix Saque, or 0.00) */
  original?: { valor: string };
  /** @optional Withdrawal (saque) component - PIX Saque */
  saque?: {
    /** @required Withdrawal amount as decimal string */
    valor: string;
    /**
     * @required Agent modality:
     * - AGTEC: Agente Estabelecimento Comercial
     * - AGTOT: Agente Outra Especie de PJ
     * - AGPSS: Agente Facilitador de Servico de Saque
     */
    modalidadeAgente: 'AGTEC' | 'AGTOT' | 'AGPSS';
    /** @optional ISPB of the withdrawal service provider */
    prestadorDeServicoDeSaque?: string;
  };
  /** @optional Change (troco) component - PIX Troco (mutually exclusive with saque) */
  troco?: {
    /** @required Change amount as decimal string */
    valor: string;
    /**
     * @required Agent modality:
     * - AGTEC: Agente Estabelecimento Comercial
     * - AGTOT: Agente Outra Especie de PJ
     * - AGPSS: Agente Facilitador de Servico de Saque
     */
    modalidadeAgente: 'AGTEC' | 'AGTOT' | 'AGPSS';
    /** @optional ISPB of the withdrawal service provider */
    prestadorDeServicoDeSaque?: string;
  };
  /** @optional Interest amount (only for cobv payments after due date) */
  juros?: { valor: string };
  /** @optional Penalty amount (only for cobv payments after due date) */
  multa?: { valor: string };
  /** @optional Rebate/reduction amount (only for cobv payments) */
  abatimento?: { valor: string };
  /** @optional Discount amount (only for cobv payments before due date) */
  desconto?: { valor: string };
}

/** Configuration for Saque (withdrawal) or Troco (change) in a charge */
export interface SaqueTroco {
  /** @required Amount as decimal string (e.g. "20.00") */
  valor: string;
  /** @optional Whether the payer can modify the amount: 0 = No, 1 = Yes */
  modalidadeAlteracao?: 0 | 1;
  /** @optional ISPB of the withdrawal service provider */
  prestadorDeServicoDeSaque?: string;
  /**
   * @required Agent modality:
   * - AGTEC: Agente Estabelecimento Comercial
   * - AGTOT: Agente Outra Especie de PJ
   * - AGPSS: Agente Facilitador de Servico de Saque
   */
  modalidadeAgente: 'AGTEC' | 'AGTOT' | 'AGPSS';
}

/**
 * Status for refund/return operations.
 * Includes both legacy (v2) and current (v2.9+) status names for compatibility.
 * - EM_PROCESSAMENTO / PENDENTE: Refund is being processed
 * - DEVOLVIDO / LIQUIDADO: Refund has been settled
 * - NAO_REALIZADO: Refund could not be completed
 */
export type DevolucaoStatus =
  | 'EM_PROCESSAMENTO'
  | 'DEVOLVIDO'
  | 'NAO_REALIZADO'
  | 'PENDENTE'
  | 'LIQUIDADO';

/**
 * Nature of the refund/return (response - all possible values from PSP).
 * - ORIGINAL (MD06): Refund of a regular Pix or the purchase value in Pix Troco
 * - RETIRADA (SL02): Refund of a Pix Saque or the change value in Pix Troco
 * - MED_OPERACIONAL (BE08): MED refund due to operational failure
 * - MED_FRAUDE (FR01): MED refund due to suspected fraud
 * - MED_PIX_AUTOMATICO (REFU): MED reimbursement for Pix Automatico
 *
 * When absent, defaults to ORIGINAL.
 */
export type DevolucaoNatureza =
  | 'ORIGINAL'
  | 'RETIRADA'
  | 'MED_OPERACIONAL'
  | 'MED_FRAUDE'
  | 'MED_PIX_AUTOMATICO';

/**
 * Nature of a refund/return request (request - only user-initiated values).
 * - ORIGINAL (MD06): Refund of a regular Pix or the purchase value in Pix Troco
 * - RETIRADA (SL02): Refund of a Pix Saque or the change value in Pix Troco
 *
 * When absent, defaults to ORIGINAL.
 */
export type DevolucaoSolicitadaNatureza = 'ORIGINAL' | 'RETIRADA';

/** Type guard: checks if a Devedor is identified by CPF */
export function isDevedorCpf(devedor: Devedor): devedor is DevedorCpf {
  return 'cpf' in devedor;
}

/** Type guard: checks if a Devedor is identified by CNPJ */
export function isDevedorCnpj(devedor: Devedor): devedor is DevedorCnpj {
  return 'cnpj' in devedor;
}

/** Type guard: checks if a Pagador is identified by CPF */
export function isPagadorCpf(pagador: Pagador): pagador is PagadorCpf {
  return 'cpf' in pagador;
}

/** Type guard: checks if a Pagador is identified by CNPJ */
export function isPagadorCnpj(pagador: Pagador): pagador is PagadorCnpj {
  return 'cnpj' in pagador;
}
