export const SICREDI_URLS = {
  production: 'https://api-pix.sicredi.com.br',
  sandbox: 'https://api-pix-h.sicredi.com.br',
} as const;

export const SICREDI_ISPB = '01181521';

export const OAUTH_SCOPES =
  'cob.write cob.read cobv.write cobv.read pix.read webhook.read webhook.write lotecobv.write lotecobv.read';

export const API_VERSIONS = {
  cob: {
    create: '/api/v2/cob',
    get: '/api/v3/cob', // NOTE: GET uses v3!
    update: '/api/v2/cob',
    list: '/api/v2/cob',
  },
  cobv: {
    create: '/api/v2/cobv',
    get: '/api/v2/cobv',
    update: '/api/v2/cobv',
    list: '/api/v2/cobv',
  },
  pix: {
    base: '/api/v2/pix',
  },
  lotecobv: {
    base: '/api/v2/lotecobv',
  },
  loc: {
    base: '/api/v2/loc',
  },
  webhook: {
    base: '/api/v2/webhook',
  },
} as const;

export const TOKEN_ENDPOINT = '/oauth/token';

export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_MAX_RETRIES = 3;
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
