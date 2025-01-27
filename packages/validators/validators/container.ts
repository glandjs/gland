import { SectionErrors } from '@gland/common/types';
/**
 * Validation result container with error accumulation
 */
export class ValidationContainer {
  readonly errors: SectionErrors = {};
  addError(section: string, field: string, messages: string[]): void {
    this.errors[section] ??= {};
    this.errors[section][field] ??= [];
    this.errors[section][field].push(...messages);
  }
  /** Check if there are any errors */
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}
