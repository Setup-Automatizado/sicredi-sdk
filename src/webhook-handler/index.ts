import type { WebhookCallbackPayload } from '../types/webhook';

export interface WebhookParseResult {
  valid: boolean;
  payload?: WebhookCallbackPayload;
  error?: string;
}

/**
 * Parse a webhook callback body from Sicredi/Bacen.
 * Works with both string and object inputs (for Express/Koa/Bun).
 *
 * IMPORTANT: Sicredi appends '/pix' to your configured webhook URL.
 * If you configure 'https://example.com/webhook', callbacks will be
 * sent to 'https://example.com/webhook/pix'.
 * Make sure your server handles the '/pix' suffix route.
 */
export function parseWebhookPayload(body: string | object): WebhookParseResult {
  let parsed: unknown;

  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      return { valid: false, error: 'Invalid JSON body' };
    }
  } else {
    parsed = body;
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Body is not an object' };
  }

  const data = parsed as Record<string, unknown>;

  if (!Array.isArray(data.pix)) {
    return { valid: false, error: 'Missing or invalid "pix" array in payload' };
  }

  for (const [i, item] of data.pix.entries()) {
    if (!item || typeof item !== 'object') {
      return { valid: false, error: `pix[${i}] is not an object` };
    }
    const pix = item as Record<string, unknown>;
    if (typeof pix.endToEndId !== 'string') {
      return { valid: false, error: `pix[${i}].endToEndId is required` };
    }
    if (typeof pix.chave !== 'string') {
      return { valid: false, error: `pix[${i}].chave is required` };
    }
    if (typeof pix.valor !== 'string') {
      return { valid: false, error: `pix[${i}].valor is required` };
    }
    if (typeof pix.horario !== 'string') {
      return { valid: false, error: `pix[${i}].horario is required` };
    }
  }

  return {
    valid: true,
    payload: parsed as WebhookCallbackPayload,
  };
}
