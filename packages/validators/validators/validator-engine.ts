import { SectionErrors, Constructor, VALIDATOR_METADATA, RulesList, isNil, RuleCondition } from '@gland/common';
import { FieldValidator } from './field-validator';
import { RuleAction } from '../actions/rule-action';
import { ValidationContainer } from './container';
import Reflector from '@gland/metadata';
import { SchemaRegistry } from '../types/validator.type';
import { ValidationField, ValidationOptions } from '../interface/validator.interface';
import { ConditionEvaluator } from './condition-evaluator';

export class ValidatorEngine {
  /** Apply validation to the provided schema and data */
  static validate<T>(schemaClass: Constructor<T>, data: Record<string, any>, returnFirstError: boolean = false): SectionErrors {
    const container = new ValidationContainer();
    const schemaRegistry = ValidatorEngine.getSchemaRegistry<T>(schemaClass);
    const conditionallyValidated = ConditionEvaluator.process(schemaRegistry, data, container, returnFirstError);

    // Validate remaining non-conditional schemas
    ValidatorEngine.validateRemainingSchemas(schemaRegistry, conditionallyValidated, data, container, returnFirstError);

    return container.errors;
  }

  /** Validate fields for schemas that have not been validated by conditions */
  private static validateRemainingSchemas<T>(registry: SchemaRegistry<T>, validatedSchemas: Set<Constructor<T>>, data: Record<string, any>, container: ValidationContainer, returnFirstError: boolean) {
    for (const { schemaClass, options } of Object.values(registry)) {
      if (validatedSchemas.has(schemaClass)) continue;

      // ValidatorProcess.applyOptions(nestedSchemaClass, schemaOptions);
      ValidatorEngine.SchemaOptionsApplier(schemaClass, options);
      ValidatorEngine.validateSchemaFields(schemaClass, data, container, returnFirstError);
    }
  }
  /** Apply schema options like pick, omit, and conditions */
  private static SchemaOptionsApplier<T>(schemaClass: Constructor<T>, options: ValidationOptions<T>) {
    if (isNil(options)) return;
    if (options.pick && options.omit) {
      throw new Error("Conflict: 'pick' and 'omit' cannot be used together");
    }
    if (options.pick || options.omit) {
      const filteredRules = RuleAction.filter(schemaClass, options.pick, options.omit);
      Reflector.defineMetadata(VALIDATOR_METADATA.RULES_METADATA, filteredRules, schemaClass);
    }
  }

  /** Validate fields and collect errors */
  static validateSchemaFields<T>(schemaClass: Constructor<T>, data: Record<string, any>, contianer: ValidationContainer, returnFirstError: boolean) {
    const rules = ValidatorEngine.getValidationRules(schemaClass);
    const section = ValidatorEngine.getSchemaSection(schemaClass);

    if (!rules) {
      throw Error(`No validation rules found for schema: ${schemaClass.name}`);
    }

    if (!section) {
      throw Error(`No section found for schema: ${schemaClass.name}`);
    }
    const defaultRules = ValidatorEngine.getDefaultRules(schemaClass);

    const sectionData = data[section] ?? {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const mergedRules = ValidatorEngine.mergeRules(fieldRules);
      if (ValidatorEngine.InvalidInheritRule(mergedRules, defaultRules)) {
        throw new Error(`Field '${field}' uses "inherit" without defined default rules.`);
      }
      const value = sectionData[field];
      const fieldErrors = FieldValidator.validateField(value, mergedRules, field, returnFirstError, sectionData, defaultRules);

      if (fieldErrors.length) {
        contianer.addError(section, field, fieldErrors);
        if (returnFirstError) return;
      }
    }
  }
  private static getSchemaRegistry<T>(schemaClass: Constructor<T>): SchemaRegistry<T> {
    return Reflector.getMetadata(VALIDATOR_METADATA.NESTED_SCHEMA_METADATA, schemaClass) ?? {};
  }

  private static getValidationRules<T>(schemaClass: Constructor<T>): Record<string, ValidationField> {
    return Reflector.getMetadata(VALIDATOR_METADATA.RULES_METADATA, schemaClass)!;
  }

  private static getDefaultRules<T>(schemaClass: Constructor<T>): RulesList {
    return Reflector.getMetadata(VALIDATOR_METADATA.RULES_DEFAULTS_METADATA, schemaClass)!;
  }

  private static getSchemaSection<T>(schemaClass: Constructor<T>): string {
    return Reflector.getMetadata<string>(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA, schemaClass)!;
  }
  private static mergeRules(fieldRules: ValidationField): ValidationField {
    return {
      ...fieldRules,
      rules: [...(Array.isArray(fieldRules.rules) ? fieldRules.rules : [fieldRules.rules])].filter((rule) => rule !== undefined),
    };
  }
  private static InvalidInheritRule(fieldRules: ValidationField, defaultRules: RulesList): boolean {
    return !defaultRules && fieldRules.rules.includes('inherit');
  }
}
