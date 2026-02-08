import { describe, expect, it } from 'vitest';
import { parseWebhookPayload } from '../../src/webhook-handler/index';

const validPixItem = {
  endToEndId: 'E01181521202306151234abcdefghijkl',
  txid: 'txid123456789012345678901234',
  chave: '52998224725',
  valor: '100.00',
  horario: '2024-06-15T10:30:00.000Z',
};

const validPayload = {
  pix: [validPixItem],
};

describe('parseWebhookPayload', () => {
  describe('with string input', () => {
    it('returns valid: true with parsed payload for valid JSON string', () => {
      const result = parseWebhookPayload(JSON.stringify(validPayload));
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload!.pix).toHaveLength(1);
      expect(result.payload!.pix[0]!.endToEndId).toBe(validPixItem.endToEndId);
      expect(result.payload!.pix[0]!.chave).toBe(validPixItem.chave);
      expect(result.payload!.pix[0]!.valor).toBe(validPixItem.valor);
      expect(result.payload!.pix[0]!.horario).toBe(validPixItem.horario);
      expect(result.error).toBeUndefined();
    });

    it('returns valid: false for invalid JSON string', () => {
      const result = parseWebhookPayload('not valid json {{{');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid JSON body');
      expect(result.payload).toBeUndefined();
    });
  });

  describe('with object input', () => {
    it('returns valid: true with parsed payload for valid object', () => {
      const result = parseWebhookPayload(validPayload);
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload!.pix).toHaveLength(1);
    });

    it('supports multiple pix items', () => {
      const multiPayload = {
        pix: [
          validPixItem,
          {
            endToEndId: 'E01181521202306151234abcdefghijkm',
            chave: 'user@example.com',
            valor: '50.00',
            horario: '2024-06-15T11:00:00.000Z',
          },
        ],
      };
      const result = parseWebhookPayload(multiPayload);
      expect(result.valid).toBe(true);
      expect(result.payload!.pix).toHaveLength(2);
    });
  });

  describe('missing pix array', () => {
    it('returns valid: false when pix is missing', () => {
      const result = parseWebhookPayload({ data: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing or invalid "pix" array in payload');
    });

    it('returns valid: false when pix is not an array', () => {
      const result = parseWebhookPayload({ pix: 'not-array' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing or invalid "pix" array in payload');
    });

    it('returns valid: false when pix is null', () => {
      const result = parseWebhookPayload({ pix: null });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing or invalid "pix" array in payload');
    });
  });

  describe('missing required fields', () => {
    it('returns valid: false when endToEndId is missing', () => {
      const result = parseWebhookPayload({
        pix: [{ chave: 'key', valor: '1.00', horario: '2024-01-01T00:00:00Z' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('pix[0].endToEndId is required');
    });

    it('returns valid: false when chave is missing', () => {
      const result = parseWebhookPayload({
        pix: [
          {
            endToEndId: 'E123',
            valor: '1.00',
            horario: '2024-01-01T00:00:00Z',
          },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('pix[0].chave is required');
    });

    it('returns valid: false when valor is missing', () => {
      const result = parseWebhookPayload({
        pix: [{ endToEndId: 'E123', chave: 'key', horario: '2024-01-01T00:00:00Z' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('pix[0].valor is required');
    });

    it('returns valid: false when horario is missing', () => {
      const result = parseWebhookPayload({
        pix: [{ endToEndId: 'E123', chave: 'key', valor: '1.00' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('pix[0].horario is required');
    });

    it('returns valid: false when pix item is not an object', () => {
      const result = parseWebhookPayload({ pix: ['not-an-object'] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('pix[0] is not an object');
    });

    it('returns valid: false when pix item is null', () => {
      const result = parseWebhookPayload({ pix: [null] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('pix[0] is not an object');
    });
  });

  describe('empty pix array', () => {
    it('returns valid: true for empty pix array', () => {
      const result = parseWebhookPayload({ pix: [] });
      expect(result.valid).toBe(true);
      expect(result.payload!.pix).toHaveLength(0);
    });
  });
});
