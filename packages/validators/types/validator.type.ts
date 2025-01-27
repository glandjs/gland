import { Constructor } from '@gland/common';
import { ValidationOptions } from '../interface/validator.interface';

/**
 * SchemaRegistry keeps track of schemas in the validation system.
 * - `schemaClass` is the actual schema class being referenced.
 * - `options` holds the validation options associated with the schema.
 */
export type SchemaRegistry<T> = Record<string, { schemaClass: Constructor<T>; options: ValidationOptions<T> }>;
