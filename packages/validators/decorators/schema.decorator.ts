import { VALIDATOR_METADATA } from '@gland/common';
import { SchemaOptions } from '../interface/validator.interface';
import Reflector from '@gland/metadata';

export function Schema(options: SchemaOptions): ClassDecorator {
  const { section = 'body', defaultRules } = options;

  if (defaultRules?.includes('inherit')) {
    throw new Error("The 'inherit' rule cannot be used as a default rule in the schema. Please remove it from the defaultRules array.");
  }
  return (target) => {
    Reflector.defineMetadata(VALIDATOR_METADATA.SCHEMA_METADATA_WATERMARK, true, target);
    Reflector.defineMetadata(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA, section, target);

    if (defaultRules) {
      Reflector.defineMetadata(VALIDATOR_METADATA.RULES_DEFAULTS_METADATA, defaultRules, target);
    }
  };
}
