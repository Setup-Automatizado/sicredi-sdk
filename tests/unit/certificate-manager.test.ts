import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificateManager } from '../../src/core/certificate-manager';
import { SicrediCertificateError } from '../../src/errors/certificate-error';

// Mock node:fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { existsSync, readFileSync } from 'node:fs';

const MOCK_PEM_CERT = `-----BEGIN CERTIFICATE-----
MIIDdzCCAl+gAwIBAgIEAgAAuTANBgkqhkiG9w0BAQUFADBaMQswCQYDVQQGEwJJ
RTESMBAGA1UEChMJQmFsdGltb3JlMRMwEQYDVQQLEwpDeWJlclRydXN0MSIwIAYD
VQQDExlCYWx0aW1vcmUgQ3liZXJUcnVzdCBSb290MB4XDTAwMDUxMjE4NDYwMFoX
DTI1MDUxMjIzNTkwMFowWjELMAkGA1UEBhMCSUUxEjAQBgNVBAoTCUJhbHRpbW9y
-----END CERTIFICATE-----`;

const MOCK_PEM_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7o4qne60TB3pM
hkMBRarF2GQJAkQJaf/e3M0abJ+FYLzmBGkmqGNPNqopGhhWzmJFg6dRG8VX+fFH
-----END PRIVATE KEY-----`;

describe('CertificateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PEM content detection', () => {
    it('returns PEM content as-is when cert and key are PEM strings', () => {
      const manager = new CertificateManager({
        cert: MOCK_PEM_CERT,
        key: MOCK_PEM_KEY,
      });

      const resolved = manager.resolve();

      expect(resolved.cert).toBe(MOCK_PEM_CERT);
      expect(resolved.key).toBe(MOCK_PEM_KEY);
      expect(existsSync).not.toHaveBeenCalled();
      expect(readFileSync).not.toHaveBeenCalled();
    });

    it('returns PEM content for ca as well', () => {
      const manager = new CertificateManager({
        cert: MOCK_PEM_CERT,
        key: MOCK_PEM_KEY,
        ca: MOCK_PEM_CERT,
      });

      const resolved = manager.resolve();
      expect(resolved.ca).toBe(MOCK_PEM_CERT);
    });
  });

  describe('file path resolution', () => {
    it('throws SicrediCertificateError.notFound when file does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const manager = new CertificateManager({
        cert: '/path/to/nonexistent/cert.pem',
        key: MOCK_PEM_KEY,
      });

      expect(() => manager.resolve()).toThrow(SicrediCertificateError);
      expect(() => manager.resolve()).toThrow('Certificate file not found');
    });

    it('reads file and returns PEM content from file', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(Buffer.from(MOCK_PEM_CERT));

      const manager = new CertificateManager({
        cert: '/path/to/cert.pem',
        key: MOCK_PEM_KEY,
      });

      const resolved = manager.resolve();
      expect(resolved.cert).toBe(MOCK_PEM_CERT);
      expect(existsSync).toHaveBeenCalledWith('/path/to/cert.pem');
      expect(readFileSync).toHaveBeenCalledWith('/path/to/cert.pem');
    });
  });

  describe('caching', () => {
    it('resolve() caches the result on subsequent calls', () => {
      const manager = new CertificateManager({
        cert: MOCK_PEM_CERT,
        key: MOCK_PEM_KEY,
      });

      const result1 = manager.resolve();
      const result2 = manager.resolve();

      expect(result1).toBe(result2); // Same reference
    });
  });

  describe('clear()', () => {
    it('clears the cache so resolve() re-resolves', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(Buffer.from(MOCK_PEM_CERT));

      const manager = new CertificateManager({
        cert: '/path/to/cert.pem',
        key: MOCK_PEM_KEY,
      });

      const result1 = manager.resolve();
      manager.clear();
      const result2 = manager.resolve();

      // Different object references since cache was cleared
      expect(result1).not.toBe(result2);
      // But same content
      expect(result1.cert).toBe(result2.cert);
      expect(result1.key).toBe(result2.key);
    });
  });

  describe('passphrase', () => {
    it('passes through the passphrase option', () => {
      const manager = new CertificateManager({
        cert: MOCK_PEM_CERT,
        key: MOCK_PEM_KEY,
        passphrase: 'my-secret-passphrase',
      });

      const resolved = manager.resolve();
      expect(resolved.passphrase).toBe('my-secret-passphrase');
    });

    it('passphrase is undefined when not provided', () => {
      const manager = new CertificateManager({
        cert: MOCK_PEM_CERT,
        key: MOCK_PEM_KEY,
      });

      const resolved = manager.resolve();
      expect(resolved.passphrase).toBeUndefined();
    });
  });

  describe('DER format detection', () => {
    it('throws SicrediCertificateError.invalidFormat for DER files', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      // DER signature: 0x30 0x82 followed by data
      const derBuffer = Buffer.from([0x30, 0x82, 0x01, 0x02, 0x03]);
      vi.mocked(readFileSync).mockReturnValue(derBuffer);

      const manager = new CertificateManager({
        cert: '/path/to/cert.der',
        key: MOCK_PEM_KEY,
      });

      expect(() => manager.resolve()).toThrow(SicrediCertificateError);
      expect(() => manager.resolve()).toThrow('Invalid certificate format');
    });
  });
});
