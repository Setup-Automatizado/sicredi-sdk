// Main client
export { Sicredi } from './client';

// Types
export type { SicrediConfig, CertificateOptions } from './types/config';
export type { TokenResponse, CachedToken } from './types/auth';
export type { Violacao, BacenErrorResponse } from './types/error';
export type {
  DevedorCpf,
  DevedorCnpj,
  Devedor,
  PagadorCpf,
  PagadorCnpj,
  Pagador,
  Recebedor,
  Valor,
  ValorComDesconto,
  Calendario,
  CalendarioVencimento,
  InfoAdicional,
  Paginacao,
  PaginacaoParams,
  Loc,
  LocCompleta,
  ComponentesValor,
  SaqueTroco,
  DevolucaoStatus,
  DevolucaoNatureza,
  DevolucaoSolicitadaNatureza,
} from './types/common';
export type {
  CobStatus,
  Devolucao,
  PixPayment,
  CreateCobRequest,
  CobResponse,
  UpdateCobRequest,
  ListCobParams,
  ListCobResponse,
} from './types/cob';
export type {
  CobvStatus,
  DescontoDataFixa,
  Desconto,
  Juros,
  Multa,
  Abatimento,
  ValorCobv,
  CreateCobvRequest,
  CobvResponse,
  UpdateCobvRequest,
  ListCobvParams,
  ListCobvResponse,
} from './types/cobv';
export type {
  WebhookConfigRequest,
  WebhookResponse,
  ListWebhookParams,
  ListWebhookResponse,
  WebhookDevolucao,
  WebhookPixEntry,
  WebhookCallbackPayload,
} from './types/webhook';
export type {
  PixRecebido,
  DevolucaoRequest,
  DevolucaoResponse,
  ListPixParams,
  ListPixResponse,
} from './types/pix';
export type {
  LoteCobvItemStatus,
  LoteCobvCobSolicitado,
  LoteCobvRequest,
  LoteCobvPatchRequest,
  LoteCobvResponse,
  ListLoteCobvParams,
  ListLoteCobvResponse,
} from './types/lotecobv';
export type {
  CreateLocRequest,
  LocResponse,
  ListLocParams,
  ListLocResponse,
} from './types/loc';

// Errors
export {
  SicrediError,
  SicrediApiError,
  SicrediAuthError,
  SicrediValidationError,
  SicrediConnectionError,
  SicrediCertificateError,
} from './errors';

// Utilities
export { generateTxId, isValidTxId } from './utils/txid';
export {
  isValidCpf,
  isValidCnpj,
  isValidPixKey,
  detectPixKeyType,
  isValidMonetaryValue,
} from './utils/validators';
export type { PixKeyType } from './utils/validators';
export { generateQrCodeSvg, generateQrCodeDataUrl } from './utils/qrcode';
export {
  toISOString,
  createDateRange,
  parseDate,
  formatDateOnly,
} from './utils/date';
export {
  isDevedorCpf,
  isDevedorCnpj,
  isPagadorCpf,
  isPagadorCnpj,
} from './types/common';
export { SICREDI_URLS, SICREDI_ISPB } from './utils/constants';

// Webhook handler
export { parseWebhookPayload } from './webhook-handler';
export type { WebhookParseResult } from './webhook-handler';
