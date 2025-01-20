import { ValidationMetadataKey } from '../common/enums';
import { Constructor, ValidationField } from '../common/interfaces';
import Reflector from '../metadata';

export class RuleAction {
  static applyRule({ param, ruleName }: { ruleName: string; param: string }, value: any): boolean {
    switch (ruleName) {
      case 'required':
        return value !== undefined && value !== null && value !== '';
      case 'string':
        return typeof value === 'string';
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'min':
        return typeof value === 'string' && value.length >= parseInt(param);
      case 'max':
        return typeof value === 'string' && value.length <= parseInt(param);
      case 'array':
        return Array.isArray(value);
      case 'regex':
        return new RegExp(param).test(value);
      case 'url':
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(value);
      default:
        return true;
    }
  }
  static applyDependencyRule({ operator, dependencyValue }: { operator: string; dependencyValue?: any }, dependentFieldValue: any): boolean {
    switch (operator) {
      case 'equal':
        return dependentFieldValue === dependencyValue;
      case 'notEqual':
        return dependentFieldValue !== dependencyValue;
      case 'greaterThan':
        return dependentFieldValue > dependencyValue;
      case 'lessThan':
        return dependentFieldValue < dependencyValue;
      case 'greaterOrEqual':
        return dependentFieldValue >= dependencyValue;
      case 'lessOrEqual':
        return dependentFieldValue <= dependencyValue;
      case 'in':
        return Array.isArray(dependencyValue) && dependencyValue.includes(dependentFieldValue);
      case 'notIn':
        return Array.isArray(dependencyValue) && !dependencyValue.includes(dependentFieldValue);
      case 'exists':
        return dependentFieldValue !== undefined && dependentFieldValue !== null;
      case 'notExists':
        return dependentFieldValue === undefined || dependentFieldValue === null;
      case 'startsWith':
        return typeof dependentFieldValue === 'string' && dependentFieldValue.startsWith(dependencyValue);
      case 'endsWith':
        return typeof dependentFieldValue === 'string' && dependentFieldValue.endsWith(dependencyValue);
      case 'contains':
        return typeof dependentFieldValue === 'string' && dependentFieldValue.includes(dependencyValue);
      case 'notContains':
        return typeof dependentFieldValue === 'string' && !dependentFieldValue.includes(dependencyValue);
      case 'matches':
        return typeof dependentFieldValue === 'string' && new RegExp(dependencyValue).test(dependentFieldValue);
      case 'notMatches':
        return typeof dependentFieldValue === 'string' && !new RegExp(dependencyValue).test(dependentFieldValue);
      default:
        return true; // Default to valid for unknown rules
    }
  }
  static filter<T>(schemaClass: Constructor<T>, pick?: (keyof T)[], omit?: (keyof T)[]): Record<string, ValidationField> {
    const rules: Record<string, ValidationField> = Reflector.get(ValidationMetadataKey.RULES, schemaClass) ?? {};
    const filteredRules: Record<string, ValidationField> = {};
    if (pick) {
      for (const key of pick) {
        if (rules[key as string]) {
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
