import { ValidationMessages } from '../common/types';

/** Default error messages for validation rules */
export const DefaultMessages: ValidationMessages = {
  // Core validation messages
  required: 'The {field} field is required and cannot be left blank.',
  string: 'The {field} field must contain a valid string.',
  boolean: 'The {field} field must be either true or false.',
  array: 'The {field} field must be an array of values.',
  email: 'The {field} field must contain a valid email address.',
  url: 'The {field} field must contain a valid URL.',
  optional: '', // No message for optional fields
  integer: 'The {field} field must be a valid integer.',
  date: 'The {field} field must contain a valid date.',
  min: 'The {field} field must have a value of at least {value}.',
  max: 'The {field} field must not exceed a value of {value}.',
  regex: 'The {field} field must match the pattern: {pattern}.',

  // Custom validation messages
  custom: 'The {field} field has failed custom validation.',

  // Dependency validation messages
  dependsOn: 'The {field} field requires the {dependentField} field to meet certain conditions.',

  // Dependency rule-specific messages
  dependsOnRules: {
    equal: 'The {field} field must have the same value as {dependentField}.',
    notEqual: 'The {field} field must not have the same value as {dependentField}.',
    greaterThan: 'The {field} field must be greater than the value of {dependentField}.',
    lessThan: 'The {field} field must be less than the value of {dependentField}.',
    greaterOrEqual: 'The {field} field must be greater than or equal to the value of {dependentField}.',
    lessOrEqual: 'The {field} field must be less than or equal to the value of {dependentField}.',
    in: 'The {field} field must contain one of the following values: {allowedValues}.',
    notIn: 'The {field} field must not contain any of the following values: {disallowedValues}.',
    exists: 'The {field} field requires the {dependentField} field to exist.',
    notExists: 'The {field} field requires the {dependentField} field to not exist.',
    startsWith: 'The {field} field must start with "{value}".',
    endsWith: 'The {field} field must end with "{value}".',
    contains: 'The {field} field must include the value "{value}".',
    notContains: 'The {field} field must not include the value "{value}".',
    matches: 'The {field} field must match the pattern "{pattern}".',
    notMatches: 'The {field} field must not match the pattern "{pattern}".',
  },
};
export function renderMessage(message: string, placeholders: Record<string, string | number | Array<string | number>>): string {
  return message.replace(/{(\w+)}/g, (_, key) => String(placeholders[key] ?? `{${key}}`));
}
