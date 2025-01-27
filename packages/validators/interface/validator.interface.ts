import { RulesList, RuleMessages, RuleOperator, Constructor, RequestSchema } from '@gland/common';
export interface ValidationField {
  /**
   * The validation rules as a string or a custom validation function.
   */
  rules: RulesList;

  /**
   * Custom error messages for specific rule types.
   */
  messages?: RuleMessages;
  /**
   * Additional options for the validation field.
   */
  options?: {
    /**
     * A custom validation function for advanced scenarios.
     */
    custom?: (value: any) => boolean;

    /**
     * Specifies dependencies between fields within the same schema.
     * For example, a "passwordConfirm" field that depends on the "password" field.
     */
    dependsOn?: {
      field: string; // The field this depends on.
      operator: RuleOperator;
      value?: any; // Value to compare against, if applicable.
    };
  };
}
export interface ValidationOptions<T> {
  /**
   * Specifies which fields of the schema to validate.
   * Only the fields in this array will be validated.
   */
  pick?: (keyof T)[];

  /**
   * Specifies which fields of the schema to exclude from validation.
   * All other fields will be validated.
   */
  omit?: (keyof T)[];

  /**
   * Defines conditional relationships between schemas.
   * If the condition is valid, it validates the specified schema.
   */
  dependsOn?: {
    /**
     * The schema class to validate if the condition is met.
     */
    schema: Constructor<any>;
  }[];
}
export interface SchemaOptions {
  /**
   * Specifies a name or section for the schema (e.g., "body", "query").
   */
  section?: RequestSchema;

  /**
   * Applies a default set of rules to all fields in the schema.
   */
  defaultRules?: RulesList;
}
