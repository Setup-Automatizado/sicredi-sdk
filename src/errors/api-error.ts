import type { BacenErrorResponse, Violacao } from '../types/error';
import { SicrediError } from './base';

export class SicrediApiError extends SicrediError {
  readonly statusCode: number;
  readonly type?: string;
  readonly title: string;
  readonly detail?: string;
  readonly violacoes?: Violacao[];

  constructor(statusCode: number, body: BacenErrorResponse) {
    const message = body.detail ? `${body.title}: ${body.detail}` : body.title;

    super(message, 'API_ERROR');
    this.name = 'SicrediApiError';
    this.statusCode = statusCode;
    this.type = body.type;
    this.title = body.title;
    this.detail = body.detail;
    this.violacoes = body.violacoes;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static fromResponse(statusCode: number, body: unknown): SicrediApiError {
    if (
      typeof body === 'object' &&
      body !== null &&
      'title' in body &&
      typeof (body as Record<string, unknown>).title === 'string'
    ) {
      return new SicrediApiError(statusCode, body as BacenErrorResponse);
    }

    const fallback: BacenErrorResponse = {
      title: 'Unknown API Error',
      status: statusCode,
      detail: typeof body === 'string' ? body : JSON.stringify(body),
    };

    return new SicrediApiError(statusCode, fallback);
  }
}
