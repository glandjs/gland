import { VALIDATOR_METADATA } from '@gland/common';
import { SchemaOptions } from '../interface/validator.interface';
import 'reflect-metadata';

export function Schema(options: SchemaOptions): ClassDecorator {
  const { section = 'body', defaultRules } = options;

  if (defaultRules?.includes('inherit')) {
    throw new Error("The 'inherit' rule cannot be used as a default rule in the schema. Please remove it from the defaultRules array.");
  }
  return (target) => {
    Reflect.defineMetadata(VALIDATOR_METADATA.SCHEMA_METADATA_WATERMARK, true, target);
    Reflect.defineMetadata(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA, section, target);

    if (defaultRules) {
      Reflect.defineMetadata(VALIDATOR_METADATA.RULES_DEFAULTS_METADATA, defaultRules, target);
    }
  };
}
