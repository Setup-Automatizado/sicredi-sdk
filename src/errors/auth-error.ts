import { SicrediError } from './base';

export class SicrediAuthError extends SicrediError {
  constructor(message: string, hint?: string) {
    super(message, 'AUTH_ERROR', hint);
    this.name = 'SicrediAuthError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static invalidCredentials(): SicrediAuthError {
    return new SicrediAuthError(
      'Invalid credentials',
      'Check that your clientId and clientSecret are correct and have not been revoked.',
    );
  }

  static tokenExpired(): SicrediAuthError {
    return new SicrediAuthError(
      'Access token has expired',
      'The token will be automatically refreshed on the next request. If this persists, re-authenticate.',
    );
  }

  static insufficientScope(required: string): SicrediAuthError {
    return new SicrediAuthError(
      'Insufficient scope for this operation',
      `This operation requires the following scope: ${required}. Ensure your credentials are provisioned with the necessary permissions.`,
    );
  }
}
