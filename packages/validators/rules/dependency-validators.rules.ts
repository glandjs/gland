import { DependencyRuleValidation } from "../types/rules-validation.types";

// Dependency validation rules implementation
export class DependencyValidators implements DependencyRuleValidation {
  equal<T>(a: T, b: T): boolean {
    return a === b;
  }

  notEqual<T>(a: T, b: T): boolean {
    return a !== b;
  }

  greaterThan<T extends number | Date>(a: T, b: T): boolean {
    return a > b;
  }

  lessThan<T extends number | Date>(a: T, b: T): boolean {
    return a < b;
  }

  greaterOrEqual<T extends number | Date>(a: T, b: T): boolean {
    return a >= b;
  }

  lessOrEqual<T extends number | Date>(a: T, b: T): boolean {
    return a <= b;
  }

  in<T>(value: T, list: T[]): boolean {
    return list.includes(value);
  }

  notIn<T>(value: T, list: T[]): boolean {
    return !list.includes(value);
  }

  exists<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
  }

  notExists<T>(value: T | null | undefined): boolean {
    return value === null || value === undefined;
  }

  startsWith(value: string, search: string): boolean {
    return value.startsWith(search);
  }

  endsWith(value: string, search: string): boolean {
    return value.endsWith(search);
  }

  contains(value: string, search: string): boolean {
    return value.includes(search);
  }

  notContains(value: string, search: string): boolean {
    return !value.includes(search);
  }

  matches(value: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(value);
    } catch {
      return false;
    }
  }

  notMatches(value: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return !regex.test(value);
    } catch {
      return false;
    }
  }
}
