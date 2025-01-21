import { Constructor, ValidationOptions } from '../interfaces';

export type RuleType = 'required' | 'string' | 'boolean' | 'array' | 'email' | 'url' | 'optional' | 'integer' | 'date' | 'min' | 'max' | 'regex' | 'inherit';
export type RuleParameter = RuleType | `min:${number}` | `max:${number}`;
export type RuleString = RuleParameter | Array<RuleParameter>;
export type ValidationOperator =
  | 'equal' // Value must equal a specific value
  | 'notEqual' // Value must not equal a specific value
  | 'greaterThan' // Value must be greater than a specific value
  | 'lessThan' // Value must be less than a specific value
  | 'greaterOrEqual' // Value must be greater than or equal to a specific value
  | 'lessOrEqual' // Value must be less than or equal to a specific value
  | 'in' // Value must exist in a list of allowed values
  | 'notIn' // Value must not exist in a list of disallowed values
  | 'exists' // Dependent field must exist
  | 'notExists' // Dependent field must not exist
  | 'startsWith' // Value must start with a specific string
  | 'endsWith' // Value must end with a specific string
  | 'contains' // Value must contain a specific string
  | 'notContains' // Value must not contain a specific string
  | 'matches' // Value must match a specific regex
  | 'notMatches'; // Value must not match a specific regex
export type NestedSchemas<T> = Record<string, { schemaClass: Constructor<T>; options: ValidationOptions<T> }>;
export type ValidationSchema = 'body' | 'query' | 'headers' | 'params';
/** Validation messages for each rule type */
export type ValidationMessages = Partial<Record<RuleType | 'custom' | 'dependsOn', string>> & {
  dependsOnRules?: Record<ValidationOperator, string>;
};
