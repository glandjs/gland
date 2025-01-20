export class ValidationError {
  errors: Record<string, Record<string, string[]>> = {};

  addError(section: string, field: string, message: string[]): void {
    if (!this.errors[section]) this.errors[section] = {};
    if (!this.errors[section][field]) this.errors[section][field] = [];
    this.errors[section][field].push(...message);
  }
}
