import Reflector from '../metadata';
import { ValidationMetadataKey } from '../common/enums';
import { SchemaOptions, ValidationField, ValidationOptions } from '../common/interfaces';
import { ValidationMessages } from '../validator/config';
export function Rule(options?: { messages?: ValidationMessages; options?: ValidationField['options'] }): PropertyDecorator {
  return function (target, propertyKey) {
    const instance = new (target.constructor as any)();
    const rules = instance[propertyKey];
    const existingRules: Record<string, ValidationField> = Reflector.get(ValidationMetadataKey.RULES, target.constructor) ?? {};
    existingRules[propertyKey as string] = {
      rules: Array.isArray(rules) ? rules : [rules],
      messages: options?.messages ?? {},
      options: options?.options ?? {},
    };
    Reflector.define(ValidationMetadataKey.RULES, existingRules, target.constructor);
  };
}

export function Schema({ section = 'body', defaultRules }: SchemaOptions): ClassDecorator {
  return (target) => {
    Reflector.define(ValidationMetadataKey.SCHEMA, { section, defaultRules: defaultRules }, target);
  };
}
export function NestedSchema<T = any>(options?: ValidationOptions<T>): PropertyDecorator {
  return function (target, propertyKey) {
    const instance = new (target.constructor as any)();
    let schemaClass: any = instance[propertyKey].constructor;
    if (schemaClass.toString().includes('[native code]')) {
      schemaClass = instance[propertyKey];
    }
    const nestedSchemas = Reflector.get(ValidationMetadataKey.NESTED, target.constructor) ?? {};
    nestedSchemas[propertyKey] = { schemaClass: schemaClass, options: options ?? {} };
    Reflector.define(ValidationMetadataKey.NESTED, nestedSchemas, target.constructor);
  };
}
