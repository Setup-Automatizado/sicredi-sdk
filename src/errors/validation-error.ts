import { SicrediError } from './base';

export class SicrediValidationError extends SicrediError {
  readonly field: string;
  readonly constraint: string;

  constructor(field: string, constraint: string, hint?: string) {
    super(`Validation failed for field '${field}': ${constraint}`, 'VALIDATION_ERROR', hint);
    this.name = 'SicrediValidationError';
    this.field = field;
    this.constraint = constraint;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
