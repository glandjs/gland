import { SectionErrors } from '@medishn/gland/common/types';
export class ValidationError {
  errors: SectionErrors = {};
  addError(section: string, field: string, message: string[]): void {
    if (!this.errors[section]) {
      this.errors[section] = {};
    }
    if (!this.errors[section][field]) {
      this.errors[section][field] = [];
    }
    this.errors[section][field].push(...message);
  }
  /** Check if there are any errors */
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}
