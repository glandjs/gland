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

    const validatedSchemas = await this.validateConditions(nestedSchemas, data, validationErrors, returnFirstError);

    await this.validateFieldsForSchemas(nestedSchemas, validatedSchemas, data, validationErrors, returnFirstError);

    return validationErrors.errors;
  }
  /** Validate all conditions defined in schema options */
  private static async validateConditions(nestedSchemas: NestedSchemas<any>, data: Record<string, any>, validationErrors: ValidationError, returnFirstError: boolean): Promise<Set<Constructor<any>>> {
    const validatedSchemas = new Set<Constructor<any>>();
    const conditions = Object.values(nestedSchemas).filter((schema) => schema.options.conditions);

    for (const nestedSchema of conditions) {
      const { schemaClass: nestedSchemaClass, options: schemaOptions } = nestedSchema;

      if (schemaOptions.conditions) {
        for (const condition of schemaOptions.conditions) {
          const errors = await this.validateCondition(condition, nestedSchemas, data, validationErrors, returnFirstError);
          if (errors) {
            validatedSchemas.add(nestedSchemaClass);
            validatedSchemas.add(condition.schema);
          }
        }
      }
    }

    return validatedSchemas;
  }
  /** Validate fields for schemas that have not been validated by conditions */
  private static async validateFieldsForSchemas(
    nestedSchemas: NestedSchemas<any>,
    validatedSchemas: Set<Constructor<any>>,
    data: Record<string, any>,
    validationErrors: ValidationError,
    returnFirstError: boolean,
  ) {
    for (const nestedSchema of Object.values(nestedSchemas)) {
      const { schemaClass: nestedSchemaClass, options: schemaOptions } = nestedSchema;

      if (validatedSchemas.has(nestedSchemaClass)) {
        continue; // Skip schemas already validated by conditions
      }

      // Apply schema options like pick, omit, etc.
      this.applySchemaOptions(nestedSchemaClass, schemaOptions);

      // Validate the fields of the schema
      await this.validateFields(nestedSchemaClass, data, validationErrors, returnFirstError);
    }
  }
  /** Apply schema options like pick, omit, and conditions */
  private static applySchemaOptions<T>(schemaClass: Constructor<any>, schemaOptions: ValidationOptions<T>) {
    if (!schemaOptions) return;

    if (schemaOptions.pick || schemaOptions.omit) {
      if (schemaOptions.pick && schemaOptions.omit) {
        throw new Error("Cannot use both 'pick' and 'omit' options together. Please choose one or the other.");
      }
      const filteredRules = RuleAction.filter(schemaClass, schemaOptions.pick, schemaOptions.omit);
      Reflector.define(ValidationMetadataKey.RULES, filteredRules, schemaClass);
    }
  }

  /** Validate a condition from schema options */
  private static async validateCondition<T>(
    condition: { schema: Constructor<any> },
    nestedSchemas: NestedSchemas<T>,
    data: Record<string, any>,
    validationErrors: ValidationError,
    returnFirstError: boolean,
  ) {
    const foundSchema = Object.values(nestedSchemas).find((schema) => schema.schemaClass === condition.schema);
    if (!foundSchema) {
      throw new Error(`Schema '${condition.schema.name}' in conditions is not defined in @NestedSchema.`);
    }
    await ValidatorProcess.validateFields(foundSchema.schemaClass, data, validationErrors, returnFirstError);
    if (validationErrors.hasErrors()) {
      return validationErrors.errors;
    }
    return null;
  }

  /** Validate fields and collect errors */
  private static async validateFields<T>(nestedSchemaClass: Constructor<T>, data: Record<string, any>, validationErrors: ValidationError, returnFirstError: boolean) {
    const rules: Record<string, ValidationField> = Reflector.get(ValidationMetadataKey.RULES, nestedSchemaClass);
    const schemaMetadata: SchemaOptions = Reflector.get(ValidationMetadataKey.SCHEMA, nestedSchemaClass);

    if (!schemaMetadata) {
      throw new Error(`Metadata not found for schema '${nestedSchemaClass.name}'.`);
    }
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
        if (returnFirstError) return;
      }
    }
  }
}
