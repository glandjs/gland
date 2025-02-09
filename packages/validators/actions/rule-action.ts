import 'reflect-metadata';
import { Constructor, RuleOperator, RuleType, VALIDATOR_METADATA } from '@gland/common';
import { ValidationField } from '../interface/validator.interface';
import { ValidationRules } from '../rules/validation.rules';
import { DependencyValidators } from '../rules/dependency-validators.rules';

export class RuleAction {
  private static coreValidator = new ValidationRules();
  private static depValidator = new DependencyValidators();
  static applyRule({ ruleName, param }: { ruleName: RuleType; param?: string }, value: unknown): boolean {
    switch (ruleName) {
      case 'min':
      case 'max':
        if (!param) throw new Error(`Parameter required for ${ruleName} rule`);
        return RuleAction.coreValidator[ruleName](value, param);
      default:
        return RuleAction.coreValidator[ruleName](value);
    }
  }
  static applyDependencyRule({ operator, value }: { operator: RuleOperator; value?: unknown }, dependentValue: unknown): boolean {
    switch (operator) {
      // Handle array-based operations
      case 'in':
      case 'notIn':
        if (!Array.isArray(value)) return false;
        return RuleAction.depValidator[operator](dependentValue, value);
      // Handle existence checks
      case 'exists':
      case 'notExists':
        return RuleAction.depValidator[operator](dependentValue);

      // Handle string operations
      case 'startsWith':
      case 'endsWith':
      case 'contains':
      case 'notContains':
        return RuleAction.validateStringOperation(operator, dependentValue, value);

      // Handle regex operations
      case 'matches':
      case 'notMatches':
        return RuleAction.validateRegexOperation(operator, dependentValue, value);

      // Handle comparison operations
      case 'greaterThan':
      case 'lessThan':
      case 'greaterOrEqual':
      case 'lessOrEqual':
        return RuleAction.validateComparison(operator, dependentValue, value);

      // Default equality checks
      default:
        return RuleAction.depValidator[operator](dependentValue, value);
    }
  }
  private static validateStringOperation(operator: RuleOperator, value: unknown, search: unknown): boolean {
    return typeof value === 'string' && typeof search === 'string' ? (RuleAction.depValidator[operator] as (value: string, search: string) => boolean)(value, search) : false;
  }

  private static validateRegexOperation(operator: RuleOperator, value: unknown, pattern: unknown): boolean {
    return typeof value === 'string' && typeof pattern === 'string' ? (RuleAction.depValidator[operator] as (value: string, pattern: string) => boolean)(value, pattern) : false;
  }

  private static validateComparison(operator: RuleOperator, a: unknown, b: unknown): boolean {
    const validTypes = (x: unknown) => {
      // Convert string numbers to numbers and check if the value is a valid number or Date
      if (typeof x === 'string' && !isNaN(Number(x))) {
        x = Number(x);
      }
      return typeof x === 'number' || Number.isSafeInteger(x) || x instanceof Date;
    };
    return validTypes(a) && validTypes(b) ? (RuleAction.depValidator[operator] as <T extends number | Date>(a: T, b: T) => boolean)(a as number | Date, b as number | Date) : false;
  }

  static filter<T>(schemaClass: Constructor<T>, pick?: (keyof T)[], omit?: (keyof T)[]): Record<string, ValidationField> {
    const rules = Reflect.getMetadata(VALIDATOR_METADATA.RULES_METADATA, schemaClass) ?? {};

    const filteredRules: Record<string, ValidationField> = {};

    if (pick) {
      for (const key of pick) {
        if (key in rules) {
          filteredRules[key as string] = rules[key as string];
        }
      }
    } else if (omit) {
      for (const key in rules) {
        if (!omit.includes(key as keyof T)) {
          filteredRules[key] = rules[key];
        }
      }
    } else {
      return rules; // No filtering if neither `pick` nor `omit` is provided
    }

    return filteredRules;
  }
}
