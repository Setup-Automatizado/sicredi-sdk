import { describe, expect, it } from 'vitest';
import { SicrediApiError } from '../../src/errors/api-error';
import { SicrediAuthError } from '../../src/errors/auth-error';
import { SicrediError } from '../../src/errors/base';
import { SicrediCertificateError } from '../../src/errors/certificate-error';
import { SicrediConnectionError } from '../../src/errors/connection-error';
import { SicrediValidationError } from '../../src/errors/validation-error';

describe('SicrediError', () => {
  it('sets message, code, and hint', () => {
    const error = new SicrediError('Something failed', 'ERR_CODE', 'Try again');
    expect(error.message).toBe('Something failed');
    expect(error.code).toBe('ERR_CODE');
    expect(error.hint).toBe('Try again');
  });

  it('sets name to SicrediError', () => {
    const error = new SicrediError('test', 'CODE');
    expect(error.name).toBe('SicrediError');
  });

  it('is instanceof Error', () => {
    const error = new SicrediError('test', 'CODE');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SicrediError);
  });

  it('hint is undefined when not provided', () => {
    const error = new SicrediError('test', 'CODE');
    expect(error.hint).toBeUndefined();
  });
});

describe('SicrediApiError', () => {
  describe('fromResponse', () => {
    it('parses Bacen error format with title and detail', () => {
      const body = {
        type: 'https://pix.bcb.gov.br/api/v2/error/CobOperationNotAllowed',
        title: 'Operation Not Allowed',
        status: 403,
        detail: 'You do not have permission for this operation',
        violacoes: [{ razao: 'Missing scope', propriedade: 'scope' }],
      };

      const error = SicrediApiError.fromResponse(403, body);
      expect(error).toBeInstanceOf(SicrediApiError);
      expect(error).toBeInstanceOf(SicrediError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SicrediApiError');
      expect(error.statusCode).toBe(403);
      expect(error.title).toBe('Operation Not Allowed');
      expect(error.detail).toBe('You do not have permission for this operation');
      expect(error.type).toBe('https://pix.bcb.gov.br/api/v2/error/CobOperationNotAllowed');
      expect(error.violacoes).toEqual([{ razao: 'Missing scope', propriedade: 'scope' }]);
      expect(error.message).toBe(
        'Operation Not Allowed: You do not have permission for this operation',
      );
      expect(error.code).toBe('API_ERROR');
    });

    it('handles body with only title (no detail)', () => {
      const body = {
        title: 'Bad Request',
        status: 400,
      };
      const error = SicrediApiError.fromResponse(400, body);
      expect(error.title).toBe('Bad Request');
      expect(error.detail).toBeUndefined();
      expect(error.message).toBe('Bad Request');
    });

    it('handles unknown body (no title field)', () => {
      const error = SicrediApiError.fromResponse(500, { error: 'server' });
      expect(error.title).toBe('Unknown API Error');
      expect(error.statusCode).toBe(500);
      expect(error.detail).toBe('{"error":"server"}');
    });

    it('handles null body', () => {
      const error = SicrediApiError.fromResponse(500, null);
      expect(error.title).toBe('Unknown API Error');
      expect(error.detail).toBe('null');
    });

    it('handles string body', () => {
      const error = SicrediApiError.fromResponse(500, 'raw error text');
      expect(error.title).toBe('Unknown API Error');
      expect(error.detail).toBe('raw error text');
    });
  });
});

describe('SicrediAuthError', () => {
  it('sets name and code correctly', () => {
    const error = new SicrediAuthError('test');
    expect(error.name).toBe('SicrediAuthError');
    expect(error.code).toBe('AUTH_ERROR');
    expect(error).toBeInstanceOf(SicrediError);
    expect(error).toBeInstanceOf(Error);
  });

  describe('static helpers', () => {
    it('invalidCredentials creates error with hint', () => {
      const error = SicrediAuthError.invalidCredentials();
      expect(error.message).toBe('Invalid credentials');
      expect(error.hint).toContain('clientId');
      expect(error.hint).toContain('clientSecret');
    });

    it('tokenExpired creates error with hint', () => {
      const error = SicrediAuthError.tokenExpired();
      expect(error.message).toBe('Access token has expired');
      expect(error.hint).toContain('automatically refreshed');
    });

    it('insufficientScope creates error with required scope in hint', () => {
      const error = SicrediAuthError.insufficientScope('cob.write');
      expect(error.message).toBe('Insufficient scope for this operation');
      expect(error.hint).toContain('cob.write');
    });
  });
});

describe('SicrediValidationError', () => {
  it('sets field and constraint', () => {
    const error = new SicrediValidationError('valor', 'must be positive', 'Check the amount');
    expect(error.name).toBe('SicrediValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.field).toBe('valor');
    expect(error.constraint).toBe('must be positive');
    expect(error.hint).toBe('Check the amount');
    expect(error.message).toBe("Validation failed for field 'valor': must be positive");
    expect(error).toBeInstanceOf(SicrediError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('SicrediConnectionError', () => {
  it('sets cause when provided', () => {
    const cause = new Error('ECONNREFUSED');
    const error = new SicrediConnectionError('Connection failed', cause);
    expect(error.name).toBe('SicrediConnectionError');
    expect(error.code).toBe('CONNECTION_ERROR');
    expect(error.cause).toBe(cause);
    expect(error).toBeInstanceOf(SicrediError);
    expect(error).toBeInstanceOf(Error);
  });

  describe('static helpers', () => {
    it('timeout creates error with ms in message', () => {
      const error = SicrediConnectionError.timeout(30000);
      expect(error.message).toBe('Request timed out after 30000ms');
    });

    it('refused creates error with host in message', () => {
      const error = SicrediConnectionError.refused('api-pix.sicredi.com.br');
      expect(error.message).toBe('Connection refused to host: api-pix.sicredi.com.br');
    });

    it('tlsFailure creates error with detail and hint', () => {
      const error = SicrediConnectionError.tlsFailure('certificate expired');
      expect(error.message).toBe('TLS/mTLS handshake failed: certificate expired');
      expect(error.hint).toContain('mTLS certificates');
    });
  });
});

describe('SicrediCertificateError', () => {
  it('sets name and code correctly', () => {
    const error = new SicrediCertificateError('test');
    expect(error.name).toBe('SicrediCertificateError');
    expect(error.code).toBe('CERTIFICATE_ERROR');
    expect(error).toBeInstanceOf(SicrediError);
    expect(error).toBeInstanceOf(Error);
  });

  describe('static helpers', () => {
    it('notFound creates error with path in message', () => {
      const error = SicrediCertificateError.notFound('/path/to/cert.pem');
      expect(error.message).toBe('Certificate file not found: /path/to/cert.pem');
      expect(error.hint).toContain('file exists');
    });

    it('invalidFormat creates error with detail', () => {
      const error = SicrediCertificateError.invalidFormat('cert is DER');
      expect(error.message).toBe('Invalid certificate format: cert is DER');
      expect(error.hint).toContain('DER');
    });

    it('keyMismatch creates error with hint', () => {
      const error = SicrediCertificateError.keyMismatch();
      expect(error.message).toBe('Private key does not match the certificate');
      expect(error.hint).toContain('modulus');
    });

    it('expired creates error with hint', () => {
      const error = SicrediCertificateError.expired();
      expect(error.message).toBe('Certificate has expired');
      expect(error.hint).toContain('new certificate');
    });
  });
});
