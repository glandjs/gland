import { Constructor, VALIDATOR_METADATA } from '@gland/common';
import { ValidationOptions } from '../interface/validator.interface';
import 'reflect-metadata';

/**
 * `@SchemaRef` decorator is used to reference nested schema classes and apply optional validation options.
 * It dynamically infers the schema class type and attaches it to the metadata.
 */
export function SchemaRef<T>(options?: ValidationOptions<T>): PropertyDecorator {
  return function (target, propertyKey) {
    const instance = new (target.constructor as any)();
    const schemaClass: Constructor<T> = instance[propertyKey];

    // Ensure schema class is assigned correctly if not set
    if (typeof schemaClass !== 'function' || !Reflect.getMetadata(VALIDATOR_METADATA.SCHEMA_METADATA_WATERMARK, schemaClass)) {
      throw new Error(`The property '${String(propertyKey)}' must reference a valid schema class.`);
    }
    // Retrieve existing nested schemas or initialize a new object
    const nestedSchemas = Reflect.getMetadata(VALIDATOR_METADATA.NESTED_SCHEMA_METADATA, target.constructor) ?? {};

    nestedSchemas[propertyKey] = { schemaClass: schemaClass, options: options ?? {} };
    Reflect.defineMetadata(VALIDATOR_METADATA.NESTED_SCHEMA_METADATA, nestedSchemas, target.constructor);
  };
}
