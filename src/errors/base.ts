export class SicrediError extends Error {
  readonly code: string;
  readonly hint?: string;

  constructor(message: string, code: string, hint?: string) {
    super(message);
    this.name = 'SicrediError';
    this.code = code;
    this.hint = hint;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
