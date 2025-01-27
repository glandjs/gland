import { isNil, isNumber, isString } from '@gland/common';
import { RuleValidation } from '../types/rules-validation.types';

export class ValidationRules implements Partial<RuleValidation> {
  required(value: unknown): value is NonNullable<unknown> {
    return !isNil(value);
  }

  string(value: unknown): value is string {
    return isString(value);
  }

  integer(value: unknown): value is number {
    return isNumber(value) && Number.isSafeInteger(value);
  }

  boolean(value: unknown): boolean {
    return typeof value === 'boolean';
  }

  min(value: unknown, param: string): boolean {
    const min = Number(param);
    if (isNumber(value)) return value >= min;
    if (isString(value)) return value.length >= min;
    if (Array.isArray(value)) return value.length >= min;
    return false;
  }

  max(value: unknown, param: string): boolean {
    const max = Number(param);
    if (isNumber(value)) return value <= max;
    if (isString(value)) return value.length <= max;
    if (Array.isArray(value)) return value.length <= max;
    return false;
  }

  array(value: unknown): boolean {
    return Array.isArray(value);
  }

  alpha(value: unknown): boolean {
    return isString(value) && /^[A-Za-z]+$/.test(value);
  }

  alphanumeric(value: unknown): boolean {
    return isString(value) && /^[A-Za-z0-9]+$/.test(value);
  }

  float(value: unknown): boolean {
    return isNumber(value) && !Number.isSafeInteger(value);
  }

  optional(value: unknown): boolean {
    return isNil(value);
  }
}
