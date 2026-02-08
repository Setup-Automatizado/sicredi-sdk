/** Raw token response from Sicredi OAuth2 endpoint */
export interface TokenResponse {
  /** @required JWT access token */
  access_token: string;
  /** @required Token type (always "Bearer") */
  token_type: string;
  /** @required Token validity in seconds (typically 3600) */
  expires_in: number;
  /** @required Granted scopes (space-separated) */
  scope: string;
}

/** Internal cached token representation */
export interface CachedToken {
  /** @required JWT access token string */
  accessToken: string;
  /** @required Expiration timestamp in milliseconds (Date.now() based) */
  expiresAt: number;
  /** @required Granted scopes */
  scope: string;
}
