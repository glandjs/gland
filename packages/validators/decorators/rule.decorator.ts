import { RuleMessages, VALIDATOR_METADATA } from '@gland/common';
import { ValidationField } from '../interface/validator.interface';
import 'reflect-metadata';

export function Rule(options?: { messages?: RuleMessages; options?: ValidationField['options'] }): PropertyDecorator {
  return function (target, propertyKey) {
    const instance = new (target.constructor as any)();
    const rules = instance[propertyKey];
    const existingRules: Record<string, ValidationField> = Reflect.getMetadata(VALIDATOR_METADATA.RULES_METADATA, target.constructor) ?? {};
    existingRules[propertyKey as string] = {
      rules: Array.isArray(rules) ? rules : [rules],
      messages: options?.messages ?? {},
      options: options?.options ?? {},
    };
    Reflect.defineMetadata(VALIDATOR_METADATA.RULES_METADATA, existingRules, target.constructor);
  };
}
