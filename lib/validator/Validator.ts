import { ValidationMetadataKey } from '../common/enums';
import { Constructor, SchemaOptions, ValidationField, ValidationOptions } from '../common/interfaces';
import { NestedSchemas, RuleString } from '../common/types';
import Reflector from '../metadata';
import { FieldValidator } from './FieldValidator';
import { RuleAction } from './RuleAction';
import { ValidationError } from './ValidationError';

export class ValidatorProcess {
  /** Apply validation to the provided schema and data */
  static async validate(schemaClass: Constructor<any>, data: Record<string, any>, returnFirstError: boolean = false) {
    const validationErrors = new ValidationError();

    const nestedSchemas: NestedSchemas<any> = Reflector.get(ValidationMetadataKey.NESTED, schemaClass) ?? {};

    for (const [fieldName, nestedSchema] of Object.entries(nestedSchemas)) {
      const { schemaClass: nestedSchemaClass, options: schemaOptions } = nestedSchema;
      ValidatorProcess.applySchemaOptions(nestedSchemaClass, schemaOptions, nestedSchemas);
      await ValidatorProcess.validateFields(nestedSchemaClass, Reflector.get(ValidationMetadataKey.RULES, nestedSchemaClass), data, validationErrors, returnFirstError);
    }
    return validationErrors.errors;
  }

  /** Apply schema options like pick, omit, and conditions */
  private static applySchemaOptions<T>(schemaClass: Constructor<any>, schemaOptions: ValidationOptions<T>, nestedSchemas: NestedSchemas<T>) {
    if (!schemaOptions) return;

    if (schemaOptions.pick || schemaOptions.omit) {
      if (schemaOptions.pick && schemaOptions.omit) {
        throw new Error("Cannot use both 'pick' and 'omit' options together. Please choose one or the other.");
      }
      const filteredRules = RuleAction.filter(schemaClass, schemaOptions.pick, schemaOptions.omit);
      Reflector.define(ValidationMetadataKey.RULES, filteredRules, schemaClass);
    }

    if (schemaOptions.conditions) {
      for (const condition of schemaOptions.conditions) {
        ValidatorProcess.validateCondition(condition, nestedSchemas);
      }
    }
  }

  /** Validate a condition from schema options */
  private static validateCondition<T>(condition: { schema: Constructor<any>; message: string }, nestedSchemas: NestedSchemas<T>) {
    const foundSchema = Object.values(nestedSchemas).find((schema) => schema.schemaClass === condition.schema);
    if (!foundSchema) {
      throw new Error(`Schema '${condition.schema.name}' in conditions is not defined in @NestedSchema.`);
    }

    const schemaMetadata = Reflector.get(ValidationMetadataKey.SCHEMA, foundSchema.schemaClass);
    if (!schemaMetadata) {
      throw new Error(`Metadata not found for schema '${condition.schema.name}'.`);
    }
  }

  /** Validate fields and collect errors */
  private static async validateFields<T>(
    nestedSchemaClass: Constructor<T>,
    rules: Record<string, ValidationField>,
    data: Record<string, any>,
    validationErrors: ValidationError,
    returnFirstError: boolean,
  ) {
    const schemaMetadata: SchemaOptions = Reflector.get(ValidationMetadataKey.SCHEMA, nestedSchemaClass);
    const defaultRules: RuleString = schemaMetadata.defaultRules ?? [];
    const sectionData = data[schemaMetadata.section!] ?? {};

    for (const [fieldKey, fieldRules] of Object.entries(rules)) {
      const mergedRules = {
        ...fieldRules,
        rules: [...(Array.isArray(fieldRules.rules) ? fieldRules.rules : [fieldRules.rules])].filter((rule) => rule !== undefined),
      };

      const value = sectionData[fieldKey];
      const fieldErrors = await FieldValidator.validateField(value, mergedRules, fieldKey, returnFirstError, sectionData, defaultRules);

      if (fieldErrors.length) {
        validationErrors.addError(schemaMetadata.section!, fieldKey, fieldErrors);
        if (returnFirstError) return validationErrors.errors;
      }
    }
  }
}
