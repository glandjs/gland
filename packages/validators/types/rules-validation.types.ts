import { RuleOperator, RuleType } from "@gland/common";

/**
 * defines the structure for all rule validation methods.
 * Each method corresponds to a specific validation rule and returns a boolean
 * indicating whether the provided value satisfies the rule.
 */
export type RuleValidation ={
  [K in RuleType]: 
    K extends 'required' ? (value: unknown) => value is NonNullable<unknown> :
    K extends 'string' ? (value: unknown) => value is string :
    K extends 'integer' ? (value: unknown) => value is number :
    K extends 'boolean' ? (value: unknown) => boolean :
    K extends 'min' | 'max' ? (value: unknown, param: string) => boolean :
    K extends 'array' ? (value: unknown) => boolean :
    K extends 'alpha' ? (value: unknown) => boolean :
    K extends 'alphanumeric' ? (value: unknown) => boolean :
    K extends 'float' ? (value: unknown) => boolean :
    K extends 'optional' ? (value: unknown) => boolean :never;
};

/**
 * defines the structure for dependency-based validation methods.
 * Each method corresponds to a specific operator that validates the dependent field's value against a dependency value.
*/
export type DependencyRuleValidation = {
  [K in RuleOperator]: 
    K extends 'equal' ? <T>(a: T, b: T) => boolean :
    K extends 'notEqual' ? <T>(a: T, b: T) => boolean :
    K extends 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual' ? 
      <T extends number | Date>(a: T, b: T) => boolean :
    K extends 'in' | 'notIn' ? <T>(value: T, list: T[]) => boolean :
    K extends 'exists' ? <T>(value: T | null | undefined) => value is T :
    K extends 'notExists' ? <T>(value: T | null | undefined) => boolean :
    K extends 'startsWith' | 'endsWith' | 'contains' | 'notContains' ? 
      (value: string, search: string) => boolean :
    K extends 'matches' | 'notMatches' ? (value: string, pattern: string) => boolean :
    never;
};
