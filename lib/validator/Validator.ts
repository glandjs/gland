import { ValidationMetadataKey } from '@medishn/gland/common/enums';
import { Constructor, SchemaOptions, ValidationField, ValidationOptions } from '@medishn/gland/common/interfaces';
import { SchemaRegistry, RulesList, SectionErrors } from '@medishn/gland/common/types';
import Reflector from '../metadata';
import { FieldValidator } from './FieldValidator';
import { RuleAction } from './RuleAction';
import { ValidationError } from './ValidationError';

export class ValidatorProcess {
  /** Apply validation to the provided schema and data */
  static validate<T>(schemaClass: Constructor<T>, data: Record<string, any>, returnFirstError: boolean = false): SectionErrors {
    const validationErrors = new ValidationError();
    const nestedSchemas: SchemaRegistry<T> = Reflector.get(ValidationMetadataKey.NESTED, schemaClass) ?? {};

    const validatedSchemas = ValidatorProcess.applyConditions(nestedSchemas, data, validationErrors, returnFirstError);

    ValidatorProcess.checkFields(nestedSchemas, validatedSchemas, data, validationErrors, returnFirstError);

    return validationErrors.errors;
  }
  /** Validate all conditions defined in schema options */
  private static applyConditions<T>(nestedSchemas: SchemaRegistry<T>, data: Record<string, any>, validationErrors: ValidationError, returnFirstError: boolean): Set<Constructor<T>> {
    const validatedSchemas = new Set<Constructor<T>>();
    const conditions = Object.values(nestedSchemas).filter((schema) => schema.options.dependsOn);
    if (conditions.length === 0) {
      return validatedSchemas;
    }
    for (const nestedSchema of conditions) {
      const { schemaClass: nestedSchemaClass, options: schemaOptions } = nestedSchema;

      if (schemaOptions.dependsOn) {
        for (const condition of schemaOptions.dependsOn) {
          const errors = ValidatorProcess.processCondition(condition, nestedSchemas, data, validationErrors, returnFirstError);
          if (errors) {
            validatedSchemas.add(nestedSchemaClass);
            validatedSchemas.add(condition.schema);
          }
        }
      }
    }

    return validatedSchemas;
  }

  /** Validate a condition from schema options */
  private static processCondition<T>(condition: { schema: Constructor<T> }, nestedSchemas: SchemaRegistry<T>, data: Record<string, any>, validationErrors: ValidationError, returnFirstError: boolean) {
    const foundSchema = Object.values(nestedSchemas).find((schema) => schema.schemaClass === condition.schema);
    if (!foundSchema) {
      throw new Error(`Schema '${condition.schema.name}' in conditions is not defined in @NestedSchema.`);
    }
    ValidatorProcess.validateFields(foundSchema.schemaClass, data, validationErrors, returnFirstError);
    if (validationErrors.hasErrors()) {
      return validationErrors.errors;
    }
    return null;
  }

  /** Validate fields for schemas that have not been validated by conditions */
  private static checkFields<T>(nestedSchemas: SchemaRegistry<T>, validatedSchemas: Set<Constructor<T>>, data: Record<string, any>, validationErrors: ValidationError, returnFirstError: boolean) {
    for (const nestedSchema of Object.values(nestedSchemas)) {
      const { schemaClass: nestedSchemaClass, options: schemaOptions } = nestedSchema;

      if (validatedSchemas.has(nestedSchemaClass)) {
        continue; // Skip schemas already validated by conditions
      }

      // Apply schema options like pick, omit, etc.
      ValidatorProcess.applyOptions(nestedSchemaClass, schemaOptions);

      // Validate the fields of the schema
      ValidatorProcess.validateFields(nestedSchemaClass, data, validationErrors, returnFirstError);
    }
  }
  /** Apply schema options like pick, omit, and conditions */
  private static applyOptions<T>(schemaClass: Constructor<T>, schemaOptions: ValidationOptions<T>) {
    if (!schemaOptions) return;

    if (schemaOptions.pick || schemaOptions.omit) {
      if (schemaOptions.pick && schemaOptions.omit) {
        throw new Error("Cannot use both 'pick' and 'omit' options together. Please choose one or the other.");
      }
      const filteredRules = RuleAction.filter(schemaClass, schemaOptions.pick, schemaOptions.omit);
      Reflector.define(ValidationMetadataKey.RULES, filteredRules, schemaClass);
    }
  }

  /** Validate fields and collect errors */
  private static validateFields<T>(nestedSchemaClass: Constructor<T>, data: Record<string, any>, validationErrors: ValidationError, returnFirstError: boolean) {
    const rules: Record<string, ValidationField> = Reflector.get(ValidationMetadataKey.RULES, nestedSchemaClass);
    const schemaMetadata: SchemaOptions = Reflector.get(ValidationMetadataKey.SCHEMA, nestedSchemaClass);

    if (!schemaMetadata) {
      throw new Error(`Metadata not found for schema '${nestedSchemaClass.name}'.`);
    }
    const defaultRules: RulesList = schemaMetadata.defaultRules ?? [];
    const sectionData = data[schemaMetadata.section!] ?? {};
    for (const [fieldKey, fieldRules] of Object.entries(rules)) {
      const mergedRules = {
        ...fieldRules,
        rules: [...(Array.isArray(fieldRules.rules) ? fieldRules.rules : [fieldRules.rules])].filter((rule) => rule !== undefined),
      };

      const value = sectionData[fieldKey];
      const fieldErrors = FieldValidator.validateField(value, mergedRules, fieldKey, returnFirstError, sectionData, defaultRules);

      if (fieldErrors.length) {
        validationErrors.addError(schemaMetadata.section!, fieldKey, fieldErrors);
        if (returnFirstError) return;
      }
    }
  }
}
